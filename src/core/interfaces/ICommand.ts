/**
 * Command system interface for StressGPT7 CLI commands
 * Defines the contract that all commands must implement
 */

import { Result } from '../types/Result.js'

/**
 * Command execution context containing runtime information
 */
export interface CommandContext {
  /** Current working directory */
  readonly cwd: string
  /** User preferences */
  readonly preferences: ReadonlyMap<string, unknown>
  /** Environment variables */
  readonly env: ReadonlyMap<string, string>
  /** Command arguments */
  readonly args: readonly string[]
  /** Command options/flags */
  readonly options: ReadonlyMap<string, unknown>
  /** Session state */
  readonly session: {
    readonly userId?: string
    readonly sessionId: string
    readonly startTime: Date
  }
}

/**
 * Command execution result
 */
export interface CommandResult<TOutput = unknown> {
  /** Whether the command was successful */
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
    readonly timestamp: Date
    readonly exitCode?: number
  }
}

/**
 * Command capability flags
 */
export interface CommandCapabilities {
  /** Whether the command can run asynchronously */
  readonly supportsAsync: boolean
  /** Whether the command requires authentication */
  readonly requiresAuth: boolean
  /** Whether the command is admin-only */
  readonly adminOnly: boolean
  /** Whether the command requires network access */
  readonly requiresNetwork: boolean
  /** Maximum execution timeout in milliseconds */
  readonly maxTimeout: number
}

/**
 * Command help information
 */
export interface CommandHelp {
  /** Command name */
  readonly name: string
  /** Command description */
  readonly description: string
  /** Command usage syntax */
  readonly usage: string
  /** Command examples */
  readonly examples: Array<{
    readonly command: string
    readonly description: string
  }>
  /** Available options/flags */
  readonly options: Array<{
    readonly name: string
    readonly short?: string
    readonly description: string
    readonly type: 'string' | 'number' | 'boolean'
    readonly required?: boolean
    readonly default?: unknown
  }>
  /** Additional notes */
  readonly notes: string[]
}

/**
 * Core command interface that all commands must implement
 */
export interface ICommand<TInput = unknown, TOutput = unknown> {
  /** Unique command identifier */
  readonly name: string
  /** Human-readable command description */
  readonly description: string
  /** Command version */
  readonly version: string
  /** Command author */
  readonly author: string
  /** Command capabilities */
  readonly capabilities: CommandCapabilities
  /** Command help information */
  readonly help: CommandHelp

  /**
   * Check if the command is enabled
   */
  isEnabled(): boolean

  /**
   * Validate command input
   */
  validateInput(input: unknown): Result<TInput>

  /**
   * Execute the command with the given context
   */
  execute(input: TInput, context: CommandContext): Promise<Result<CommandResult<TOutput>>>

  /**
   * Get command help/documentation
   */
  getHelp(): CommandHelp

  /**
   * Cleanup resources when command is destroyed
   */
  dispose?(): Promise<void>
}

/**
 * Abstract base command class providing common functionality
 */
export abstract class BaseCommand<TInput = unknown, TOutput = unknown> implements ICommand<TInput, TOutput> {
  public abstract readonly name: string
  public abstract readonly description: string
  public abstract readonly version: string
  public abstract readonly author: string
  public abstract readonly capabilities: CommandCapabilities
  public abstract readonly help: CommandHelp

  /**
   * Check if the command is enabled
   */
  isEnabled(): boolean {
    return true
  }

  /**
   * Validate command input
   */
  validateInput(input: unknown): Result<TInput> {
    try {
      // Basic validation - can be overridden by subclasses
      if (input === undefined || input === null) {
        return Result.success(undefined as TInput)
      }

      if (typeof input !== 'object') {
        return Result.failure(new Error('Input must be an object or undefined'))
      }

      return Result.success(input as TInput)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Execute the command with the given context
   */
  abstract execute(input: TInput, context: CommandContext): Promise<Result<CommandResult<TOutput>>>

  /**
   * Get command help/documentation
   */
  getHelp(): CommandHelp {
    return this.help
  }

  /**
   * Create a successful command result
   */
  protected createSuccess(output: TOutput, duration: number, exitCode = 0): CommandResult<TOutput> {
    return {
      success: true,
      output,
      metadata: {
        duration,
        timestamp: new Date(),
        exitCode
      }
    }
  }

  /**
   * Create a failed command result
   */
  protected createFailure(
    code: string,
    message: string,
    duration: number,
    details?: Record<string, unknown>,
    exitCode = 1
  ): CommandResult<TOutput> {
    return {
      success: false,
      error: {
        code,
        message,
        details
      },
      metadata: {
        duration,
        timestamp: new Date(),
        exitCode
      }
    }
  }

  /**
   * Parse command arguments
   */
  protected parseArgs(args: readonly string[]): Record<string, unknown> {
    const parsed: Record<string, unknown> = {}
    const options = this.help.options

    for (const option of options) {
      const longFlag = `--${option.name}`
      const shortFlag = option.short ? `-${option.short}` : null

      // Find the argument
      let argIndex = -1
      let value: string | undefined

      // Check for long flag
      const longIndex = args.indexOf(longFlag)
      if (longIndex !== -1) {
        argIndex = longIndex
        if (option.type !== 'boolean') {
          value = args[longIndex + 1]
        }
      }
      // Check for short flag
      else if (shortFlag) {
        const shortIndex = args.indexOf(shortFlag)
        if (shortIndex !== -1) {
          argIndex = shortIndex
          if (option.type !== 'boolean') {
            value = args[shortIndex + 1]
          }
        }
      }

      // Set the value
      if (argIndex !== -1) {
        if (option.type === 'boolean') {
          parsed[option.name] = true
        } else if (option.type === 'number') {
          parsed[option.name] = value ? Number(value) : undefined
        } else {
          parsed[option.name] = value
        }
      } else if (option.default !== undefined) {
        parsed[option.name] = option.default
      }
    }

    return parsed
  }

  /**
   * Validate required options
   */
  protected validateRequiredOptions(
    options: Record<string, unknown>,
    context: CommandContext
  ): Result<void> {
    const requiredOptions = this.help.options.filter(opt => opt.required)

    for (const option of requiredOptions) {
      if (!(option.name in options) || options[option.name] === undefined) {
        return Result.failure(new Error(`Missing required option: --${option.name}`))
      }
    }

    return Result.success(void 0)
  }
}

/**
 * Command factory interface for creating command instances
 */
export interface ICommandFactory {
  /** Command type identifier */
  readonly type: string
  
  /**
   * Create a new command instance
   */
  create(): ICommand
  
  /**
   * Get command metadata without creating an instance
   */
  getMetadata(): {
    readonly name: string
    readonly description: string
    readonly version: string
    readonly author: string
    readonly capabilities: CommandCapabilities
  }
}
