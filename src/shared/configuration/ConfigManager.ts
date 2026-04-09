/**
 * Enhanced Configuration Manager for StressGPT7
 * Provides comprehensive configuration management with validation and hot reloading
 */

import { Result } from '../../core/types/Result.js'
import type { IEventEmitter } from '../../core/events/IEventEmitter.ts'
import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'

/**
 * Configuration schema definition
 */
export interface ConfigSchema {
  /** Application configuration */
  readonly app: {
    readonly name: string
    readonly version: string
    readonly environment: 'development' | 'production' | 'test'
    readonly debug: boolean
    readonly logLevel: 'debug' | 'info' | 'warn' | 'error'
  }
  /** AI configuration */
  readonly ai: {
    readonly model: string
    readonly temperature: number
    readonly maxTokens: number
    readonly reasoningDepth: number
    readonly confidenceThreshold: number
    readonly timeout: number
  }
  /** CLI configuration */
  readonly cli: {
    readonly theme: {
      readonly primary: string
      readonly secondary: string
      readonly accent: string
      readonly background: string
      readonly text: string
      readonly error: string
      readonly warning: string
      readonly success: string
    }
    readonly keybindings: {
      readonly vimMode: boolean
      readonly customKeybindings: Record<string, string>
    }
    readonly voice: {
      readonly enabled: boolean
      readonly language: string
      readonly voiceId: string
      readonly autoDetect: boolean
    }
    readonly display: {
      readonly showLineNumbers: boolean
      readonly showTimestamps: boolean
      readonly showAvatars: boolean
      readonly compactMode: boolean
      readonly maxHistoryLines: number
    }
  }
  /** Tools configuration */
  readonly tools: {
    readonly enabled: readonly string[]
    readonly disabled: readonly string[]
    readonly timeouts: Record<string, number>
    readonly security: {
      readonly sandboxed: boolean
      readonly allowedPaths: readonly string[]
      readonly maxFileSize: number
    }
  }
  /** Performance configuration */
  readonly performance: {
    readonly maxConcurrentQueries: number
    readonly cacheEnabled: boolean
    readonly cacheSize: number
    readonly cacheTimeout: number
    readonly profiling: boolean
  }
  /** Security configuration */
  readonly security: {
    readonly encryptionEnabled: boolean
    readonly encryptionKey?: string
    readonly sessionTimeout: number
    readonly maxLoginAttempts: number
  }
  /** Network configuration */
  readonly network: {
    readonly timeout: number
    readonly retries: number
    readonly retryDelay: number
    readonly proxy?: {
      readonly host: string
      readonly port: number
      readonly username?: string
      readonly password?: string
    }
  }
  /** Storage configuration */
  readonly storage: {
    readonly type: 'file' | 'memory' | 'database'
    readonly path: string
    readonly backup: boolean
    readonly backupInterval: number
    readonly compression: boolean
  }
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Whether the configuration is valid */
  readonly valid: boolean
  /** Validation errors */
  readonly errors: Array<{
    readonly path: string
    readonly message: string
    readonly severity: 'error' | 'warning'
  }>
  /** Validation warnings */
  readonly warnings: Array<{
    readonly path: string
    readonly message: string
  }>
}

/**
 * Configuration change event
 */
export interface ConfigChangeEvent {
  /** Configuration path that changed */
  readonly path: string
  /** Old value */
  readonly oldValue: unknown
  /** New value */
  readonly newValue: unknown
  /** Change timestamp */
  readonly timestamp: Date
}

/**
 * Core configuration manager interface
 */
export interface IConfigManager {
  /**
   * Load configuration from file
   */
  loadConfig(filePath?: string): Promise<Result<ConfigSchema>>

  /**
   * Save configuration to file
   */
  saveConfig(filePath?: string): Promise<Result<void>>

  /**
   * Get configuration value
   */
  get<T>(path: string): Result<T>

  /**
   * Set configuration value
   */
  set<T>(path: string, value: T): Promise<Result<void>>

  /**
   * Get entire configuration
   */
  getAll(): Result<ConfigSchema>

  /**
   * Validate configuration
   */
  validate(config?: ConfigSchema): Result<ConfigValidationResult>

  /**
   * Reset configuration to defaults
   */
  reset(): Promise<Result<void>>

  /**
   * Reload configuration from file
   */
  reload(): Promise<Result<void>>

  /**
   * Watch for configuration changes
   */
  watch(): Promise<Result<void>>

  /**
   * Stop watching for changes
   */
  unwatch(): Promise<Result<void>>

  /**
   * Get configuration schema
   */
  getSchema(): Record<string, unknown>

  /**
   * Export configuration
   */
  export(format: 'json' | 'yaml' | 'toml'): Promise<Result<string>>

  /**
   * Import configuration
   */
  import(data: string, format: 'json' | 'yaml' | 'toml'): Promise<Result<void>>

  /**
   * Dispose of the configuration manager
   */
  dispose(): Promise<void>
}

/**
 * Enhanced Configuration Manager implementation
 */
export class ConfigManager implements IConfigManager {
  private config: ConfigSchema
  private defaultConfig: ConfigSchema
  private eventEmitter: IEventEmitter
  private configPath: string
  private isWatching = false
  private watcher?: any

  constructor(eventEmitter: IEventEmitter, configPath?: string) {
    this.eventEmitter = eventEmitter
    this.configPath = configPath || this.getDefaultConfigPath()
    this.defaultConfig = this.createDefaultConfig()
    this.config = { ...this.defaultConfig }
  }

  /**
   * Load configuration from file
   */
  async loadConfig(filePath?: string): Promise<Result<ConfigSchema>> {
    try {
      const path = filePath || this.configPath
      
      // Read configuration file
      const data = await readFile(path, 'utf8')
      const parsedConfig = JSON.parse(data)

      // Validate configuration
      const validationResult = this.validate(parsedConfig)
      if (validationResult.isFailure()) {
        return Result.failure(validationResult.error)
      }
      if (!validationResult.value.valid) {
        return Result.failure(new Error(`Invalid configuration: ${validationResult.value.errors.map(e => e.message).join(', ')}`))
      }

      // Merge with defaults
      this.config = this.mergeConfigs(this.defaultConfig, parsedConfig)

      // Emit configuration loaded event
      await this.eventEmitter.emit('config:loaded', { config: this.config, path }, 'ConfigManager')

      return Result.success(this.config)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(filePath?: string): Promise<Result<void>> {
    try {
      const path = filePath || this.configPath
      
      // Ensure directory exists
      await this.ensureDirectoryExists(path)

      // Validate configuration
      const validationResult = this.validate()
      if (validationResult.isFailure()) {
        return Result.failure(validationResult.error)
      }
      if (!validationResult.value.valid) {
        return Result.failure(new Error(`Invalid configuration: ${validationResult.value.errors.map(e => e.message).join(', ')}`))
      }

      // Write configuration file
      const data = JSON.stringify(this.config, null, 2)
      await writeFile(path, data, 'utf8')

      // Emit configuration saved event
      await this.eventEmitter.emit('config:saved', { config: this.config, path }, 'ConfigManager')

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get configuration value
   */
  get<T>(path: string): Result<T> {
    try {
      const value = this.getNestedValue(this.config, path)
      return Result.success(value as T)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Set configuration value
   */
  async set<T>(path: string, value: T): Promise<Result<void>> {
    try {
      const oldValue = this.getNestedValue(this.config, path)
      
      // Set new value
      this.setNestedValue(this.config, path, value)

      // Validate configuration
      const validationResult = this.validate()
      if (validationResult.isFailure()) {
        // Revert to old value if validation fails
        this.setNestedValue(this.config, path, oldValue)
        return Result.failure(validationResult.error)
      }
      if (!validationResult.value.valid) {
        // Revert to old value if validation fails
        this.setNestedValue(this.config, path, oldValue)
        return Result.failure(new Error(`Invalid configuration: ${validationResult.value.errors.map(e => e.message).join(', ')}`))
      }

      // Emit configuration change event
      await this.eventEmitter.emit('config:changed', {
        path,
        oldValue,
        newValue: value,
        timestamp: new Date()
      } as ConfigChangeEvent, 'ConfigManager')

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get entire configuration
   */
  getAll(): Result<ConfigSchema> {
    return Result.success({ ...this.config })
  }

  /**
   * Validate configuration
   */
  validate(config: ConfigSchema = this.config): Result<ConfigValidationResult> {
    try {
      const errors: Array<{ path: string; message: string; severity: 'error' | 'warning' }> = []
      const warnings: Array<{ path: string; message: string }> = []

      // Validate app configuration
      this.validateAppConfig(config.app, errors, warnings)
      
      // Validate AI configuration
      this.validateAIConfig(config.ai, errors, warnings)
      
      // Validate CLI configuration
      this.validateCLIConfig(config.cli, errors, warnings)
      
      // Validate tools configuration
      this.validateToolsConfig(config.tools, errors, warnings)
      
      // Validate performance configuration
      this.validatePerformanceConfig(config.performance, errors, warnings)
      
      // Validate security configuration
      this.validateSecurityConfig(config.security, errors, warnings)
      
      // Validate network configuration
      this.validateNetworkConfig(config.network, errors, warnings)
      
      // Validate storage configuration
      this.validateStorageConfig(config.storage, errors, warnings)

      return Result.success({
        valid: errors.length === 0,
        errors,
        warnings
      })
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Reset configuration to defaults
   */
  async reset(): Promise<Result<void>> {
    try {
      this.config = { ...this.defaultConfig }

      // Emit configuration reset event
      await this.eventEmitter.emit('config:reset', { config: this.config }, 'ConfigManager')

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Reload configuration from file
   */
  async reload(): Promise<Result<void>> {
    const result = await this.loadConfig(this.configPath)
    if (result.isFailure()) {
      return Result.failure(result.error)
    }
    return Result.success(void 0)
  }

  /**
   * Watch for configuration changes
   */
  async watch(): Promise<Result<void>> {
    try {
      if (this.isWatching) {
        return Result.success(void 0)
      }

      const { watch } = await import('node:fs')
      
      this.watcher = watch(this.configPath, async (eventType) => {
        if (eventType === 'change') {
          await this.reload()
        }
      })

      this.isWatching = true

      // Emit watch started event
      await this.eventEmitter.emit('config:watch-started', { path: this.configPath }, 'ConfigManager')

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Stop watching for changes
   */
  async unwatch(): Promise<Result<void>> {
    try {
      if (!this.isWatching || !this.watcher) {
        return Result.success(void 0)
      }

      this.watcher.close()
      this.watcher = undefined
      this.isWatching = false

      // Emit watch stopped event
      await this.eventEmitter.emit('config:watch-stopped', { path: this.configPath }, 'ConfigManager')

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get configuration schema
   */
  getSchema(): Record<string, unknown> {
    return this.generateSchema()
  }

  /**
   * Export configuration
   */
  async export(format: 'json' | 'yaml' | 'toml'): Promise<Result<string>> {
    try {
      let data: string
      
      switch (format) {
        case 'json':
          data = JSON.stringify(this.config, null, 2)
          break
        case 'yaml':
          // TODO: Implement YAML export
          data = '# YAML export not yet implemented'
          break
        case 'toml':
          // TODO: Implement TOML export
          data = '# TOML export not yet implemented'
          break
        default:
          return Result.failure(new Error(`Unsupported export format: ${format}`))
      }

      return Result.success(data)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Import configuration
   */
  async import(data: string, format: 'json' | 'yaml' | 'toml'): Promise<Result<void>> {
    try {
      let parsedConfig: ConfigSchema
      
      switch (format) {
        case 'json':
          parsedConfig = JSON.parse(data)
          break
        case 'yaml':
          // TODO: Implement YAML import
          return Result.failure(new Error('YAML import not yet implemented'))
        case 'toml':
          // TODO: Implement TOML import
          return Result.failure(new Error('TOML import not yet implemented'))
        default:
          return Result.failure(new Error(`Unsupported import format: ${format}`))
      }

      // Validate imported configuration
      const validationResult = this.validate(parsedConfig)
      if (validationResult.isFailure()) {
        return Result.failure(validationResult.error)
      }
      if (!validationResult.value.valid) {
        return Result.failure(new Error(`Invalid configuration: ${validationResult.value.errors.map(e => e.message).join(', ')}`))
      }

      // Merge with current configuration
      this.config = this.mergeConfigs(this.config, parsedConfig)

      // Emit configuration imported event
      await this.eventEmitter.emit('config:imported', { config: this.config, format }, 'ConfigManager')

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Dispose of the configuration manager
   */
  async dispose(): Promise<void> {
    await this.unwatch()
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): ConfigSchema {
    return {
      app: {
        name: 'StressGPT7',
        version: '7.0.0',
        environment: 'development',
        debug: false,
        logLevel: 'info'
      },
      ai: {
        model: 'stressgpt7-local',
        temperature: 0.1,
        maxTokens: 8192,
        reasoningDepth: 3,
        confidenceThreshold: 0.7,
        timeout: 30000
      },
      cli: {
        theme: {
          primary: '#007acc',
          secondary: '#3c3c3c',
          accent: '#4ec9b0',
          background: '#1e1e1e',
          text: '#d4d4d4',
          error: '#f14c4c',
          warning: '#ffcc02',
          success: '#4ec9b0'
        },
        keybindings: {
          vimMode: true,
          customKeybindings: {}
        },
        voice: {
          enabled: false,
          language: 'en-US',
          voiceId: 'default',
          autoDetect: true
        },
        display: {
          showLineNumbers: false,
          showTimestamps: true,
          showAvatars: true,
          compactMode: false,
          maxHistoryLines: 1000
        }
      },
      tools: {
        enabled: ['file_system', 'bash', 'code_analysis', 'web_search'],
        disabled: [],
        timeouts: {
          file_system: 30000,
          bash: 60000,
          code_analysis: 45000,
          web_search: 30000
        },
        security: {
          sandboxed: true,
          allowedPaths: [process.cwd()],
          maxFileSize: 10485760 // 10MB
        }
      },
      performance: {
        maxConcurrentQueries: 5,
        cacheEnabled: true,
        cacheSize: 1000,
        cacheTimeout: 3600000, // 1 hour
        profiling: false
      },
      security: {
        encryptionEnabled: false,
        sessionTimeout: 3600000, // 1 hour
        maxLoginAttempts: 3
      },
      network: {
        timeout: 30000,
        retries: 3,
        retryDelay: 1000
      },
      storage: {
        type: 'file',
        path: './data',
        backup: true,
        backupInterval: 86400000, // 24 hours
        compression: false
      }
    }
  }

  /**
   * Get default configuration path
   */
  private getDefaultConfigPath(): string {
    return join(process.cwd(), 'config.json')
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const { mkdir } = await import('node:fs/promises')
    await mkdir(dirname(filePath), { recursive: true })
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): unknown {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Set nested value in object
   */
  private setNestedValue(obj: any, path: string, value: unknown): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!current[key]) {
        current[key] = {}
      }
      return current[key]
    }, obj)
    target[lastKey] = value
  }

  /**
   * Merge configurations
   */
  private mergeConfigs(defaultConfig: ConfigSchema, userConfig: Partial<ConfigSchema>): ConfigSchema {
    return {
      app: { ...defaultConfig.app, ...userConfig.app },
      ai: { ...defaultConfig.ai, ...userConfig.ai },
      cli: {
        ...defaultConfig.cli,
        theme: { ...defaultConfig.cli.theme, ...userConfig.cli?.theme },
        keybindings: { ...defaultConfig.cli.keybindings, ...userConfig.cli?.keybindings },
        voice: { ...defaultConfig.cli.voice, ...userConfig.cli?.voice },
        display: { ...defaultConfig.cli.display, ...userConfig.cli?.display }
      },
      tools: { ...defaultConfig.tools, ...userConfig.tools },
      performance: { ...defaultConfig.performance, ...userConfig.performance },
      security: { ...defaultConfig.security, ...userConfig.security },
      network: { ...defaultConfig.network, ...userConfig.network },
      storage: { ...defaultConfig.storage, ...userConfig.storage }
    }
  }

  /**
   * Generate configuration schema
   */
  private generateSchema(): Record<string, unknown> {
    // TODO: Implement JSON Schema generation
    return {}
  }

  /**
   * Validation methods for different configuration sections
   */
  private validateAppConfig(app: ConfigSchema['app'], errors: any[], warnings: any[]): void {
    if (!app.name || typeof app.name !== 'string') {
      errors.push({ path: 'app.name', message: 'App name is required and must be a string', severity: 'error' })
    }
    if (!['development', 'production', 'test'].includes(app.environment)) {
      errors.push({ path: 'app.environment', message: 'Invalid environment', severity: 'error' })
    }
  }

  private validateAIConfig(ai: ConfigSchema['ai'], errors: any[], warnings: any[]): void {
    if (ai.temperature < 0 || ai.temperature > 2) {
      errors.push({ path: 'ai.temperature', message: 'Temperature must be between 0 and 2', severity: 'error' })
    }
    if (ai.maxTokens < 1 || ai.maxTokens > 32768) {
      errors.push({ path: 'ai.maxTokens', message: 'Max tokens must be between 1 and 32768', severity: 'error' })
    }
  }

  private validateCLIConfig(cli: ConfigSchema['cli'], errors: any[], warnings: any[]): void {
    // CLI validation logic
  }

  private validateToolsConfig(tools: ConfigSchema['tools'], errors: any[], warnings: any[]): void {
    // Tools validation logic
  }

  private validatePerformanceConfig(performance: ConfigSchema['performance'], errors: any[], warnings: any[]): void {
    // Performance validation logic
  }

  private validateSecurityConfig(security: ConfigSchema['security'], errors: any[], warnings: any[]): void {
    // Security validation logic
  }

  private validateNetworkConfig(network: ConfigSchema['network'], errors: any[], warnings: any[]): void {
    // Network validation logic
  }

  private validateStorageConfig(storage: ConfigSchema['storage'], errors: any[], warnings: any[]): void {
    // Storage validation logic
  }
}
