import type { LogLevel } from '@/types/logger.js'

export interface Logger {
  debug(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const COLORS = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m',
} as const

export function createLogger(name: string, level: LogLevel = 'info'): Logger {
  const currentLevel = LOG_LEVELS[level]

  return {
    debug(message: string, ...args: unknown[]): void {
      if (LOG_LEVELS.debug >= currentLevel) {
        console.log(`${COLORS.debug}[DEBUG]${COLORS.reset} ${name}: ${message}`, ...args)
      }
    },
    info(message: string, ...args: unknown[]): void {
      if (LOG_LEVELS.info >= currentLevel) {
        console.log(`${COLORS.info}[INFO]${COLORS.reset} ${name}: ${message}`, ...args)
      }
    },
    warn(message: string, ...args: unknown[]): void {
      if (LOG_LEVELS.warn >= currentLevel) {
        console.warn(`${COLORS.warn}[WARN]${COLORS.reset} ${name}: ${message}`, ...args)
      }
    },
    error(message: string, ...args: unknown[]): void {
      if (LOG_LEVELS.error >= currentLevel) {
        console.error(`${COLORS.error}[ERROR]${COLORS.reset} ${name}: ${message}`, ...args)
      }
    },
  }
}

export function setLogLevel(level: LogLevel): void {
  // This could be enhanced to support runtime level changes
  process.env.STRESSGPT_LOG_LEVEL = level
}
