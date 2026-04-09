import { createLogger } from '@/utils/logger.js'
import type { StressGPT7Config } from '@/types/config.js'
import type { StateManager } from './StateManager.js'
import { FileSystemTool } from '@/tools/FileSystemTool.js'
import { CodeAnalysisTool } from '@/tools/CodeAnalysisTool.js'
import { WebSearchTool } from '@/tools/WebSearchTool.js'
import { BashTool } from '@/tools/BashTool.js'
import type { Tool, ToolResult } from '@/types/tool.js'

export class ToolManager {
  private logger = createLogger('ToolManager')
  private config: StressGPT7Config
  private stateManager: StateManager
  private tools: Map<string, Tool> = new Map()

  constructor(config: StressGPT7Config, stateManager: StateManager) {
    this.config = config
    this.stateManager = stateManager
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing ToolManager...')
    
    try {
      // Register built-in tools
      await this.registerBuiltInTools()
      
      // Load external tools if enabled
      if (this.config.system.enablePlugins) {
        await this.loadExternalTools()
      }
      
      this.logger.info(`ToolManager initialized with ${this.tools.size} tools`)
    } catch (error) {
      this.logger.error('Failed to initialize ToolManager:', error)
      throw error
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down ToolManager...')
    this.tools.clear()
    this.logger.info('ToolManager shutdown complete')
  }

  private async registerBuiltInTools(): Promise<void> {
    const builtInTools = [
      new FileSystemTool(this.config, this.stateManager),
      new CodeAnalysisTool(this.config, this.stateManager),
      new WebSearchTool(this.config, this.stateManager),
      new BashTool(this.config, this.stateManager),
    ]

    for (const tool of builtInTools) {
      this.tools.set(tool.name, tool)
      this.logger.debug(`Registered built-in tool: ${tool.name}`)
    }
  }

  private async loadExternalTools(): Promise<void> {
    // Implementation for loading external tools
    // This could scan directories, load plugins, etc.
  }

  async getAvailableTools(): Promise<any[]> {
    const toolDefinitions = []
    
    for (const tool of this.tools.values()) {
      if (tool.isEnabled()) {
        toolDefinitions.push({
          name: tool.name,
          description: tool.description,
          input_schema: tool.getInputSchema(),
        })
      }
    }
    
    return toolDefinitions
  }

  async executeTool(name: string, input: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name)
    
    if (!tool) {
      throw new Error(`Tool not found: ${name}`)
    }
    
    if (!tool.isEnabled()) {
      throw new Error(`Tool is disabled: ${name}`)
    }
    
    this.logger.info(`Executing tool: ${name}`)
    
    try {
      const result = await tool.execute(input)
      this.logger.debug(`Tool ${name} executed successfully`)
      return result
    } catch (error) {
      this.logger.error(`Tool ${name} execution failed:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async getSystemPromptContext(): Promise<string> {
    const enabledTools = Array.from(this.tools.values()).filter(tool => tool.isEnabled())
    
    if (enabledTools.length === 0) {
      return 'No tools are available.'
    }
    
    const toolDescriptions = enabledTools.map(tool => 
      `- ${tool.name}: ${tool.description}`
    ).join('\n')
    
    return `AVAILABLE TOOLS:
${toolDescriptions}

Use these tools to accomplish tasks. Each tool has specific input parameters that must be provided.`
  }

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool)
    this.logger.info(`Registered external tool: ${tool.name}`)
  }

  unregisterTool(name: string): void {
    if (this.tools.delete(name)) {
      this.logger.info(`Unregistered tool: ${name}`)
    }
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  getAllTools(): Tool[] {
    return Array.from(this.tools.values())
  }
}
