export interface AnthropicAPIConfig {
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
}

export interface APIConfig {
  anthropic: AnthropicAPIConfig
}

export interface SystemConfig {
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  enableTelemetry: boolean
  enablePlugins: boolean
  enableSkills: boolean
  enableMCP: boolean
}

export interface UIConfig {
  theme: 'light' | 'dark' | 'auto'
  enableColors: boolean
  enableProgress: boolean
}

export interface PerformanceConfig {
  maxConcurrentTools: number
  timeoutMs: number
  enableCaching: boolean
}

export interface SecurityConfig {
  enableSandbox: boolean
  allowedDomains: string[]
  maxFileSize: number
}

export interface StressGPT7Config {
  api: APIConfig
  system: SystemConfig
  ui: UIConfig
  performance: PerformanceConfig
  security: SecurityConfig
}
