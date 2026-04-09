import { createLogger } from './logger.js'

const logger = createLogger('errorHandler')

export class StressGPT7Error extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'StressGPT7Error'
  }
}

export class ConfigurationError extends StressGPT7Error {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', 400, details)
  }
}

export class ValidationError extends StressGPT7Error {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details)
  }
}

export class ToolExecutionError extends StressGPT7Error {
  constructor(toolName: string, message: string, details?: Record<string, unknown>) {
    super(`Tool execution failed: ${toolName} - ${message}`, 'TOOL_EXECUTION_ERROR', 500, details)
  }
}

export class APIError extends StressGPT7Error {
  constructor(message: string, statusCode: number = 500, details?: Record<string, unknown>) {
    super(message, 'API_ERROR', statusCode, details)
  }
}

export class SecurityError extends StressGPT7Error {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SECURITY_ERROR', 403, details)
  }
}

export function handleError(error: unknown): StressGPT7Error {
  if (error instanceof StressGPT7Error) {
    return error
  }

  if (error instanceof Error) {
    // Convert common Node.js errors to StressGPT7 errors
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message, { stack: error.stack })
    }
    
    if (error.name === 'TypeError') {
      return new ValidationError(`Type error: ${error.message}`, { stack: error.stack })
    }

    if (error.name === 'SyntaxError') {
      return new ValidationError(`Syntax error: ${error.message}`, { stack: error.stack })
    }

    // Generic error
    return new StressGPT7Error(error.message, 'UNKNOWN_ERROR', 500, { 
      originalError: error.name,
      stack: error.stack 
    })
  }

  // Non-Error objects
  return new StressGPT7Error(String(error), 'UNKNOWN_ERROR', 500)
}

export function logError(error: StressGPT7Error, context?: string): void {
  const logData = {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    details: error.details,
    context,
    stack: error.stack
  }

  if (error.statusCode >= 500) {
    logger.error('Server error:', logData)
  } else if (error.statusCode >= 400) {
    logger.warn('Client error:', logData)
  } else {
    logger.info('Error:', logData)
  }
}

export function createErrorBoundary() {
  return {
    async execute<T>(operation: () => Promise<T>, context?: string): Promise<T> {
      try {
        return await operation()
      } catch (error) {
        const stressGPTError = handleError(error)
        logError(stressGPTError, context)
        throw stressGPTError
      }
    },

    async executeWithFallback<T>(
      operation: () => Promise<T>,
      fallback: () => T,
      context?: string
    ): Promise<T> {
      try {
        return await operation()
      } catch (error) {
        const stressGPTError = handleError(error)
        logError(stressGPTError, context)
        return fallback()
      }
    }
  }
}
