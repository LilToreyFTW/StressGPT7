export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  args: unknown[]
  source: string
}

export interface LoggerConfig {
  level: LogLevel
  enableColors: boolean
  enableTimestamps: boolean
  enableSource: boolean
}
