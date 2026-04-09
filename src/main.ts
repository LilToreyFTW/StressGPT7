/**
 * Simple entry point for StressGPT7
 * Uses the existing codebase with minimal changes
 */

import { StressGPT7 } from './core/StressGPT7.js'

async function main() {
  try {
    console.log('Starting StressGPT7...')
    
    // Create and start the application
    const app = new StressGPT7()
    await app.start()
    
    console.log('StressGPT7 is running!')
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down StressGPT7...')
      await app.stop()
      process.exit(0)
    })
    
    process.on('SIGTERM', async () => {
      console.log('\nShutting down StressGPT7...')
      await app.stop()
      process.exit(0)
    })
    
  } catch (error) {
    console.error('Failed to start StressGPT7:', error)
    process.exit(1)
  }
}

main().catch(console.error)
