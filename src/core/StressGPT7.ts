import { createLogger } from '../utils/logger.js'
import type { StressGPT7Config } from '../types/config.js'
import { QueryEngine } from './QueryEngine.js'
import { ToolManager } from './ToolManager.js'
import { CommandManager } from './CommandManager.js'
import { PluginManager } from './PluginManager.js'
import { SkillManager } from './SkillManager.js'
import { MCPManager } from './MCPManager.js'
import { StateManager } from './StateManager.js'
import { LocalAIEngine } from './LocalAIEngine.js'

export class StressGPT7 {
  private config: StressGPT7Config
  private logger = createLogger('StressGPT7')
  private localAIEngine: LocalAIEngine
  private queryEngine: QueryEngine
  private toolManager: ToolManager
  private commandManager: CommandManager
  private pluginManager: PluginManager
  private skillManager: SkillManager
  private mcpManager: MCPManager
  private stateManager: StateManager
  private isRunning = false

  constructor(config: StressGPT7Config) {
    this.config = config
    this.logger.info('StressGPT7 initialized')
    
    // Initialize managers first
    this.stateManager = new StateManager(config)
    this.toolManager = new ToolManager(config, this.stateManager)
    this.commandManager = new CommandManager(config, this.stateManager)
    this.pluginManager = new PluginManager(config, this.stateManager)
    this.skillManager = new SkillManager(config, this.stateManager)
    this.mcpManager = new MCPManager(config, this.stateManager)
    
    // Initialize LocalAIEngine
    this.localAIEngine = new LocalAIEngine(config, this.stateManager, this.toolManager)
    
    // Initialize query engine
    this.queryEngine = new QueryEngine({
      config,
      localAIEngine: this.localAIEngine,
      toolManager: this.toolManager,
      commandManager: this.commandManager,
      pluginManager: this.pluginManager,
      skillManager: this.skillManager,
      mcpManager: this.mcpManager,
      stateManager: this.stateManager,
    })
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('StressGPT7 is already running')
      return
    }

    this.logger.info('Starting StressGPT7...')
    
    try {
      // Initialize all managers
      await this.stateManager.initialize()
      await this.toolManager.initialize()
      await this.commandManager.initialize()
      await this.pluginManager.initialize()
      await this.skillManager.initialize()
      await this.mcpManager.initialize()
      
      // Start the main interactive loop
      this.isRunning = true
      await this.mainLoop()
      
    } catch (error) {
      this.logger.error('Failed to start StressGPT7:', error)
      throw error
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.logger.info('Shutting down StressGPT7...')
    
    try {
      // Shutdown all managers
      await this.mcpManager.shutdown()
      await this.skillManager.shutdown()
      await this.pluginManager.shutdown()
      await this.commandManager.shutdown()
      await this.toolManager.shutdown()
      await this.stateManager.shutdown()
      
      this.isRunning = false
      this.logger.info('StressGPT7 shutdown complete')
      
    } catch (error) {
      this.logger.error('Error during shutdown:', error)
    }
  }

  private async mainLoop(): Promise<void> {
    const { createInterface } = await import('node:readline')
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    this.logger.info('StressGPT7 ready. Type your message or /help for commands.')
    
    while (this.isRunning) {
      try {
        const input = await new Promise<string>((resolve) => {
          rl.question('> ', resolve)
        })
        
        if (!input.trim()) {
          continue
        }
        
        // Process the input
        await this.processInput(input)
        
      } catch (error) {
        this.logger.error('Error in main loop:', error)
      }
    }
    
    rl.close()
  }

  private async processInput(input: string): Promise<void> {
    try {
      // Check if it's a command
      if (input.startsWith('/')) {
        await this.commandManager.executeCommand(input)
        return
      }
      
      // Process as a query
      const response = await this.queryEngine.query(input)
      
      // Display response
      console.log(response)
      
    } catch (error) {
      this.logger.error('Error processing input:', error)
      console.error('Error:', error instanceof Error ? error.message : String(error))
    }
  }

  getConfig(): StressGPT7Config {
    return this.config
  }

  getState() {
    return this.stateManager.getState()
  }
}
