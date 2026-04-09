#!/usr/bin/env node

import { StressGPT7 } from './core/StressGPT7.js'
import { createLogger } from './utils/logger.js'
import { loadConfig } from './utils/config.js'
import { handleSignals } from './utils/signals.js'

const logger = createLogger('main')

async function main(): Promise<void> {
  try {
    logger.info('Starting StressGPT7...')
    
    const config = await loadConfig()
    const stressGPT = new StressGPT7(config)
    
    // Handle graceful shutdown
    handleSignals(() => {
      logger.info('Shutting down StressGPT7...')
      void stressGPT.shutdown()
    })
    
    await stressGPT.start()
    
  } catch (error) {
    logger.error('Failed to start StressGPT7:', error)
    process.exit(1)
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void main()
}
