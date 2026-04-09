import type { StressGPT7Config } from '@/types/config.js'
import { createLogger } from './logger.js'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const logger = createLogger('config')

export async function loadConfig(): Promise<StressGPT7Config> {
  const defaultConfig: StressGPT7Config = {
    api: {
      localAI: {
        model: 'stressgpt7-local',
        maxTokens: 8192,
        temperature: 0.1,
        reasoningDepth: 3
      }
    },
    system: {
      logLevel: 'info',
      enableTelemetry: false,
      enablePlugins: true,
      enableSkills: true,
      enableMCP: true,
    },
    ui: {
      theme: 'auto',
      enableColors: true,
      enableProgress: true,
    },
    performance: {
      maxConcurrentTools: 5,
      timeoutMs: 30000,
      enableCaching: true,
    },
    security: {
      enableSandbox: true,
      allowedDomains: [],
      maxFileSize: 10 * 1024 * 1024, // 10MB
    },
  }

  try {
    // Try to load config file
    const configPath = resolve(process.cwd(), 'stressgpt7.config.json')
    const configData = await readFile(configPath, 'utf-8')
    const userConfig = JSON.parse(configData) as Partial<StressGPT7Config>
    
    // Merge with defaults
    const config = mergeConfig(defaultConfig, userConfig)
    logger.info('Configuration loaded successfully')
    return config
    
  } catch (error) {
    logger.warn('Could not load config file, using defaults:', error)
    return defaultConfig
  }
}

function mergeConfig(defaults: StressGPT7Config, user: Partial<StressGPT7Config>): StressGPT7Config {
  return {
    api: { ...defaults.api, ...user.api },
    system: { ...defaults.system, ...user.system },
    ui: { ...defaults.ui, ...user.ui },
    performance: { ...defaults.performance, ...user.performance },
    security: { ...defaults.security, ...user.security },
  }
}

export function validateConfig(config: StressGPT7Config): boolean {
  const errors: string[] = []
  
  if (config.performance.maxConcurrentTools < 1) {
    logger.error('maxConcurrentTools must be at least 1')
    return false
  }
  
  if (config.performance.timeoutMs < 1000) {
    logger.error('timeoutMs must be at least 1000ms')
    return false
  }
  
  if (config.api.localAI.maxTokens < 1 || config.api.localAI.maxTokens > 200000) {
    errors.push('maxTokens must be between 1 and 200000')
  }

  if (config.api.localAI.temperature < 0 || config.api.localAI.temperature > 2) {
    errors.push('temperature must be between 0 and 2')
  }
  
  if (errors.length > 0) {
    logger.error('Configuration validation failed:', errors.join(', '))
    return false
  }
  
  return true
}
