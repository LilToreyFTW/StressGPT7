import type { StressGPT7Config } from '../types/config.js'
import { createLogger } from './logger.js'

const logger = createLogger('validation')

export function validateConfig(config: StressGPT7Config): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate API configuration
  // Local AI doesn't require API key, so no validation needed for that
  
  if (config.api.localAI.maxTokens < 1 || config.api.localAI.maxTokens > 200000) {
    errors.push('maxTokens must be between 1 and 200000')
  }

  if (config.api.localAI.temperature < 0 || config.api.localAI.temperature > 2) {
    errors.push('temperature must be between 0 and 2')
  }

  // Validate performance configuration
  if (config.performance.maxConcurrentTools < 1 || config.performance.maxConcurrentTools > 20) {
    errors.push('maxConcurrentTools must be between 1 and 20')
  }

  if (config.performance.timeoutMs < 1000 || config.performance.timeoutMs > 300000) {
    errors.push('timeoutMs must be between 1000ms and 300000ms (5 minutes)')
  }

  // Validate security configuration
  if (config.security.maxFileSize < 1024 || config.security.maxFileSize > 100 * 1024 * 1024) {
    errors.push('maxFileSize must be between 1KB and 100MB')
  }

  // Validate allowed domains
  if (config.security.allowedDomains.some(domain => !isValidDomain(domain))) {
    errors.push('allowedDomains contains invalid domain names')
  }

  const isValid = errors.length === 0
  
  if (!isValid) {
    logger.error('Configuration validation failed:', errors)
  } else {
    logger.info('Configuration validation passed')
  }

  return { isValid, errors }
}

function isValidDomain(domain: string): boolean {
  if (!domain || domain.length === 0) return true // Empty string means no restriction
  
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/
  return domainRegex.test(domain)
}

export function validateInput(input: unknown, schema: Record<string, unknown>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (typeof input !== 'object' || input === null) {
    errors.push('Input must be an object')
    return { isValid: false, errors }
  }

  const inputObj = input as Record<string, unknown>

  // Check required fields
  if (schema.required && Array.isArray(schema.required)) {
    for (const requiredField of schema.required) {
      if (!(requiredField in inputObj)) {
        errors.push(`Missing required field: ${requiredField}`)
      }
    }
  }

  // Validate field types
  if (schema.properties && typeof schema.properties === 'object') {
    for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
      if (fieldName in inputObj) {
        const fieldValue = inputObj[fieldName]
        const fieldValidation = validateField(fieldValue, fieldSchema as Record<string, unknown>)
        if (!fieldValidation.isValid) {
          errors.push(...fieldValidation.errors.map(err => `${fieldName}: ${err}`))
        }
      }
    }
  }

  return { isValid: errors.length === 0, errors }
}

function validateField(value: unknown, schema: Record<string, unknown>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Type validation
  if (schema.type) {
    const expectedType = schema.type as string
    const actualType = typeof value

    if (expectedType === 'string' && actualType !== 'string') {
      errors.push(`Expected string, got ${actualType}`)
    } else if (expectedType === 'number' && actualType !== 'number') {
      errors.push(`Expected number, got ${actualType}`)
    } else if (expectedType === 'boolean' && actualType !== 'boolean') {
      errors.push(`Expected boolean, got ${actualType}`)
    } else if (expectedType === 'array' && !Array.isArray(value)) {
      errors.push(`Expected array, got ${actualType}`)
    } else if (expectedType === 'object' && (actualType !== 'object' || value === null || Array.isArray(value))) {
      errors.push(`Expected object, got ${actualType}`)
    }
  }

  // Enum validation
  if (schema.enum && Array.isArray(schema.enum)) {
    if (!schema.enum.includes(value)) {
      errors.push(`Value must be one of: ${schema.enum.join(', ')}`)
    }
  }

  return { isValid: errors.length === 0, errors }
}
