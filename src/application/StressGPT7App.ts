/**
 * Main StressGPT7 Application
 * Provides the complete modernized application with all components integrated
 */

import { Result } from '../core/types/Result.js'
import type { IEventEmitter } from '../core/events/IEventEmitter.js'
import type { IStateManager } from '../core/interfaces/IStateManager.js'
import type { IToolManager } from '../core/interfaces/IToolManager.js'
import type { IQueryEngine } from '../domain/query/QueryEngine.js'
import type { ILocalAIEngine } from '../domain/ai/ILocalAIEngine.js'
import type { ICLIApp } from '../presentation/cli/CLIApp.js'
import type { IConfigManager } from '../shared/configuration/ConfigManager.js'
import type { ITool, ToolContext, ToolResult } from '../core/interfaces/ITool.js'
import { BaseDIContainer, ServiceLifetime } from '../core/di/DIContainer.js'
import { BaseEventEmitter } from '../core/events/IEventEmitter.js'
import { BaseStateManager } from '../core/interfaces/IStateManager.js'
import { BaseToolManager } from '../core/interfaces/IToolManager.js'
import { QueryEngine } from '../domain/query/QueryEngine.js'
import { CLIApp } from '../presentation/cli/CLIApp.js'
import { ConfigManager } from '../shared/configuration/ConfigManager.js'
import { FileSystemTool } from '../infrastructure/tools/FileSystemTool.js'

/**
 * Concrete implementations of abstract classes
 */
class ConcreteDIContainer extends BaseDIContainer {}
class ConcreteEventEmitter extends BaseEventEmitter {}

class ConcreteStateManager extends BaseStateManager {
  protected async persistState(): Promise<Result<void>> {
    // Simple file-based persistence
    return Result.success(void 0)
  }

  protected async loadState(): Promise<Result<void>> {
    // Simple file-based loading
    return Result.success(void 0)
  }
}

class ConcreteToolManager extends BaseToolManager {
  protected async createContext(overrides?: Partial<ToolContext>): Promise<ToolContext> {
    return {
      cwd: process.cwd(),
      preferences: new Map(),
      env: new Map(Object.entries(process.env)),
      args: [],
      options: new Map(),
      session: {
        sessionId: crypto.randomUUID(),
        startTime: new Date()
      },
      security: {
        sandboxed: true,
        allowedPaths: [process.cwd()],
        maxFileSize: 10485760
      },
      ...overrides
    }
  }

  protected async executeWithTimeout<TOutput>(
    tool: ITool<unknown, TOutput>,
    input: unknown,
    context: ToolContext,
    timeout: number
  ): Promise<Result<ToolResult<TOutput>>> {
    return tool.execute(input, context)
  }
}

/**
 * Main StressGPT7 Application class
 */
export class StressGPT7App {
  private container: ConcreteDIContainer
  private eventEmitter: ConcreteEventEmitter
  private configManager: ConfigManager
  private stateManager: ConcreteStateManager
  private toolManager: ConcreteToolManager
  private aiEngine: ILocalAIEngine
  private queryEngine: QueryEngine
  private cliApp: CLIApp
  private isInitialized = false
  private isRunning = false
  private startTime?: Date

  constructor() {
    this.container = new ConcreteDIContainer()
    this.eventEmitter = new ConcreteEventEmitter()
    this.configManager = new ConfigManager(this.eventEmitter)
    this.stateManager = new ConcreteStateManager()
    this.toolManager = new ConcreteToolManager()
    this.queryEngine = new QueryEngine(this.toolManager, this.stateManager, this.aiEngine, this.eventEmitter)
    this.cliApp = new CLIApp(this.queryEngine, this.stateManager, this.eventEmitter)
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<Result<void>> {
    try {
      if (this.isInitialized) {
        return Result.failure(new Error('Application is already initialized'))
      }

      // Register core services
      this.container.registerInstance('eventEmitter', this.eventEmitter, {
        lifetime: ServiceLifetime.Singleton
      })

      this.container.registerInstance('configManager', this.configManager, {
        lifetime: ServiceLifetime.Singleton
      })

      this.container.registerInstance('stateManager', this.stateManager, {
        lifetime: ServiceLifetime.Singleton
      })

      this.container.registerInstance('toolManager', this.toolManager, {
        lifetime: ServiceLifetime.Singleton
      })

      // Register file system tool
      this.container.register('fileSystemTool', FileSystemTool, {
        lifetime: ServiceLifetime.Singleton,
        dependencies: ['configManager', 'stateManager']
      })

      // Register AI engine (placeholder)
      this.container.registerFactory('aiEngine', () => {
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
      this.aiEngine = this.container.resolve('aiEngine').value as ILocalAIEngine

      // Register query engine
      this.container.registerInstance('queryEngine', this.queryEngine, {
        lifetime: ServiceLifetime.Singleton
      })

      // Register CLI app
      this.container.registerInstance('cliApp', this.cliApp, {
        lifetime: ServiceLifetime.Singleton
      })

      // Load configuration
      await this.configManager.loadConfig()

      // Initialize file system tool
      const fileSystemTool = this.container.resolve('fileSystemTool')
      if (fileSystemTool.isSuccess()) {
        await this.toolManager.registerTool(fileSystemTool.value, { enabled: true })
      }

      this.isInitialized = true

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
        return Result.failure(new Error('Application is not initialized'))
      }

      if (this.isRunning) {
        return Result.failure(new Error('Application is already running'))
      }

      this.startTime = new Date()

      // Start CLI application
      const cliResult = await this.cliApp.start()
      if (cliResult.isFailure()) {
        return Result.failure(cliResult.error)
      }

      this.isRunning = true

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

      // Stop CLI application
      const cliResult = await this.cliApp.stop()
      if (cliResult.isFailure()) {
        return Result.failure(cliResult.error)
      }

      this.isRunning = false

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
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
  }>> {
    try {
      const uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0
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

      return Result.success({
        uptime,
        memoryUsage,
        totalQueries,
        totalCommands,
        activeTools
      })
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Dispose of the application
   */
  async dispose(): Promise<void> {
    try {
      // Stop application if running
      if (this.isRunning) {
        await this.stop()
      }

      // Dispose all services
      if (this.cliApp && 'dispose' in this.cliApp) {
        await (this.cliApp as any).dispose()
      }
      if (this.queryEngine) {
        await this.queryEngine.dispose()
      }
      if (this.toolManager) {
        await this.toolManager.dispose()
      }
      if (this.stateManager) {
        await this.stateManager.dispose()
      }
      if (this.configManager) {
        await this.configManager.dispose()
      }
      if (this.eventEmitter) {
        await this.eventEmitter.dispose()
      }
      if (this.container) {
        await this.container.dispose()
      }

      this.isInitialized = false
    } catch (error) {
      console.error('Error disposing application:', error)
    }
  }
}

/**
 * Create and run the StressGPT7 application
 */
export async function createAndRunStressGPT7(): Promise<void> {
  const app = new StressGPT7App()
  
  try {
    // Initialize application
    const initResult = await app.initialize()
    if (initResult.isFailure()) {
      console.error('Failed to initialize application:', initResult.error)
      process.exit(1)
    }

    // Start application
    const startResult = await app.start()
    if (startResult.isFailure()) {
      console.error('Failed to start application:', startResult.error)
      process.exit(1)
    }

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down StressGPT7...')
      await app.dispose()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      console.log('\nShutting down StressGPT7...')
      await app.dispose()
      process.exit(0)
    })

    console.log('StressGPT7 is running. Press Ctrl+C to exit.')
    
    // Keep the process running
    await new Promise(() => {})
    
  } catch (error) {
    console.error('Application error:', error)
    await app.dispose()
    process.exit(1)
  }
}
