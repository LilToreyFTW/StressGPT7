/**
 * Application Container for StressGPT7
 * Provides dependency injection and component orchestration
 */

import { Result } from '../core/types/Result.js'
import type { IDIContainer } from '../core/di/DIContainer.js'
import type { IEventEmitter } from '../core/events/IEventEmitter.js'
import type { IStateManager } from '../core/interfaces/IStateManager.js'
import type { IToolManager } from '../core/interfaces/IToolManager.js'
import type { IQueryEngine } from '../domain/query/QueryEngine.js'
import type { ILocalAIEngine } from '../domain/ai/ILocalAIEngine.js'
import type { ICLIApp } from '../presentation/cli/CLIApp.js'
import type { IConfigManager } from '../shared/configuration/ConfigManager.js'
import { BaseDIContainer, ServiceLifetime } from '../core/di/DIContainer.js'
import { BaseEventEmitter } from '../core/events/IEventEmitter.js'
import { BaseStateManager } from '../core/interfaces/IStateManager.js'
import { BaseToolManager } from '../core/interfaces/IToolManager.js'
import { QueryEngine } from '../domain/query/QueryEngine.js'
import { CLIApp } from '../presentation/cli/CLIApp.js'
import { ConfigManager } from '../shared/configuration/ConfigManager.js'
import { FileSystemTool } from '../infrastructure/tools/FileSystemTool.js'

/**
 * Application container configuration
 */
export interface ApplicationContainerConfig {
  /** Configuration file path */
  readonly configPath?: string
  /** Enable debug mode */
  readonly debug?: boolean
  /** Enable profiling */
  readonly profiling?: boolean
  /** Custom service registrations */
  readonly customServices?: Array<{
    readonly id: string
    readonly implementation: unknown
    readonly lifetime?: ServiceLifetime
    readonly dependencies?: string[]
  }>
}

/**
 * Application container interface
 */
export interface IApplicationContainer {
  /**
   * Initialize the application container
   */
  initialize(): Promise<Result<void>>

  /**
   * Start the application
   */
  start(): Promise<Result<void>>

  /**
   * Stop the application
   */
  stop(): Promise<Result<void>>

  /**
   * Get a service from the container
   */
  getService<T>(id: string): Result<T>

  /**
   * Get the DI container
   */
  getContainer(): IDIContainer

  /**
   * Get application statistics
   */
  getStats(): Promise<Result<{
    readonly uptime: number
    readonly memoryUsage: number
    readonly totalQueries: number
    readonly totalCommands: number
    readonly activeTools: number
    readonly configuration: {
      readonly app: any
      readonly ai: any
      readonly cli: any
    }
  }>>

  /**
   * Dispose of the application container
   */
  dispose(): Promise<void>
}

/**
 * Application Container implementation
 */
export class ApplicationContainer implements IApplicationContainer {
  private container: IDIContainer
  private eventEmitter: IEventEmitter
  private configManager: IConfigManager
  private stateManager: IStateManager
  private toolManager: IToolManager
  private aiEngine: ILocalAIEngine
  private queryEngine: IQueryEngine
  private cliApp: ICLIApp
  private config: ApplicationContainerConfig
  private isInitialized = false
  private isRunning = false
  private startTime?: Date

  constructor(config: ApplicationContainerConfig = {}) {
    this.config = config
    this.container = new BaseDIContainer()
    this.eventEmitter = new BaseEventEmitter()
    this.configManager = new ConfigManager(this.eventEmitter, config.configPath)
    this.stateManager = new BaseStateManager()
    this.toolManager = new BaseToolManager(this.configManager, this.stateManager)
    this.queryEngine = new QueryEngine(this.toolManager, this.stateManager, this.aiEngine, this.eventEmitter)
    this.cliApp = new CLIApp(this.queryEngine, this.stateManager, this.eventEmitter)
  }

  /**
   * Initialize the application container
   */
  async initialize(): Promise<Result<void>> {
    try {
      if (this.isInitialized) {
        return Result.failure(new Error('Application container is already initialized'))
      }

      // Register core services
      await this.registerCoreServices()

      // Register infrastructure services
      await this.registerInfrastructureServices()

      // Register domain services
      await this.registerDomainServices()

      // Register presentation services
      await this.registerPresentationServices()

      // Register custom services
      await this.registerCustomServices()

      // Load configuration
      await this.configManager.loadConfig()

      // Initialize all services
      await this.initializeServices()

      this.isInitialized = true

      // Emit initialized event
      await this.eventEmitter.emit('app:initialized', { timestamp: new Date() }, 'ApplicationContainer')

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Start the application
   */
  async start(): Promise<Result<void>> {
    try {
      if (!this.isInitialized) {
        return Result.failure(new Error('Application container is not initialized'))
      }

      if (this.isRunning) {
        return Result.failure(new Error('Application is already running'))
      }

      this.startTime = new Date()

      // Start core services
      await this.eventEmitter.emit('app:starting', { timestamp: this.startTime }, 'ApplicationContainer')

      // Start CLI application
      const cliResult = await this.cliApp.start()
      if (cliResult.isFailure()) {
        return Result.failure(cliResult.error)
      }

      this.isRunning = true

      // Emit started event
      await this.eventEmitter.emit('app:started', { 
        timestamp: new Date(),
        startTime: this.startTime
      }, 'ApplicationContainer')

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Stop the application
   */
  async stop(): Promise<Result<void>> {
    try {
      if (!this.isRunning) {
        return Result.failure(new Error('Application is not running'))
      }

      // Emit stopping event
      await this.eventEmitter.emit('app:stopping', { timestamp: new Date() }, 'ApplicationContainer')

      // Stop CLI application
      const cliResult = await this.cliApp.stop()
      if (cliResult.isFailure()) {
        return Result.failure(cliResult.error)
      }

      this.isRunning = false

      // Emit stopped event
      await this.eventEmitter.emit('app:stopped', { 
        timestamp: new Date(),
        uptime: this.getUptime()
      }, 'ApplicationContainer')

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get a service from the container
   */
  getService<T>(id: string): Result<T> {
    return this.container.resolve<T>(id)
  }

  /**
   * Get the DI container
   */
  getContainer(): IDIContainer {
    return this.container
  }

  /**
   * Get application statistics
   */
  async getStats(): Promise<Result<{
    readonly uptime: number
    readonly memoryUsage: number
    readonly totalQueries: number
    readonly totalCommands: number
    readonly activeTools: number
    readonly configuration: {
      readonly app: any
      readonly ai: any
      readonly cli: any
    }
  }>> {
    try {
      const uptime = this.getUptime()
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024 // MB

      // Get query engine stats
      const queryStats = await this.queryEngine.getStats()
      const totalQueries = queryStats.isSuccess() ? queryStats.value.totalQueries : 0

      // Get CLI stats
      const cliStats = await this.cliApp.getStats()
      const totalCommands = cliStats.isSuccess() ? cliStats.value.totalMessages : 0

      // Get tool manager stats
      const toolStats = await this.toolManager.getStats()
      const activeTools = toolStats.isSuccess() ? toolStats.value.enabledTools : 0

      // Get configuration
      const config = this.configManager.getAll()
      const configuration = config.isSuccess() ? {
        app: config.value.app,
        ai: config.value.ai,
        cli: config.value.cli
      } : {
        app: {},
        ai: {},
        cli: {}
      }

      return Result.success({
        uptime,
        memoryUsage,
        totalQueries,
        totalCommands,
        activeTools,
        configuration
      })
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Dispose of the application container
   */
  async dispose(): Promise<void> {
    try {
      // Stop application if running
      if (this.isRunning) {
        await this.stop()
      }

      // Dispose all services
      await this.cliApp.dispose()
      await this.queryEngine.dispose()
      await this.toolManager.dispose()
      await this.stateManager.dispose()
      await this.configManager.dispose()
      await this.eventEmitter.dispose()
      await this.container.dispose()

      this.isInitialized = false

      // Emit disposed event
      await this.eventEmitter.emit('app:disposed', { timestamp: new Date() }, 'ApplicationContainer')
    } catch (error) {
      console.error('Error disposing application container:', error)
    }
  }

  /**
   * Register core services
   */
  private async registerCoreServices(): Promise<void> {
    // Register event emitter
    this.container.registerInstance('eventEmitter', this.eventEmitter, {
      lifetime: ServiceLifetime.Singleton
    })

    // Register configuration manager
    this.container.registerInstance('configManager', this.configManager, {
      lifetime: ServiceLifetime.Singleton
    })

    // Register state manager
    this.container.registerInstance('stateManager', this.stateManager, {
      lifetime: ServiceLifetime.Singleton
    })
  }

  /**
   * Register infrastructure services
   */
  private async registerInfrastructureServices(): Promise<void> {
    // Register tool manager
    this.container.registerInstance('toolManager', this.toolManager, {
      lifetime: ServiceLifetime.Singleton
    })

    // Register file system tool
    this.container.register('fileSystemTool', FileSystemTool, {
      lifetime: ServiceLifetime.Singleton,
      dependencies: ['configManager', 'stateManager']
    })

    // Register tool manager with file system tool
    await this.toolManager.registerTool(
      this.container.resolve('fileSystemTool').value,
      { enabled: true }
    )
  }

  /**
   * Register domain services
   */
  private async registerDomainServices(): Promise<void> {
    // Register AI engine (placeholder for now)
    this.container.registerFactory('aiEngine', () => {
      // TODO: Implement actual AI engine
      return {
        processQuery: async () => Result.failure(new Error('AI engine not implemented')),
        analyzeQuery: async () => Result.failure(new Error('AI engine not implemented')),
        searchKnowledgeBase: async () => Result.success([]),
        addToKnowledgeBase: async () => Result.success('id'),
        removeFromKnowledgeBase: async () => Result.success(void 0),
        updateKnowledgeBase: async () => Result.success(void 0),
        getStats: async () => Result.success({
          totalQueries: 0,
          averageResponseTime: 0,
          averageConfidence: 0,
          knowledgeBaseSize: 0,
          topDomains: []
        }),
        configure: async () => Result.success(void 0),
        dispose: async () => {}
      }
    }, {
      lifetime: ServiceLifetime.Singleton
    })

    // Get AI engine instance
    this.aiEngine = this.container.resolve('aiEngine').value

    // Register query engine
    this.container.registerInstance('queryEngine', this.queryEngine, {
      lifetime: ServiceLifetime.Singleton,
      dependencies: ['toolManager', 'stateManager', 'aiEngine', 'eventEmitter']
    })
  }

  /**
   * Register presentation services
   */
  private async registerPresentationServices(): Promise<void> {
    // Register CLI application
    this.container.registerInstance('cliApp', this.cliApp, {
      lifetime: ServiceLifetime.Singleton,
      dependencies: ['queryEngine', 'stateManager', 'eventEmitter']
    })
  }

  /**
   * Register custom services
   */
  private async registerCustomServices(): Promise<void> {
    if (!this.config.customServices) {
      return
    }

    for (const service of this.config.customServices) {
      this.container.register(service.id, service.implementation, {
        lifetime: service.lifetime || ServiceLifetime.Transient,
        dependencies: service.dependencies
      })
    }
  }

  /**
   * Initialize all services
   */
  private async initializeServices(): Promise<void> {
    // Initialize state manager
    await this.stateManager.initialize({
      persistToDisk: true,
      persistInterval: 60000 // 1 minute
    })

    // Initialize tool manager
    await this.toolManager.initialize()

    // Initialize query engine
    await this.queryEngine.initialize()

    // Initialize CLI app
    await this.cliApp.initialize()
  }

  /**
   * Get application uptime
   */
  private getUptime(): number {
    return this.startTime ? Date.now() - this.startTime.getTime() : 0
  }
}
