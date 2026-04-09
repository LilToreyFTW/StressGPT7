/**
 * Tool Manager interface for managing tool lifecycle and execution
 * Provides a clean abstraction for tool registration, discovery, and execution
 */

import { Result, Success, Failure } from '../types/Result.js'
import type { ITool, ToolContext, ToolResult } from './ITool.js'

/**
 * Tool registration options
 */
export interface ToolRegistrationOptions {
  /** Whether the tool should be enabled by default */
  enabled?: boolean
  /** Tool priority for execution order */
  readonly priority?: number
  /** Tool tags for categorization */
  readonly tags?: string[]
  /** Tool configuration */
  readonly config?: Record<string, unknown>
}

/**
 * Tool execution options
 */
export interface ToolExecutionOptions {
  /** Execution timeout in milliseconds */
  readonly timeout?: number
  /** Whether to execute in sandbox mode */
  readonly sandbox?: boolean
  /** Execution context overrides */
  readonly contextOverrides?: Partial<ToolContext>
  /** Whether to retry on failure */
  readonly retry?: {
    readonly attempts: number
    readonly delay: number
  }
}

/**
 * Tool manager statistics
 */
export interface ToolManagerStats {
  /** Total number of registered tools */
  totalTools: number
  /** Number of enabled tools */
  enabledTools: number
  /** Total executions */
  totalExecutions: number
  /** Successful executions */
  successfulExecutions: number
  /** Failed executions */
  failedExecutions: number
  /** Average execution time */
  averageExecutionTime: number
}

/**
 * Core tool manager interface
 */
export interface IToolManager {
  /**
   * Register a new tool
   */
  registerTool(tool: ITool, options?: ToolRegistrationOptions): Promise<Result<void>>

  /**
   * Unregister a tool by name
   */
  unregisterTool(name: string): Promise<Result<void>>

  /**
   * Get a tool by name
   */
  getTool(name: string): Promise<Result<ITool>>

  /**
   * Get all registered tools
   */
  getAllTools(): Promise<Result<ReadonlyArray<ITool>>>

  /**
   * Get tools by tag
   */
  getToolsByTag(tag: string): Promise<Result<ReadonlyArray<ITool>>>

  /**
   * Get enabled tools
   */
  getEnabledTools(): Promise<Result<ReadonlyArray<ITool>>>

  /**
   * Check if a tool exists
   */
  hasTool(name: string): Promise<boolean>

  /**
   * Enable or disable a tool
   */
  setToolEnabled(name: string, enabled: boolean): Promise<Result<void>>

  /**
   * Execute a tool
   */
  executeTool<TInput = unknown, TOutput = unknown>(
    name: string,
    input: TInput,
    options?: ToolExecutionOptions
  ): Promise<Result<ToolResult<TOutput>>>

  /**
   * Execute multiple tools in parallel
   */
  executeToolsParallel<TInput = unknown, TOutput = unknown>(
    executions: Array<{
      readonly name: string
      readonly input: TInput
      readonly options?: ToolExecutionOptions
    }>
  ): Promise<Result<Array<ToolResult<TOutput>>>>

  /**
   * Validate tool input
   */
  validateToolInput(name: string, input: unknown): Promise<Result<unknown>>

  /**
   * Get tool help/documentation
   */
  getToolHelp(name: string): Promise<Result<ReturnType<ITool['getHelp']>>>

  /**
   * Get tool manager statistics
   */
  getStats(): Promise<ToolManagerStats>

  /**
   * Clear all tools
   */
  clear(): Promise<Result<void>>

  /**
   * Dispose of the tool manager
   */
  dispose(): Promise<void>
}

/**
 * Abstract base tool manager providing common functionality
 */
export abstract class BaseToolManager implements IToolManager {
  protected readonly tools = new Map<string, ITool>()
  protected readonly toolConfigs = new Map<string, ToolRegistrationOptions>()
  protected readonly stats: ToolManagerStats = {
    totalTools: 0,
    enabledTools: 0,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0
  }

  /**
   * Register a new tool
   */
  async registerTool(tool: ITool, options: ToolRegistrationOptions = {}): Promise<Result<void>> {
    try {
      if (this.tools.has(tool.name)) {
        return Result.failure(new Error(`Tool '${tool.name}' is already registered`))
      }

      this.tools.set(tool.name, tool)
      this.toolConfigs.set(tool.name, { enabled: true, ...options })
      
      // Update stats
      this.stats.totalTools++
      if (options.enabled !== false) {
        this.stats.enabledTools++
      }

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Unregister a tool by name
   */
  async unregisterTool(name: string): Promise<Result<void>> {
    try {
      const tool = this.tools.get(name)
      if (!tool) {
        return Result.failure(new Error(`Tool '${name}' is not registered`))
      }

      // Dispose tool if it has dispose method
      if (tool.dispose) {
        await tool.dispose()
      }

      this.tools.delete(name)
      this.toolConfigs.delete(name)
      
      // Update stats
      this.stats.totalTools--
      const config = this.toolConfigs.get(name)
      if (config?.enabled !== false) {
        this.stats.enabledTools--
      }

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get a tool by name
   */
  async getTool(name: string): Promise<Result<ITool>> {
    const tool = this.tools.get(name)
    if (!tool) {
      return Result.failure(new Error(`Tool '${name}' is not registered`))
    }
    return Result.success(tool)
  }

  /**
   * Get all registered tools
   */
  async getAllTools(): Promise<Result<ReadonlyArray<ITool>>> {
    return Result.success(Array.from(this.tools.values()))
  }

  /**
   * Get tools by tag
   */
  async getToolsByTag(tag: string): Promise<Result<ReadonlyArray<ITool>>> {
    const tools = Array.from(this.tools.values()).filter(tool => 
      tool.tags.includes(tag)
    )
    return Result.success(tools)
  }

  /**
   * Get enabled tools
   */
  async getEnabledTools(): Promise<Result<ReadonlyArray<ITool>>> {
    const tools = Array.from(this.tools.values()).filter(tool => {
      const config = this.toolConfigs.get(tool.name)
      return config?.enabled !== false && tool.isEnabled()
    })
    return Result.success(tools)
  }

  /**
   * Check if a tool exists
   */
  async hasTool(name: string): Promise<boolean> {
    return this.tools.has(name)
  }

  /**
   * Enable or disable a tool
   */
  async setToolEnabled(name: string, enabled: boolean): Promise<Result<void>> {
    try {
      const config = this.toolConfigs.get(name)
      if (!config) {
        return Result.failure(new Error(`Tool '${name}' is not registered`))
      }

      const wasEnabled = config.enabled !== false
      config.enabled = enabled

      // Update stats
      if (wasEnabled && !enabled) {
        this.stats.enabledTools--
      } else if (!wasEnabled && enabled) {
        this.stats.enabledTools++
      }

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Execute a tool
   */
  async executeTool<TInput = unknown, TOutput = unknown>(
    name: string,
    input: TInput,
    options: ToolExecutionOptions = {}
  ): Promise<Result<ToolResult<TOutput>>> {
    const startTime = Date.now()
    
    try {
      // Update execution stats
      this.stats.totalExecutions++

      // Get tool
      const toolResult = await this.getTool(name)
      if (toolResult.isFailure()) {
        this.stats.failedExecutions++
        return Result.failure(toolResult.error)
      }
      const tool = toolResult.value

      // Check if tool is enabled
      const config = this.toolConfigs.get(name)
      if (config?.enabled === false || !tool.isEnabled()) {
        this.stats.failedExecutions++
        return Result.failure(new Error(`Tool '${name}' is disabled`))
      }

      // Validate input
      const validationResult = tool.validateInput(input)
      if (validationResult.isFailure()) {
        this.stats.failedExecutions++
        return Result.failure(validationResult.error)
      }

      // Create context
      const context = await this.createContext(options.contextOverrides)

      // Execute with timeout
      const result = await this.executeWithTimeout(
        tool,
        validationResult.value,
        context,
        options.timeout
      )

      // Update stats
      const duration = Date.now() - startTime
      this.updateExecutionStats(duration, result.isSuccess())

      // Cast the result to the expected type
      return result as Result<ToolResult<TOutput>>
    } catch (error) {
      const duration = Date.now() - startTime
      this.updateExecutionStats(duration, false)
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Execute multiple tools in parallel
   */
  async executeToolsParallel<TInput = unknown, TOutput = unknown>(
    executions: Array<{
      readonly name: string
      readonly input: TInput
      readonly options?: ToolExecutionOptions
    }>
  ): Promise<Result<Array<ToolResult<TOutput>>>> {
    const promises = executions.map(async exec => {
      const result = await this.executeTool<TInput, TOutput>(exec.name, exec.input, exec.options)
      if (result.isFailure()) {
        return result
      }
      return result
    })

    try {
      const results = await Promise.all(promises)
      const successfulResults = results.filter(r => r.isSuccess()) as Array<Success<ToolResult<TOutput>, Error>>
      const failedResults = results.filter(r => r.isFailure()) as Array<Failure<ToolResult<TOutput>, Error>>
      
      if (failedResults.length > 0) {
        return Result.failure(failedResults[0].error)
      }
      
      return Result.success(successfulResults.map(r => r.value))
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Validate tool input
   */
  async validateToolInput(name: string, input: unknown): Promise<Result<unknown>> {
    const toolResult = await this.getTool(name)
    if (toolResult.isFailure()) {
      return toolResult
    }
    return toolResult.value.validateInput(input)
  }

  /**
   * Get tool help/documentation
   */
  async getToolHelp(name: string): Promise<Result<ReturnType<ITool['getHelp']>>> {
    const toolResult = await this.getTool(name)
    if (toolResult.isFailure()) {
      return Result.failure(toolResult.error)
    }
    return Result.success(toolResult.value.getHelp())
  }

  /**
   * Get tool manager statistics
   */
  async getStats(): Promise<ToolManagerStats> {
    return { ...this.stats }
  }

  /**
   * Clear all tools
   */
  async clear(): Promise<Result<void>> {
    try {
      // Dispose all tools
      for (const tool of this.tools.values()) {
        if (tool.dispose) {
          await tool.dispose()
        }
      }

      this.tools.clear()
      this.toolConfigs.clear()
      
      // Reset stats
      this.stats.totalTools = 0
      this.stats.enabledTools = 0
      this.stats.totalExecutions = 0
      this.stats.successfulExecutions = 0
      this.stats.failedExecutions = 0
      this.stats.averageExecutionTime = 0

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Dispose of the tool manager
   */
  async dispose(): Promise<void> {
    await this.clear()
  }

  /**
   * Create execution context
   */
  protected abstract createContext(overrides?: Partial<ToolContext>): Promise<ToolContext>

  /**
   * Execute tool with timeout
   */
  protected abstract executeWithTimeout<TInput, TOutput>(
    tool: ITool<TInput, TOutput>,
    input: TInput,
    context: ToolContext,
    timeout?: number
  ): Promise<Result<ToolResult<TOutput>>>

  /**
   * Update execution statistics
   */
  private updateExecutionStats(duration: number, success: boolean): void {
    if (success) {
      this.stats.successfulExecutions++
    } else {
      this.stats.failedExecutions++
    }

    // Update average execution time
    const totalExecutions = this.stats.successfulExecutions + this.stats.failedExecutions
    this.stats.averageExecutionTime = 
      (this.stats.averageExecutionTime * (totalExecutions - 1) + duration) / totalExecutions
  }
}
