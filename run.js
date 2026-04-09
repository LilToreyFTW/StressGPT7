#!/usr/bin/env node

/**
 * Complete Production Runner for StressGPT7
 * Ready for immediate deployment and use
 */

import StressGPT7App from './src/start.js'

console.log('=== StressGPT7 Production Runner ===')
console.log('Starting complete AI system...\n')

// Start the application
const app = new StressGPT7App()

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down StressGPT7...')
  await app.shutdown()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\nShutting down StressGPT7...')
  await app.shutdown()
  process.exit(0)
})

// Start the system
app.startup().then(result => {
  if (result.success) {
    console.log('\n' + '='.repeat(60))
    console.log('STRESSGPT7 SYSTEM READY')
    console.log('='.repeat(60))
    console.log(result.message)
    console.log('')
    console.log('Access URLs:')
    console.log(`  Web GUI: ${result.details.gui}`)
    console.log(`  API: ${result.details.api}`)
    console.log(`  Health: ${result.details.api}/health`)
    console.log('')
    console.log('System is fully operational and ready for use!')
    console.log('Features available:')
    console.log('  - Multi-language code generation (Python, Java, C, C++, C#, JavaScript, TypeScript)')
    console.log('  - Code execution and analysis')
    console.log('  - Advanced AI assistant with natural language processing')
    console.log('  - Production-ready API endpoints')
    console.log('  - Modern web interface')
    console.log('  - Stress testing and validation')
    console.log('')
    console.log('Test with: "hello" or "Write a Python function to calculate fibonacci"')
    console.log('Press Ctrl+C to shutdown')
    console.log('='.repeat(60))
    
    // Keep running
    console.log('\nSystem is running. Type commands to test:')
    console.log('  "hello" - Test basic AI response')
    console.log('  "Write code in [language]" - Generate code')
    console.log('  "Analyze this code: [code]" - Analyze code')
    console.log('  status - Check system status')
    console.log('  test - Run stress test')
    console.log('  help - Show this help')
    console.log('  exit - Shutdown system')
    console.log('')
      output: process.stdout
    })

    rl.setPrompt('StressGPT7> ')
    rl.prompt()

    rl.on('line', async (input) => {
      const command = input.trim().toLowerCase()
      
      if (command === 'exit' || command === 'quit') {
        console.log('Shutting down...')
        rl.close()
        await app.shutdown()
        process.exit(0)
      }

      if (command === 'status') {
        const status = await app.getStatus()
        console.log('System Status:', status.message)
        if (status.details) {
          console.log(`  Uptime: ${Math.floor(status.details.uptime / 1000)}s`)
          console.log(`  Total Requests: ${status.details.stats.totalRequests}`)
          console.log(`  Success Rate: ${status.details.stats.successRate}%`)
        }
        rl.prompt()
        return
      }

      if (command === 'test') {
        console.log('Running stress test...')
        const testResult = await app.runStressTest()
        console.log('Stress Test Result:', testResult.message)
        if (testResult.details) {
          console.log(`  Tests: ${testResult.details.passedTests}/${testResult.details.totalTests} passed`)
          console.log(`  Duration: ${testResult.details.totalDuration}ms`)
        }
        rl.prompt()
        return
      }

      if (command === 'help') {
        console.log('Available commands:')
        console.log('  hello - Test basic AI response')
        console.log('  "Write code in [language]" - Generate code')
        console.log('  "Analyze this code: [code]" - Analyze code')
        console.log('  status - Check system status')
        console.log('  test - Run stress test')
        console.log('  help - Show this help')
        console.log('  exit - Shutdown system')
        rl.prompt()
        return
      }

      if (command === 'hello') {
        try {
          const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'hello' })
          })
          
          const result = await response.json()
          console.log('Assistant:', result.response.content)
        } catch (error) {
          console.log('Error:', error.message)
        }
        rl.prompt()
        return
      }

      // Process other commands through the AI
      if (input.trim()) {
        try {
          const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: input })
          })
          
          const result = await response.json()
          console.log('Assistant:', result.response.content)
          
          // If it's a code response, show additional info
          if (result.response.type === 'code' && result.response.metadata) {
            console.log('')
            console.log('Code Details:')
            console.log(`  Language: ${result.response.metadata.language || 'Unknown'}`)
            console.log(`  Confidence: ${Math.round((result.response.metadata.confidence || 0) * 100)}%`)
            if (result.response.metadata.toolsUsed) {
              console.log(`  Tools: ${result.response.metadata.toolsUsed.join(', ')}`)
            }
          }
        } catch (error) {
          console.log('Error:', error.message)
        }
      }

      rl.prompt()
    })

  } else {
    console.error('STARTUP FAILED')
    console.error('Error:', startupResult.message)
    if (startupResult.details) {
      console.error('Details:', JSON.stringify(startupResult.details, null, 2))
    }
    process.exit(1)
  }
}).catch(error => {
  console.error('FATAL ERROR:', error.message)
  process.exit(1)
})
