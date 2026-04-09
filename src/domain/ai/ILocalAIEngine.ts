/**
 * Enhanced Local AI Engine Interface for StressGPT7
 * Provides advanced AI reasoning capabilities with knowledge base integration
 */

import { Result } from '../../core/types/Result.js'
import type { ConversationContext } from '../query/QueryEngine.ts'
import type { QueryAnalysis } from '../query/QueryEngine.ts'
import type { QueryOptions } from '../query/QueryEngine.ts'

/**
 * AI response with comprehensive information
 */
export interface AIResponse {
  /** Response content */
  readonly content: string
  /** AI reasoning process */
  readonly reasoning: string
  /** Confidence score (0-1) */
  readonly confidence: number
  /** Tokens used in response */
  readonly tokensUsed: number
  /** Processing time in milliseconds */
  readonly processingTime: number
  /** Tools that were used during reasoning */
  readonly toolsUsed: readonly string[]
  /** Response metadata */
  readonly metadata: {
    readonly model: string
    readonly temperature: number
    readonly maxTokens: number
    readonly timestamp: Date
  }
}

/**
 * Knowledge base entry
 */
export interface KnowledgeEntry {
  /** Entry identifier */
  readonly id: string
  /** Entry content */
  readonly content: string
  /** Entry category */
  readonly category: string
  /** Entry tags */
  readonly tags: readonly string[]
  /** Entry relevance score */
  readonly relevance: number
  /** Entry confidence */
  readonly confidence: number
}

/**
 * Reasoning context for AI processing
 */
export interface ReasoningContext {
  /** Query being processed */
  readonly query: string
  /** Conversation context */
  readonly conversationContext: ConversationContext
  /** Query analysis */
  readonly analysis: QueryAnalysis
  /** Processing options */
  readonly options: QueryOptions
  /** Available tools */
  readonly availableTools: readonly string[]
}

/**
 * AI processing options
 */
export interface AIProcessingOptions {
  /** Maximum reasoning depth */
  readonly maxReasoningDepth?: number
  /** Whether to use knowledge base */
  readonly useKnowledgeBase?: boolean
  /** Whether to include tool suggestions */
  readonly includeToolSuggestions?: boolean
  /** Response format preferences */
  readonly responseFormat?: 'text' | 'markdown' | 'json'
}

/**
 * Core local AI engine interface
 */
export interface ILocalAIEngine {
  /**
   * Process a query and generate response
   */
  processQuery(
    query: string,
    context?: {
      conversationContext?: ConversationContext
      analysis?: QueryAnalysis
      options?: QueryOptions
    }
  ): Promise<Result<AIResponse>>

  /**
   * Analyze a query for classification and processing
   */
  analyzeQuery(query: string): Promise<Result<QueryAnalysis>>

  /**
   * Search knowledge base for relevant information
   */
  searchKnowledgeBase(query: string, limit?: number): Promise<Result<readonly KnowledgeEntry[]>>

  /**
   * Add knowledge to the knowledge base
   */
  addToKnowledgeBase(entry: Omit<KnowledgeEntry, 'id'>): Promise<Result<string>>

  /**
   * Remove knowledge from the knowledge base
   */
  removeFromKnowledgeBase(id: string): Promise<Result<void>>

  /**
   * Update knowledge in the knowledge base
   */
  updateKnowledgeBase(id: string, updates: Partial<Omit<KnowledgeEntry, 'id'>>): Promise<Result<void>>

  /**
   * Get AI engine statistics
   */
  getStats(): Promise<Result<{
    readonly totalQueries: number
    readonly averageResponseTime: number
    readonly averageConfidence: number
    readonly knowledgeBaseSize: number
    readonly topDomains: readonly string[]
  }>>

  /**
   * Configure AI engine settings
   */
  configure(settings: {
    readonly temperature?: number
    readonly maxTokens?: number
    readonly reasoningDepth?: number
    readonly knowledgeBaseEnabled?: boolean
  }): Promise<Result<void>>

  /**
   * Dispose of the AI engine
   */
  dispose(): Promise<void>
}

/**
 * Abstract base local AI engine providing common functionality
 */
export abstract class BaseLocalAIEngine implements ILocalAIEngine {
  protected knowledgeBase = new Map<string, KnowledgeEntry>()
  protected stats = {
    totalQueries: 0,
    totalResponseTime: 0,
    totalConfidence: 0,
    topDomains: new Map<string, number>()
  }

  /**
   * Process a query and generate response
   */
  async processQuery(
    query: string,
    context?: {
      conversationContext?: ConversationContext
      analysis?: QueryAnalysis
      options?: QueryOptions
    }
  ): Promise<Result<AIResponse>> {
    const startTime = Date.now()
    
    try {
      this.stats.totalQueries++

      // Analyze query if not provided
      let analysis: QueryAnalysis
      if (context?.analysis) {
        // Check if it's a Result type
        const analysisObj = context.analysis as any
        if (analysisObj && typeof analysisObj === 'object' && 'isFailure' in analysisObj) {
          const analysisResult = analysisObj as Result<QueryAnalysis>
          if (analysisResult.isFailure()) {
            return Result.failure(analysisResult.error)
          }
          analysis = analysisResult.value
        } else {
          analysis = context.analysis as QueryAnalysis
        }
      } else {
        const analysisResult = await this.analyzeQuery(query)
        if (analysisResult.isFailure()) {
          return Result.failure(analysisResult.error)
        }
        analysis = analysisResult.value
      }

      // Search knowledge base if enabled
      const knowledgeResults = await this.searchKnowledgeBase(query, 5)
      
      // Generate response
      const response = await this.generateResponse(query, {
        query,
        conversationContext: context?.conversationContext || this.createDefaultContext(),
        analysis,
        options: context?.options || {},
        availableTools: analysis.requiredTools
      })

      if (response.isFailure()) {
        return Result.failure(response.error)
      }

      // Update statistics
      const processingTime = Date.now() - startTime
      this.updateStats(processingTime, response.value.confidence, analysis.domains)

      return Result.success({
        ...response.value,
        processingTime
      })
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Analyze a query for classification and processing
   */
  async analyzeQuery(query: string): Promise<Result<QueryAnalysis>> {
    try {
      const analysis = await this.performQueryAnalysis(query)
      return Result.success(analysis)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Search knowledge base for relevant information
   */
  async searchKnowledgeBase(query: string, limit = 10): Promise<Result<readonly KnowledgeEntry[]>> {
    try {
      const results = this.performKnowledgeSearch(query, limit)
      return Result.success(results)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Add knowledge to the knowledge base
   */
  async addToKnowledgeBase(entry: Omit<KnowledgeEntry, 'id'>): Promise<Result<string>> {
    try {
      const id = this.generateKnowledgeId()
      const knowledgeEntry: KnowledgeEntry = {
        ...entry,
        id
      }

      this.knowledgeBase.set(id, knowledgeEntry)
      return Result.success(id)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Remove knowledge from the knowledge base
   */
  async removeFromKnowledgeBase(id: string): Promise<Result<void>> {
    try {
      const deleted = this.knowledgeBase.delete(id)
      if (!deleted) {
        return Result.failure(new Error(`Knowledge entry '${id}' not found`))
      }
      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Update knowledge in the knowledge base
   */
  async updateKnowledgeBase(id: string, updates: Partial<Omit<KnowledgeEntry, 'id'>>): Promise<Result<void>> {
    try {
      const existing = this.knowledgeBase.get(id)
      if (!existing) {
        return Result.failure(new Error(`Knowledge entry '${id}' not found`))
      }

      const updated: KnowledgeEntry = {
        ...existing,
        ...updates
      }

      this.knowledgeBase.set(id, updated)
      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get AI engine statistics
   */
  async getStats(): Promise<Result<{
    readonly totalQueries: number
    readonly averageResponseTime: number
    readonly averageConfidence: number
    readonly knowledgeBaseSize: number
    readonly topDomains: readonly string[]
  }>> {
    try {
      const averageResponseTime = this.stats.totalQueries > 0 
        ? this.stats.totalResponseTime / this.stats.totalQueries 
        : 0

      const averageConfidence = this.stats.totalQueries > 0 
        ? this.stats.totalConfidence / this.stats.totalQueries 
        : 0

      const topDomains = Array.from(this.stats.topDomains.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([domain]) => domain)

      return Result.success({
        totalQueries: this.stats.totalQueries,
        averageResponseTime,
        averageConfidence,
        knowledgeBaseSize: this.knowledgeBase.size,
        topDomains
      })
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Configure AI engine settings
   */
  async configure(settings: {
    readonly temperature?: number
    readonly maxTokens?: number
    readonly reasoningDepth?: number
    readonly knowledgeBaseEnabled?: boolean
  }): Promise<Result<void>> {
    try {
      await this.applyConfiguration(settings)
      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Dispose of the AI engine
   */
  async dispose(): Promise<void> {
    this.knowledgeBase.clear()
    this.stats.totalQueries = 0
    this.stats.totalResponseTime = 0
    this.stats.totalConfidence = 0
    this.stats.topDomains.clear()
  }

  /**
   * Generate response (abstract method to be implemented by concrete classes)
   */
  protected abstract generateResponse(
    query: string,
    context: ReasoningContext
  ): Promise<Result<AIResponse>>

  /**
   * Perform query analysis (abstract method)
   */
  protected abstract performQueryAnalysis(query: string): Promise<QueryAnalysis>

  /**
   * Perform knowledge search (abstract method)
   */
  protected abstract performKnowledgeSearch(query: string, limit: number): readonly KnowledgeEntry[]

  /**
   * Apply configuration (abstract method)
   */
  protected abstract applyConfiguration(settings: {
    readonly temperature?: number
    readonly maxTokens?: number
    readonly reasoningDepth?: number
    readonly knowledgeBaseEnabled?: boolean
  }): Promise<void>

  /**
   * Create default conversation context
   */
  protected createDefaultContext(): ConversationContext {
    return {
      conversationId: 'default',
      messages: [],
      turnNumber: 0,
      metadata: {
        startTime: new Date(),
        lastMessageTime: new Date(),
        totalTokensUsed: 0,
        averageResponseTime: 0
      }
    }
  }

  /**
   * Generate unique knowledge ID
   */
  protected generateKnowledgeId(): string {
    return crypto.randomUUID()
  }

  /**
   * Update statistics
   */
  private updateStats(processingTime: number, confidence: number, domains: readonly string[]): void {
    this.stats.totalResponseTime += processingTime
    this.stats.totalConfidence += confidence

    // Update domain statistics
    for (const domain of domains) {
      this.stats.topDomains.set(domain, (this.stats.topDomains.get(domain) || 0) + 1)
    }
  }
}
