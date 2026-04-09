/**
 * State Manager interface for managing application state
 * Provides a clean abstraction for state persistence and retrieval
 */

import { Result } from '../types/Result.js'

/**
 * Message types for conversation history
 */
export interface Message {
  /** Unique message identifier */
  readonly id: string
  /** Message type */
  readonly type: 'user' | 'assistant' | 'system' | 'tool'
  /** Message content */
  readonly content: string
  /** Message timestamp */
  readonly timestamp: Date
  /** Message metadata */
  readonly metadata?: {
    readonly toolName?: string
    readonly toolResult?: unknown
    readonly confidence?: number
    readonly tokensUsed?: number
    readonly model?: string
  }
}

/**
 * Application state interface
 */
export interface AppState {
  /** Application version */
  readonly version: string
  /** Application startup time */
  readonly startTime: Date
  /** Current session information */
  readonly session: {
    readonly id: string
    readonly userId?: string
    readonly startTime: Date
    readonly lastActivity: Date
  }
  /** User preferences */
  readonly preferences: {
    readonly theme: 'light' | 'dark' | 'auto'
    readonly language: string
    readonly timezone: string
    readonly [key: string]: unknown
  }
  /** System configuration */
  readonly system: {
    readonly logLevel: 'debug' | 'info' | 'warn' | 'error'
    readonly enableTelemetry: boolean
    readonly enablePlugins: boolean
    readonly enableSkills: boolean
    readonly enableMCP: boolean
    readonly [key: string]: unknown
  }
}

/**
 * Conversation state interface
 */
export interface ConversationState {
  /** Current conversation ID */
  readonly conversationId: string
  /** Conversation title */
  readonly title?: string
  /** Message history */
  readonly messages: readonly Message[]
  /** Conversation metadata */
  readonly metadata: {
    readonly startTime: Date
    readonly lastMessageTime: Date
    readonly messageCount: number
    readonly totalTokensUsed: number
    readonly averageResponseTime: number
  }
}

/**
 * Tool state interface
 */
export interface ToolState {
  /** Tool execution history */
  executions: Array<{
    readonly id: string
    readonly toolName: string
    readonly input: unknown
    readonly output: unknown
    readonly success: boolean
    readonly duration: number
    readonly timestamp: Date
    readonly error?: string
  }>
  /** Tool statistics */
  statistics: {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    averageExecutionTime: number
    mostUsedTool: string
    lastExecutionTime: Date
  }
}

/**
 * State persistence options
 */
export interface StatePersistenceOptions {
  /** Whether to persist to disk */
  readonly persistToDisk: boolean
  /** Persistence interval in milliseconds */
  readonly persistInterval?: number
  /** Maximum number of conversations to keep */
  readonly maxConversations?: number
  /** Whether to compress persisted data */
  readonly compress?: boolean
}

/**
 * State manager statistics
 */
export interface StateManagerStats {
  /** Total number of conversations */
  readonly totalConversations: number
  /** Total number of messages */
  readonly totalMessages: number
  /** Total tool executions */
  readonly totalToolExecutions: number
  /** State size in bytes */
  readonly stateSize: number
  /** Last persistence time */
  readonly lastPersistenceTime?: Date
  /** Persistence success rate */
  readonly persistenceSuccessRate: number
}

/**
 * Core state manager interface
 */
export interface IStateManager {
  /**
   * Initialize the state manager
   */
  initialize(options?: StatePersistenceOptions): Promise<Result<void>>

  /**
   * Get the application state
   */
  getAppState(): Promise<Result<AppState>>

  /**
   * Update the application state
   */
  updateAppState(updates: Partial<AppState>): Promise<Result<void>>

  /**
   * Get the current conversation state
   */
  getConversationState(conversationId?: string): Promise<Result<ConversationState>>

  /**
   * Create a new conversation
   */
  createConversation(title?: string): Promise<Result<string>>

  /**
   * Add a message to the conversation
   */
  addMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Result<void>>

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string, limit?: number): Promise<Result<readonly Message[]>>

  /**
   * Delete a conversation
   */
  deleteConversation(conversationId: string): Promise<Result<void>>

  /**
   * Get all conversations
   */
  getAllConversations(): Promise<Result<readonly ConversationState[]>>

  /**
   * Search conversations
   */
  searchConversations(query: string): Promise<Result<readonly ConversationState[]>>

  /**
   * Get tool state
   */
  getToolState(): Promise<Result<ToolState>>

  /**
   * Record tool execution
   */
  recordToolExecution(execution: {
    readonly toolName: string
    readonly input: unknown
    readonly output: unknown
    readonly success: boolean
    readonly duration: number
    readonly error?: string
  }): Promise<Result<void>>

  /**
   * Get tool execution history
   */
  getToolExecutionHistory(toolName?: string, limit?: number): Promise<Result<Array<{
    readonly id: string
    readonly toolName: string
    readonly input: unknown
    readonly output: unknown
    readonly success: boolean
    readonly duration: number
    readonly timestamp: Date
    readonly error?: string
  }>>>

  /**
   * Clear tool execution history
   */
  clearToolExecutionHistory(toolName?: string): Promise<Result<void>>

  /**
   * Get user preferences
   */
  getUserPreferences(): Promise<Result<ReadonlyMap<string, unknown>>>

  /**
   * Update user preferences
   */
  updateUserPreferences(preferences: Record<string, unknown>): Promise<Result<void>>

  /**
   * Persist state to storage
   */
  persistState(): Promise<Result<void>>

  /**
   * Load state from storage
   */
  loadState(): Promise<Result<void>>

  /**
   * Export state
   */
  exportState(): Promise<Result<Record<string, unknown>>>

  /**
   * Import state
   */
  importState(state: Record<string, unknown>): Promise<Result<void>>

  /**
   * Clear all state
   */
  clearState(): Promise<Result<void>>

  /**
   * Get state manager statistics
   */
  getStats(): Promise<Result<StateManagerStats>>

  /**
   * Dispose of the state manager
   */
  dispose(): Promise<void>
}

/**
 * Abstract base state manager providing common functionality
 */
export abstract class BaseStateManager implements IStateManager {
  protected appState: AppState
  protected conversations = new Map<string, ConversationState>()
  protected toolState: ToolState
  protected persistenceOptions: StatePersistenceOptions = { persistToDisk: false }
  protected persistenceTimer?: NodeJS.Timeout

  constructor() {
    // Initialize default app state
    this.appState = {
      version: '7.0.0',
      startTime: new Date(),
      session: {
        id: this.generateId(),
        startTime: new Date(),
        lastActivity: new Date()
      },
      preferences: {
        theme: 'auto',
        language: 'en',
        timezone: 'UTC'
      },
      system: {
        logLevel: 'info',
        enableTelemetry: false,
        enablePlugins: true,
        enableSkills: true,
        enableMCP: true
      }
    }

    // Initialize tool state
    this.toolState = {
      executions: [],
      statistics: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        mostUsedTool: '',
        lastExecutionTime: new Date()
      }
    }
  }

  /**
   * Initialize the state manager
   */
  async initialize(options: StatePersistenceOptions = { persistToDisk: false }): Promise<Result<void>> {
    try {
      this.persistenceOptions = options

      // Load existing state if persistence is enabled
      if (options.persistToDisk) {
        await this.loadState()
      }

      // Set up persistence timer
      if (options.persistToDisk && options.persistInterval) {
        this.persistenceTimer = setInterval(() => {
          void this.persistState()
        }, options.persistInterval)
      }

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get the application state
   */
  async getAppState(): Promise<Result<AppState>> {
    return Result.success({ ...this.appState })
  }

  /**
   * Update the application state
   */
  async updateAppState(updates: Partial<AppState>): Promise<Result<void>> {
    try {
      this.appState = { ...this.appState, ...updates }
      
      if (this.persistenceOptions.persistToDisk) {
        await this.persistState()
      }

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get the current conversation state
   */
  async getConversationState(conversationId?: string): Promise<Result<ConversationState>> {
    const id = conversationId || this.appState.session.id
    const conversation = this.conversations.get(id)
    
    if (!conversation) {
      return Result.failure(new Error(`Conversation '${id}' not found`))
    }

    return Result.success(conversation)
  }

  /**
   * Create a new conversation
   */
  async createConversation(title?: string): Promise<Result<string>> {
    try {
      const conversationId = this.generateId()
      const now = new Date()
      
      const conversation: ConversationState = {
        conversationId,
        title,
        messages: [],
        metadata: {
          startTime: now,
          lastMessageTime: now,
          messageCount: 0,
          totalTokensUsed: 0,
          averageResponseTime: 0
        }
      }

      this.conversations.set(conversationId, conversation)
      
      if (this.persistenceOptions.persistToDisk) {
        await this.persistState()
      }

      return Result.success(conversationId)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Add a message to the conversation
   */
  async addMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Result<void>> {
    try {
      const conversationId = message.metadata?.conversationId || this.appState.session.id
      const conversation = this.conversations.get(conversationId)
      
      if (!conversation) {
        return Result.failure(new Error(`Conversation '${conversationId}' not found`))
      }

      const newMessage: Message = {
        ...message,
        id: this.generateId(),
        timestamp: new Date()
      }

      const updatedConversation: ConversationState = {
        ...conversation,
        messages: [...conversation.messages, newMessage],
        metadata: {
          ...conversation.metadata,
          lastMessageTime: newMessage.timestamp,
          messageCount: conversation.messages.length + 1,
          totalTokensUsed: conversation.metadata.totalTokensUsed + (message.metadata?.tokensUsed || 0)
        }
      }

      this.conversations.set(conversationId, updatedConversation)
      
      if (this.persistenceOptions.persistToDisk) {
        await this.persistState()
      }

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId: string, limit?: number): Promise<Result<readonly Message[]>> {
    const conversation = this.conversations.get(conversationId)
    
    if (!conversation) {
      return Result.failure(new Error(`Conversation '${conversationId}' not found`))
    }

    const messages = limit 
      ? conversation.messages.slice(-limit)
      : conversation.messages

    return Result.success(messages)
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<Result<void>> {
    try {
      const deleted = this.conversations.delete(conversationId)
      
      if (!deleted) {
        return Result.failure(new Error(`Conversation '${conversationId}' not found`))
      }

      if (this.persistenceOptions.persistToDisk) {
        await this.persistState()
      }

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get all conversations
   */
  async getAllConversations(): Promise<Result<readonly ConversationState[]>> {
    return Result.success(Array.from(this.conversations.values()))
  }

  /**
   * Search conversations
   */
  async searchConversations(query: string): Promise<Result<readonly ConversationState[]>> {
    const lowerQuery = query.toLowerCase()
    const results = Array.from(this.conversations.values()).filter(conv => 
      conv.title?.toLowerCase().includes(lowerQuery) ||
      conv.messages.some(msg => msg.content.toLowerCase().includes(lowerQuery))
    )

    return Result.success(results)
  }

  /**
   * Get tool state
   */
  async getToolState(): Promise<Result<ToolState>> {
    return Result.success({ ...this.toolState })
  }

  /**
   * Record tool execution
   */
  async recordToolExecution(execution: {
    readonly toolName: string
    readonly input: unknown
    readonly output: unknown
    readonly success: boolean
    readonly duration: number
    readonly error?: string
  }): Promise<Result<void>> {
    try {
      const executionRecord = {
        id: this.generateId(),
        ...execution,
        timestamp: new Date()
      }

      // Update executions
      this.toolState.executions = [...this.toolState.executions, executionRecord]

      // Update statistics
      this.toolState.statistics.totalExecutions++
      if (execution.success) {
        this.toolState.statistics.successfulExecutions++
      } else {
        this.toolState.statistics.failedExecutions++
      }

      // Update average execution time
      const totalExecs = this.toolState.statistics.totalExecutions
      this.toolState.statistics.averageExecutionTime = 
        (this.toolState.statistics.averageExecutionTime * (totalExecs - 1) + execution.duration) / totalExecs

      // Update most used tool
      const toolCounts = new Map<string, number>()
      for (const exec of this.toolState.executions) {
        toolCounts.set(exec.toolName, (toolCounts.get(exec.toolName) || 0) + 1)
      }
      this.toolState.statistics.mostUsedTool = 
        Array.from(toolCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

      this.toolState.statistics.lastExecutionTime = executionRecord.timestamp

      if (this.persistenceOptions.persistToDisk) {
        await this.persistState()
      }

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get tool execution history
   */
  async getToolExecutionHistory(toolName?: string, limit?: number): Promise<Result<Array<{
    readonly id: string
    readonly toolName: string
    readonly input: unknown
    readonly output: unknown
    readonly success: boolean
    readonly duration: number
    readonly timestamp: Date
    readonly error?: string
  }>>> {
    let executions = this.toolState.executions

    if (toolName) {
      executions = executions.filter(exec => exec.toolName === toolName)
    }

    if (limit) {
      executions = executions.slice(-limit)
    }

    return Result.success(executions)
  }

  /**
   * Clear tool execution history
   */
  async clearToolExecutionHistory(toolName?: string): Promise<Result<void>> {
    try {
      if (toolName) {
        this.toolState.executions = this.toolState.executions.filter(exec => exec.toolName !== toolName)
      } else {
        this.toolState.executions = []
      }

      if (this.persistenceOptions.persistToDisk) {
        await this.persistState()
      }

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<Result<ReadonlyMap<string, unknown>>> {
    return Result.success(new Map(Object.entries(this.appState.preferences)))
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(preferences: Record<string, unknown>): Promise<Result<void>> {
    try {
      this.appState.preferences = { ...this.appState.preferences, ...preferences }
      
      if (this.persistenceOptions.persistToDisk) {
        await this.persistState()
      }

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Generate a unique ID
   */
  protected generateId(): string {
    return crypto.randomUUID()
  }

  /**
   * Persist state to storage (abstract method)
   */
  protected abstract persistState(): Promise<Result<void>>

  /**
   * Load state from storage (abstract method)
   */
  protected abstract loadState(): Promise<Result<void>>

  /**
   * Export state
   */
  async exportState(): Promise<Result<Record<string, unknown>>> {
    try {
      const state = {
        appState: this.appState,
        conversations: Array.from(this.conversations.entries()),
        toolState: this.toolState,
        exportTime: new Date()
      }

      return Result.success(state)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Import state
   */
  async importState(state: Record<string, unknown>): Promise<Result<void>> {
    try {
      if (!state.appState || !state.conversations || !state.toolState) {
        return Result.failure(new Error('Invalid state format'))
      }

      this.appState = state.appState as AppState
      this.conversations = new Map(state.conversations as Array<[string, ConversationState]>)
      this.toolState = state.toolState as ToolState

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Clear all state
   */
  async clearState(): Promise<Result<void>> {
    try {
      this.conversations.clear()
      this.toolState.executions = []
      this.toolState.statistics = {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        mostUsedTool: '',
        lastExecutionTime: new Date()
      }

      if (this.persistenceOptions.persistToDisk) {
        await this.persistState()
      }

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get state manager statistics
   */
  async getStats(): Promise<Result<StateManagerStats>> {
    const stats: StateManagerStats = {
      totalConversations: this.conversations.size,
      totalMessages: Array.from(this.conversations.values()).reduce((sum, conv) => sum + conv.messages.length, 0),
      totalToolExecutions: this.toolState.statistics.totalExecutions,
      stateSize: JSON.stringify({
        appState: this.appState,
        conversations: Array.from(this.conversations.entries()),
        toolState: this.toolState
      }).length,
      persistenceSuccessRate: 1.0 // Would be calculated based on actual persistence attempts
    }

    return Result.success(stats)
  }

  /**
   * Dispose of the state manager
   */
  async dispose(): Promise<void> {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer)
    }

    if (this.persistenceOptions.persistToDisk) {
      await this.persistState()
    }
  }
}
