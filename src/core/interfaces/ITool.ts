/**
 * Core tool interface for the StressGPT7 tool system
 * Defines the contract that all tools must implement
 */

import { Result } from '../types/Result.js'

/**
 * Tool execution context containing runtime information
 */
export interface ToolContext {
  /** Current working directory */
  readonly cwd: string
  /** User preferences */
  readonly preferences: ReadonlyMap<string, unknown>
  /** Environment variables */
  readonly env: ReadonlyMap<string, string>
  /** Security context */
  readonly security: {
    readonly sandboxed: boolean
    readonly maxFileSize: number
    readonly allowedPaths: readonly string[]
  }
}

/**
 * Tool input/output schema definitions
 */
export interface ToolSchema {
  /** JSON schema for input validation */
  readonly input: {
    readonly type: 'object'
    readonly properties: Record<string, unknown>
    readonly required: string[]
    readonly additionalProperties: boolean
  }
  /** JSON schema for output validation */
  readonly output?: {
    readonly type: 'object'
    readonly properties: Record<string, unknown>
    readonly required: string[]
    readonly additionalProperties: boolean
  }
}

/**
 * Tool execution result
 */
export interface ToolResult<TOutput = unknown> {
  /** Whether the execution was successful */
  readonly success: boolean
  /** The output data if successful */
  readonly output?: TOutput
  /** Error information if failed */
  readonly error?: {
    readonly code: string
    readonly message: string
    readonly details?: Record<string, unknown>
  }
  /** Execution metadata */
  readonly metadata: {
    readonly duration: number
    readonly memoryUsage?: number
    readonly timestamp: Date
  }
}

/**
 * Tool capability flags
 */
export interface ToolCapabilities {
  /** Whether the tool can run asynchronously */
  readonly supportsAsync: boolean
  /** Whether the tool requires network access */
  readonly requiresNetwork: boolean
  /** Whether the tool requires file system access */
  readonly requiresFileSystem: boolean
  /** Whether the tool is sandbox-safe */
  readonly isSandboxSafe: boolean
  /** Maximum execution timeout in milliseconds */
  readonly maxTimeout: number
}

/**
 * Core tool interface that all tools must implement
 */
export interface ITool<TInput = unknown, TOutput = unknown> {
  /** Unique tool identifier */
  readonly name: string
  /** Human-readable tool description */
  readonly description: string
  /** Tool version */
  readonly version: string
  /** Tool author */
  readonly author: string
  /** Tool tags for categorization */
  readonly tags: string[]
  /** Tool capabilities */
  readonly capabilities: ToolCapabilities
  /** Input/output schema */
  readonly schema: ToolSchema

  /**
   * Check if the tool is enabled
   */
  isEnabled(): boolean

  /**
   * Validate input against the tool's schema
   */
  validateInput(input: unknown): Result<TInput, Error>

  /**
   * Execute the tool with the given input and context
   */
  execute(input: TInput, context: ToolContext): Promise<Result<ToolResult<TOutput>>>

  /**
   * Get tool help/documentation
   */
  getHelp(): {
    readonly description: string
    readonly examples: Array<{
      readonly input: unknown
      readonly description: string
    }>
    readonly notes: string[]
  }

  /**
   * Cleanup resources when tool is destroyed
   */
  dispose?(): Promise<void>
}

/**
 * Abstract base tool class providing common functionality
 */
export abstract class BaseTool<TInput = unknown, TOutput = unknown> implements ITool<TInput, TOutput> {
  public abstract readonly name: string
  public abstract readonly description: string
  public abstract readonly version: string
  public abstract readonly author: string
  public abstract readonly tags: string[]
  public abstract readonly capabilities: ToolCapabilities
  public abstract readonly schema: ToolSchema

  /**
   * Check if the tool is enabled
   */
  isEnabled(): boolean {
    return true
  }

  /**
   * Validate input against the tool's schema
   */
  validateInput(input: unknown): Result<TInput, Error> {
    try {
      // Basic validation - in a real implementation, use a JSON schema validator
      if (typeof input !== 'object' || input === null) {
        return Result.failure(new Error('INVALID_INPUT: Input must be an object'))
      }

      // Check required properties
      const required = this.schema.input.required
      const inputObj = input as Record<string, unknown>
      
      for (const prop of required) {
        if (!(prop in inputObj)) {
          return Result.failure(new Error(`MISSING_PROPERTY: Missing required property: ${prop}`))
        }
      }

      return Result.success(input as TInput)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Execute the tool with the given input and context
   */
  abstract execute(input: TInput, context: ToolContext): Promise<Result<ToolResult<TOutput>>>

  /**
   * Get tool help/documentation
   */
  getHelp(): {
    readonly description: string
    readonly examples: Array<{
      readonly input: unknown
      readonly description: string
    }>
    readonly notes: string[]
  } {
    return {
      description: this.description,
      examples: [],
      notes: []
    }
  }

  /**
   * Create a successful tool result
   */
  protected createSuccess(output: TOutput, duration: number): ToolResult<TOutput> {
    return {
      success: true,
      output,
      metadata: {
        duration,
        timestamp: new Date()
      }
    }
  }

  /**
   * Create a failed tool result
   */
  protected createFailure(
    code: string,
    message: string,
    duration: number,
    details?: Record<string, unknown>
  ): ToolResult<TOutput> {
    return {
      success: false,
      error: {
        code,
        message,
        details
      },
      metadata: {
        duration,
        timestamp: new Date()
      }
    }
  }
}

/**
 * Tool factory interface for creating tool instances
 */
export interface IToolFactory {
  /** Tool type identifier */
  readonly type: string
  
  /**
   * Create a new tool instance
   */
  create(): ITool
  
  /**
   * Get tool metadata without creating an instance
   */
  getMetadata(): {
    readonly name: string
    readonly description: string
    readonly version: string
    readonly author: string
    readonly tags: string[]
    readonly capabilities: ToolCapabilities
  }
}
