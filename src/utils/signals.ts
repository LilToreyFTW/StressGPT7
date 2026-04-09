import { createLogger } from './logger.js'

const logger = createLogger('signals')

export function handleSignals(callback: () => void): void {
  const shutdown = (signal: string): void => {
    logger.info(`Received ${signal}, initiating shutdown...`)
    callback()
  }

  // Handle common termination signals
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  
  // Handle uncaught exceptions and rejections
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error)
    shutdown('uncaughtException')
  })
  
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason)
    shutdown('unhandledRejection')
  })
}
