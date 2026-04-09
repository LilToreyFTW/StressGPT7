import { Anthropic } from '@anthropic-ai/sdk'
import type { Message } from '@/types/message.js'
import { createLogger } from '@/utils/logger.js'
import type { StressGPT7Config } from '@/types/config.js'
import type { ToolManager } from './ToolManager.js'
import type { CommandManager } from './CommandManager.js'
import type { PluginManager } from './PluginManager.js'
import type { SkillManager } from './SkillManager.js'
import type { MCPManager } from './MCPManager.js'
import type { StateManager } from './StateManager.js'

export interface QueryEngineContext {
  config: StressGPT7Config
  anthropic: Anthropic
  toolManager: ToolManager
  commandManager: CommandManager
  pluginManager: PluginManager
  skillManager: SkillManager
  mcpManager: MCPManager
  stateManager: StateManager
}

export interface QueryOptions {
  maxTurns?: number
  temperature?: number
  maxTokens?: number
  tools?: string[]
  stream?: boolean
}

export class QueryEngine {
  private logger = createLogger('QueryEngine')
  private context: QueryEngineContext
  private conversationHistory: Message[] = []

  constructor(context: QueryEngineContext) {
    this.context = context
  }

  async query(input: string, options: QueryOptions = {}): Promise<string> {
    this.logger.info('Processing query:', input.substring(0, 100) + (input.length > 100 ? '...' : ''))
    
    try {
      // Add user message to history
      const userMessage: Message = {
        id: this.generateMessageId(),
        type: 'user',
        content: input,
        timestamp: new Date(),
      }
      this.conversationHistory.push(userMessage)

      // Build system prompt
      const systemPrompt = await this.buildSystemPrompt()
      
      // Get available tools
      const availableTools = await this.context.toolManager.getAvailableTools()
      
      // Prepare messages for API
      const messages = this.prepareMessagesForAPI()
      
      // Call Anthropic API
      const response = await this.context.anthropic.messages.create({
        model: this.context.config.api.anthropic.model,
        max_tokens: options.maxTokens || this.context.config.api.anthropic.maxTokens,
        temperature: options.temperature || this.context.config.api.anthropic.temperature,
        system: systemPrompt,
        messages,
        tools: availableTools,
        stream: options.stream || false,
      })

      // Process response
      let responseText = ''
      for (const block of response.content) {
        if (block.type === 'text') {
          responseText += block.text
        } else if (block.type === 'tool_use') {
          // Handle tool use
          const toolResult = await this.handleToolUse(block)
          responseText += `\n[Tool: ${block.name}]\n${toolResult}`
        }
      }

      // Add assistant message to history
      const assistantMessage: Message = {
        id: this.generateMessageId(),
        type: 'assistant',
        content: responseText,
        timestamp: new Date(),
      }
      this.conversationHistory.push(assistantMessage)

      this.logger.info('Query processed successfully')
      return responseText

    } catch (error) {
      this.logger.error('Error processing query:', error)
      throw error
    }
  }

  private async buildSystemPrompt(): Promise<string> {
    const basePrompt = `You are StressGPT7, an advanced autonomous software engineering AI.

Your purpose is to analyze, refactor, and build entire codebases with production-level quality.

CORE RULES:
- Always generate COMPLETE, runnable code
- NEVER use placeholders like "TODO", "..." or "implement here"
- NEVER simulate logic - everything must be real and functional
- Maintain compatibility with existing project structure unless improving it
- If rewriting, output FULL updated files, not fragments
- Ensure all dependencies, imports, and integrations are included
- Code must be clean, optimized, and professional

You have access to various tools for file operations, code analysis, and system interactions. Use them effectively to accomplish tasks.`

    // Add tool-specific context
    const toolContext = await this.context.toolManager.getSystemPromptContext()
    const skillContext = await this.context.skillManager.getSystemPromptContext()
    const pluginContext = await this.context.pluginManager.getSystemPromptContext()
    const mcpContext = await this.context.mcpManager.getSystemPromptContext()

    return `${basePrompt}

${toolContext}

${skillContext}

${pluginContext}

${mcpContext}`
  }

  private prepareMessagesForAPI(): Anthropic.Messages.MessageParam[] {
    return this.conversationHistory.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }))
  }

  private async handleToolUse(toolUse: any): Promise<string> {
    const { name, input } = toolUse
    this.logger.info('Executing tool:', name, input)

    try {
      const result = await this.context.toolManager.executeTool(name, input)
      return JSON.stringify(result, null, 2)
    } catch (error) {
      this.logger.error('Tool execution failed:', error)
      return `Error: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getConversationHistory(): Message[] {
    return [...this.conversationHistory]
  }

  clearHistory(): void {
    this.conversationHistory = []
    this.logger.info('Conversation history cleared')
  }

  setHistory(messages: Message[]): void {
    this.conversationHistory = [...messages]
    this.logger.info(`Conversation history set with ${messages.length} messages`)
  }
}
