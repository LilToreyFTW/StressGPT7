import { createLogger } from '@/utils/logger.js'
import type { StressGPT7Config } from '@/types/config.js'
import type { StateManager } from './StateManager.js'
import { join } from 'path'
import { readFile } from 'fs/promises'

interface PluginConfig {
  name: string
  version: string
  type: string
  description: string
  main: string
  enabled: boolean
  dependencies?: string[]
  capabilities?: string[]
  tools?: string[]
}

interface PluginManifest {
  version: string
  name: string
  description: string
  plugins: PluginConfig[]
  configuration: {
    auto_load: boolean
    plugin_directory: string
    manifest_update_interval: number
  }
}

export class PluginManager {
  private logger = createLogger('PluginManager')
  private config: StressGPT7Config
  private stateManager: StateManager
  private plugins: Map<string, any> = new Map()
  private pluginLoader: any = null
  private manifest: PluginManifest | null = null

  constructor(config: StressGPT7Config, stateManager: StateManager) {
    this.config = config
    this.stateManager = stateManager
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing PluginManager...')
    
    try {
      if (this.config.system.enablePlugins) {
        await this.loadPluginLoader()
        await this.loadPlugins()
      }
      this.logger.info('PluginManager initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize PluginManager:', error)
      throw error
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down PluginManager...')
    
    // Unload all plugins
    for (const [name] of this.plugins) {
      await this.unloadPlugin(name)
    }
    
    this.plugins.clear()
    this.logger.info('PluginManager shutdown complete')
  }

  private async loadPluginLoader(): Promise<void> {
    try {
      const pluginLoaderPath = join(process.cwd(), 'plugins-for-ai', 'plugin_loader.js')
      const pluginLoaderModule = await import(pluginLoaderPath)
      this.pluginLoader = new pluginLoaderModule.default()
      this.logger.info('Plugin loader loaded successfully')
    } catch (error) {
      this.logger.error('Failed to load plugin loader:', error)
      throw error
    }
  }

  private async loadPlugins(): Promise<void> {
    if (!this.pluginLoader) {
      this.logger.error('Plugin loader not available')
      return
    }

    try {
      // Load manifest
      this.manifest = await this.pluginLoader.loadManifest()
      this.logger.info(`Plugin manifest loaded: ${this.manifest.plugins.length} plugins found`)

      // Load all enabled plugins
      const loadedPlugins = await this.pluginLoader.loadAllPlugins()
      this.logger.info(`Loaded ${loadedPlugins.length} plugins`)

      // Store loaded plugins
      for (const plugin of loadedPlugins) {
        this.plugins.set(plugin.name, plugin)
      }

      // Log plugin capabilities
      await this.logPluginCapabilities()
    } catch (error) {
      this.logger.error('Failed to load plugins:', error)
      throw error
    }
  }

  private async logPluginCapabilities(): Promise<void> {
    const pluginList = Array.from(this.plugins.values())
    
    for (const plugin of pluginList) {
      const capabilities = plugin.config.capabilities || []
      const tools = plugin.config.tools || []
      
      this.logger.info(`Plugin ${plugin.name}:`)
      this.logger.info(`  - Type: ${plugin.config.type}`)
      this.logger.info(`  - Capabilities: ${capabilities.join(', ')}`)
      if (tools.length > 0) {
        this.logger.info(`  - Tools: ${tools.join(', ')}`)
      }
    }
  }

  async getPlugin(name: string): Promise<any> {
    if (!this.pluginLoader) {
      return null
    }
    
    return this.pluginLoader.getPlugin(name)
  }

  async unloadPlugin(name: string): Promise<boolean> {
    if (!this.pluginLoader) {
      return false
    }
    
    const success = await this.pluginLoader.unloadPlugin(name)
    if (success) {
      this.plugins.delete(name)
      this.logger.info(`Plugin unloaded: ${name}`)
    }
    
    return success
  }

  async reloadPlugin(name: string): Promise<boolean> {
    if (!this.pluginLoader) {
      return false
    }
    
    const success = await this.pluginLoader.reloadPlugin(name)
    if (success) {
      this.logger.info(`Plugin reloaded: ${name}`)
    }
    
    return success
  }

  getLoadedPlugins(): any[] {
    return Array.from(this.plugins.values())
  }

  getPluginManifest(): PluginManifest | null {
    return this.manifest
  }

  async getSystemPromptContext(): Promise<string> {
    if (!this.manifest || this.plugins.size === 0) {
      return 'No plugins are currently enabled.'
    }
    
    let context = `ENABLED PLUGINS (${this.plugins.size}):\n\n`
    
    for (const plugin of this.plugins.values()) {
      const capabilities = plugin.config.capabilities || []
      const tools = plugin.config.tools || []
      
      context += `**${plugin.config.name}** (v${plugin.config.version})\n`
      context += `- Type: ${plugin.config.type}\n`
      context += `- Description: ${plugin.config.description}\n`
      
      if (capabilities.length > 0) {
        context += `- Capabilities: ${capabilities.join(', ')}\n`
      }
      
      if (tools.length > 0) {
        context += `- Tools: ${tools.join(', ')}\n`
      }
      
      context += '\n'
    }
    
    context += `These plugins provide enhanced functionality including AI assistance, development tools, project management, search capabilities, and advanced chat features.`
    
    return context
  }

  async executePluginTool(pluginName: string, toolName: string, ...args: any[]): Promise<any> {
    const plugin = await this.getPlugin(pluginName)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`)
    }
    
    if (typeof plugin[toolName] !== 'function') {
      throw new Error(`Tool not found in plugin ${pluginName}: ${toolName}`)
    }
    
    try {
      this.logger.info(`Executing tool ${toolName} from plugin ${pluginName}`)
      const result = await plugin[toolName](...args)
      this.logger.info(`Tool ${toolName} executed successfully`)
      return result
    } catch (error) {
      this.logger.error(`Failed to execute tool ${toolName} from plugin ${pluginName}:`, error)
      throw error
    }
  }
}
