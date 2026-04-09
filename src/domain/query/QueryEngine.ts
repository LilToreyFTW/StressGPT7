/**
 * Enhanced Query Engine for StressGPT7
 * Provides advanced query processing with tool integration and context management
 */

import { Result } from '../../core/types/Result.js'
import type { IToolManager } from '../../core/interfaces/IToolManager.js'
import type { IStateManager } from '../../core/interfaces/IStateManager.js'
import type { IEventEmitter } from '../../core/events/IEventEmitter.js'
import type { ILocalAIEngine } from '../ai/ILocalAIEngine.ts'
import type { Message } from '../../core/types/Message.ts'

/**
 * Query processing options
 */
export interface QueryOptions {
  /** Maximum number of turns for multi-turn conversations */
  readonly maxTurns?: number
  /** Temperature for AI responses */
  readonly temperature?: number
  /** Maximum tokens for AI responses */
  readonly maxTokens?: number
  /** Specific tools to use */
  readonly tools?: string[]
  /** Whether to stream responses */
  readonly stream?: boolean
  /** Query timeout in milliseconds */
  readonly timeout?: number
  /** Whether to include reasoning */
  readonly includeReasoning?: boolean
  /** Conversation context */
  readonly conversationId?: string
}

/**
 * Query result with comprehensive information
 */
export interface QueryResult {
  /** Query response content */
  readonly content: string
  /** AI reasoning process */
  readonly reasoning?: string
  /** Confidence score */
  readonly confidence: number
  /** Tools used during processing */
  readonly toolsUsed: readonly string[]
  /** Processing duration in milliseconds */
  readonly duration: number
  /** Number of tokens used */
  readonly tokensUsed: number
  /** Conversation context */
  readonly conversationId: string
  /** Query metadata */
  readonly metadata: {
    readonly timestamp: Date
    readonly queryType: string
    readonly complexity: 'simple' | 'medium' | 'complex'
    readonly success: boolean
    readonly error?: string
  }
}

/**
 * Query analysis result
 */
export interface QueryAnalysis {
  /** Query type classification */
  readonly type: string
  /** Query complexity assessment */
  readonly complexity: 'simple' | 'medium' | 'complex'
  /** Detected domains */
  readonly domains: readonly string[]
  /** Required tools */
  readonly requiredTools: readonly string[]
  /** Query patterns */
  readonly patterns: readonly string[]
  /** Estimated processing time */
  readonly estimatedTime: number
}

/**
 * Conversation context for query processing
 */
export interface ConversationContext {
  /** Conversation ID */
  readonly conversationId: string
  /** Message history */
  readonly messages: readonly Message[]
  /** Current turn number */
  readonly turnNumber: number
  /** Conversation metadata */
  readonly metadata: {
    readonly startTime: Date
    readonly lastMessageTime: Date
    readonly totalTokensUsed: number
    readonly averageResponseTime: number
  }
}

/**
 * Core query engine interface
 */
export interface IQueryEngine {
  /**
   * Process a user query
   */
  query(input: string, options?: QueryOptions): Promise<Result<QueryResult>>

  /**
   * Analyze a query without processing it
   */
  analyzeQuery(input: string): Promise<Result<QueryAnalysis>>

  /**
   * Get conversation context
   */
  getConversationContext(conversationId?: string): Promise<Result<ConversationContext>>

  /**
   * Get query engine statistics
   */
  getStats(): Promise<Result<{
    readonly totalQueries: number
    readonly averageResponseTime: number
    readonly successRate: number
    readonly mostUsedTools: readonly string[]
    readonly averageTokensPerQuery: number
  }>>

  /**
   * Clear conversation history
   */
  clearConversation(conversationId?: string): Promise<Result<void>>

  /**
   * Dispose of the query engine
   */
  dispose(): Promise<void>
}

/**
 * Enhanced query engine implementation
 */
export class QueryEngine implements IQueryEngine {
  private readonly toolManager: IToolManager
  private readonly stateManager: IStateManager
  private readonly aiEngine: ILocalAIEngine
  private readonly eventEmitter: IEventEmitter
  private readonly stats = {
    totalQueries: 0,
    totalResponseTime: 0,
    successfulQueries: 0,
    toolUsage: new Map<string, number>(),
    totalTokensUsed: 0
  }

  constructor(
    toolManager: IToolManager,
    stateManager: IStateManager,
    aiEngine: ILocalAIEngine,
    eventEmitter: IEventEmitter
  ) {
    this.toolManager = toolManager
    this.stateManager = stateManager
    this.aiEngine = aiEngine
    this.eventEmitter = eventEmitter
  }

  /**
   * Process a user query
   */
  async query(input: string, options: QueryOptions = {}): Promise<Result<QueryResult>> {
    const startTime = Date.now()
    
    try {
      this.stats.totalQueries++

      // Get or create conversation context
      const contextResult = await this.getConversationContext(options.conversationId)
      if (contextResult.isFailure()) {
        return Result.failure(contextResult.error)
      }

      const context = contextResult.value

      // Add user message to conversation
      await this.stateManager.addMessage({
        type: 'user',
        content: input,
        metadata: {
          conversationId: context.conversationId
        }
      })

      // Analyze query
      const analysisResult = await this.analyzeQuery(input)
      if (analysisResult.isFailure()) {
        return Result.failure(analysisResult.error)
      }

      const analysis = analysisResult.value

      // Process query with AI engine
      const aiResult = await this.aiEngine.processQuery(input, {
        conversationContext: context,
        analysis,
        options
      })

      if (aiResult.isFailure()) {
        return Result.failure(aiResult.error)
      }

      const aiResponse = aiResult.value

      // Execute tools if needed
      const toolResults = await this.executeRequiredTools(
        analysis.requiredTools,
        input,
        context
      )

      // Add assistant message to conversation
      await this.stateManager.addMessage({
        type: 'assistant',
        content: aiResponse.content,
        metadata: {
          conversationId: context.conversationId,
          confidence: aiResponse.confidence,
          tokensUsed: aiResponse.tokensUsed,
          toolsUsed: analysis.requiredTools
        }
      })

      // Update statistics
      const duration = Date.now() - startTime
      this.updateStats(duration, aiResponse.tokensUsed, analysis.requiredTools, true)

      // Create result
      const result: QueryResult = {
        content: aiResponse.content,
        reasoning: options.includeReasoning ? aiResponse.reasoning : undefined,
        confidence: aiResponse.confidence,
        toolsUsed: analysis.requiredTools,
        duration,
        tokensUsed: aiResponse.tokensUsed,
        conversationId: context.conversationId,
        metadata: {
          timestamp: new Date(),
          queryType: analysis.type,
          complexity: analysis.complexity,
          success: true
        }
      }

      // Emit query processed event
      await this.eventEmitter.emit('query:processed', {
        query: input,
        result,
        analysis,
        context
      }, 'QueryEngine')

      return Result.success(result)
    } catch (error) {
      const duration = Date.now() - startTime
      this.updateStats(duration, 0, [], false)

      const result: QueryResult = {
        content: '',
        confidence: 0,
        toolsUsed: [],
        duration,
        tokensUsed: 0,
        conversationId: options.conversationId || 'default',
        metadata: {
          timestamp: new Date(),
          queryType: 'unknown',
          complexity: 'simple',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }

      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Analyze a query without processing it
   */
  async analyzeQuery(input: string): Promise<Result<QueryAnalysis>> {
    try {
      const analysis = await this.aiEngine.analyzeQuery(input)
      
      return Result.success({
        type: analysis.type,
        complexity: analysis.complexity,
        domains: analysis.domains,
        requiredTools: analysis.requiredTools,
        patterns: analysis.patterns,
        estimatedTime: analysis.estimatedTime
      })
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get conversation context
   */
  async getConversationContext(conversationId?: string): Promise<Result<ConversationContext>> {
    try {
      const conversationState = await this.stateManager.getConversationState(conversationId)
      if (conversationState.isFailure()) {
        // Create new conversation if it doesn't exist
        const newConversationId = await this.stateManager.createConversation()
        if (newConversationId.isFailure()) {
          return Result.failure(newConversationId.error)
        }

        const newConversationState = await this.stateManager.getConversationState(newConversationId.value)
        if (newConversationState.isFailure()) {
          return Result.failure(newConversationState.error)
        }

        return this.createConversationContext(newConversationState.value)
      }

      return this.createConversationContext(conversationState.value)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Create conversation context from state
   */
  private createConversationContext(state: ConversationContext): Result<ConversationContext> {
    return Result.success({
      conversationId: state.conversationId,
      messages: state.messages,
      turnNumber: Math.floor(state.messages.length / 2), // Assuming user/assistant pairs
      metadata: state.metadata
    })
  }

  /**
   * Execute required tools
   */
  private async executeRequiredTools(
    toolNames: readonly string[],
    input: string,
    context: ConversationContext
  ): Promise<readonly unknown[]> {
    const results: unknown[] = []

    for (const toolName of toolNames) {
      try {
        const toolResult = await this.toolManager.executeTool(toolName, {
          query: input,
          context: context
        })

        if (toolResult.isFailure()) {
          console.error(`Tool execution failed for ${toolName}:`, toolResult.error)
          continue
        }

        results.push(toolResult.value.output)
      } catch (error) {
        console.error(`Error executing tool ${toolName}:`, error)
      }
    }

    return results
  }

  /**
   * Update query engine statistics
   */
  private updateStats(
    duration: number,
    tokensUsed: number,
    toolsUsed: readonly string[],
    success: boolean
  ): void {
    this.stats.totalResponseTime += duration
    this.stats.totalTokensUsed += tokensUsed

    if (success) {
      this.stats.successfulQueries++
    }

    // Update tool usage
    for (const toolName of toolsUsed) {
      this.stats.toolUsage.set(toolName, (this.stats.toolUsage.get(toolName) || 0) + 1)
    }
  }

  /**
   * Get query engine statistics
   */
  async getStats(): Promise<Result<{
    readonly totalQueries: number
    readonly averageResponseTime: number
    readonly successRate: number
    readonly mostUsedTools: readonly string[]
    readonly averageTokensPerQuery: number
  }>> {
    try {
      const averageResponseTime = this.stats.totalQueries > 0 
        ? this.stats.totalResponseTime / this.stats.totalQueries 
        : 0

      const successRate = this.stats.totalQueries > 0 
        ? this.stats.successfulQueries / this.stats.totalQueries 
        : 0

      const averageTokensPerQuery = this.stats.totalQueries > 0 
        ? this.stats.totalTokensUsed / this.stats.totalQueries 
        : 0

      const mostUsedTools = Array.from(this.stats.toolUsage.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([toolName]) => toolName)

      return Result.success({
        totalQueries: this.stats.totalQueries,
        averageResponseTime,
        successRate,
        mostUsedTools,
        averageTokensPerQuery
      })
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Clear conversation history
   */
  async clearConversation(conversationId?: string): Promise<Result<void>> {
    try {
      if (conversationId) {
        const result = await this.stateManager.deleteConversation(conversationId)
        if (result.isFailure()) {
          return Result.failure(result.error)
        }
      } else {
        // Clear all conversations
        const allConversations = await this.stateManager.getAllConversations()
        if (allConversations.isFailure()) {
          return Result.failure(allConversations.error)
        }

        for (const conversation of allConversations.value) {
          await this.stateManager.deleteConversation(conversation.conversationId)
        }
      }

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Dispose of the query engine
   */
  async dispose(): Promise<void> {
    // Clean up resources
    this.stats.totalQueries = 0
    this.stats.totalResponseTime = 0
    this.stats.successfulQueries = 0
    this.stats.toolUsage.clear()
    this.stats.totalTokensUsed = 0
  }
}
