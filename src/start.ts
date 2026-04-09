/**
 * Complete Startup and Verification System for StressGPT7
 * Production-ready with comprehensive validation
 */

import StressGPT7Server from './api/server.js'
import AIEngine from './core/AIEngine.js'
import CodeExecutor from './tools/CodeExecutor.js'
import StressTest from './testing/StressTest.js'

interface ValidationResult {
  success: boolean
  message: string
  details?: any
}

export class StressGPT7App {
  private server: StressGPT7Server
  private aiEngine: AIEngine
  private codeExecutor: CodeExecutor
  private stressTest: StressTest
  private isRunning = false

  constructor(port = 3000) {
    this.server = new StressGPT7Server(port)
    this.aiEngine = new AIEngine()
    this.codeExecutor = new CodeExecutor()
    this.stressTest = new StressTest()
  }

  async startup(): Promise<ValidationResult> {
    console.log('=== StressGPT7 Startup Sequence ===')
    console.log('Initializing all components...\n')

    try {
      // Step 1: Initialize core components
      const initResult = await this.initializeComponents()
      if (!initResult.success) {
        return initResult
      }

      // Step 2: Run quick validation
      const validationResult = await this.runQuickValidation()
      if (!validationResult.success) {
        return validationResult
      }

      // Step 3: Start server
      const serverResult = await this.startServer()
      if (!serverResult.success) {
        return serverResult
      }

      // Step 4: Verify API endpoints
      const apiResult = await this.verifyAPI()
      if (!apiResult.success) {
        return apiResult
      }

      // Step 5: Final system check
      const finalCheck = await this.finalSystemCheck()
      if (!finalCheck.success) {
        return finalCheck
      }

      this.isRunning = true

      return {
        success: true,
        message: 'StressGPT7 started successfully and is ready for use!',
        details: {
          port: 3000,
          url: 'http://localhost:3000',
          gui: 'http://localhost:3000/app.html',
          api: 'http://localhost:3000/api',
          status: 'All systems operational'
        }
      }

    } catch (error) {
      return {
        success: false,
        message: `Startup failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error }
      }
    }
  }

  async shutdown(): Promise<void> {
    console.log('\n=== StressGPT7 Shutdown Sequence ===')

    try {
      if (this.isRunning) {
        await this.server.stop()
        await this.codeExecutor.dispose()
        this.isRunning = false
        console.log('StressGPT7 shutdown complete')
      }
    } catch (error) {
      console.error('Error during shutdown:', error)
    }
  }

  private async initializeComponents(): Promise<ValidationResult> {
    console.log('Initializing components...')

    try {
      // Initialize code executor
      await this.codeExecutor.initialize()
      console.log('  Code Executor: Initialized')

      // Test AI engine
      const testResponse = await this.aiEngine.processPrompt('hello')
      if (testResponse.type === 'error') {
        throw new Error('AI engine failed basic test')
      }
      console.log('  AI Engine: Initialized')

      // Test code executor
      const execResult = await this.codeExecutor.execute({
        code: 'print("Component test successful")',
        language: 'python'
      })
      if (!execResult.success) {
        throw new Error('Code executor failed basic test')
      }
      console.log('  Code Executor: Verified')

      return {
        success: true,
        message: 'All components initialized successfully'
      }

    } catch (error) {
      return {
        success: false,
        message: `Component initialization failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  private async runQuickValidation(): Promise<ValidationResult> {
    console.log('Running quick validation...')

    try {
      // Test basic AI functionality
      const aiResponse = await this.aiEngine.processPrompt('What is 2+2?')
      if (aiResponse.type === 'error') {
        throw new Error('AI engine validation failed')
      }

      // Test code generation
      const codeResponse = await this.aiEngine.processPrompt('Write a Python function that adds two numbers')
      if (codeResponse.type !== 'code') {
        throw new Error('Code generation validation failed')
      }

      // Test code execution
      const execResult = await this.codeExecutor.execute({
        code: 'def add(a, b): return a + b\nprint(add(2, 3))',
        language: 'python'
      })
      if (!execResult.success || !execResult.output.includes('5')) {
        throw new Error('Code execution validation failed')
      }

      // Test multiple languages
      const languages = ['python', 'javascript', 'java', 'c', 'cpp']
      for (const lang of languages) {
        const testCode = this.getTestCode(lang)
        const result = await this.codeExecutor.execute({
          code: testCode,
          language: lang as any
        })
        if (!result.success) {
          throw new Error(`Language validation failed for ${lang}`)
        }
      }

      console.log('  Quick validation: PASSED')
      return {
        success: true,
        message: 'Quick validation passed'
      }

    } catch (error) {
      return {
        success: false,
        message: `Quick validation failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  private async startServer(): Promise<ValidationResult> {
    console.log('Starting server...')

    try {
      await this.server.start()
      console.log('  Server: Started on port 3000')

      return {
        success: true,
        message: 'Server started successfully'
      }

    } catch (error) {
      return {
        success: false,
        message: `Server startup failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  private async verifyAPI(): Promise<ValidationResult> {
    console.log('Verifying API endpoints...')

    try {
      // Test health endpoint
      const healthResponse = await fetch('http://localhost:3000/api/health')
      if (!healthResponse.ok) {
        throw new Error('Health endpoint failed')
      }
      const health = await healthResponse.json()
      if (health.status !== 'healthy') {
        throw new Error('System not healthy')
      }

      // Test chat endpoint
      const chatResponse = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello' })
      })
      if (!chatResponse.ok) {
        throw new Error('Chat endpoint failed')
      }
      const chat = await chatResponse.json()
      if (!chat.response) {
        throw new Error('Chat endpoint returned invalid response')
      }

      // Test code generation endpoint
      const codeResponse = await fetch('http://localhost:3000/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: 'Write a hello world program',
          language: 'python'
        })
      })
      if (!codeResponse.ok) {
        throw new Error('Code generation endpoint failed')
      }
      const code = await codeResponse.json()
      if (!code.success) {
        throw new Error('Code generation endpoint failed to generate code')
      }

      // Test languages endpoint
      const langResponse = await fetch('http://localhost:3000/api/languages')
      if (!langResponse.ok) {
        throw new Error('Languages endpoint failed')
      }
      const languages = await langResponse.json()
      if (!Array.isArray(languages) || languages.length === 0) {
        throw new Error('Languages endpoint returned invalid data')
      }

      console.log('  API endpoints: VERIFIED')
      return {
        success: true,
        message: 'All API endpoints verified'
      }

    } catch (error) {
      return {
        success: false,
        message: `API verification failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  private async finalSystemCheck(): Promise<ValidationResult> {
    console.log('Running final system check...')

    try {
      // Test complex request
      const complexResponse = await this.aiEngine.processPrompt('Create a Python web server with Flask that has two endpoints: /hello and /time')
      if (complexResponse.type === 'error') {
        throw new Error('Complex request test failed')
      }

      // Test code execution with output
      const execResult = await this.codeExecutor.execute({
        code: 'import datetime\nprint(f"Current time: {datetime.datetime.now()}")',
        language: 'python'
      })
      if (!execResult.success) {
        throw new Error('Complex code execution test failed')
      }

      // Test concurrent requests
      const promises = Array.from({ length: 3 }, (_, i) => 
        fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Concurrent test ${i + 1}` })
        })
      )
      
      const results = await Promise.all(promises)
      if (results.some(r => !r.ok)) {
        throw new Error('Concurrent requests test failed')
      }

      console.log('  Final system check: PASSED')
      return {
        success: true,
        message: 'Final system check passed'
      }

    } catch (error) {
      return {
        success: false,
        message: `Final system check failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  private getTestCode(language: string): string {
    const testCodes = {
      python: 'print("Hello, Python!")',
      javascript: 'console.log("Hello, JavaScript!");',
      java: 'public class Main { public static void main(String[] args) { System.out.println("Hello, Java!"); } }',
      c: '#include <stdio.h>\nint main() { printf("Hello, C!\\n"); return 0; }',
      cpp: '#include <iostream>\nint main() { std::cout << "Hello, C++!" << std::endl; return 0; }'
    }
    return testCodes[language] || '// Test code not available'
  }

  async runStressTest(): Promise<ValidationResult> {
    console.log('Running comprehensive stress test...')

    try {
      const report = await this.stressTest.runAllTests()
      
      const successRate = (report.passedTests / report.totalTests) * 100
      
      if (successRate >= 90) {
        return {
          success: true,
          message: `Stress test passed with ${successRate.toFixed(1)}% success rate`,
          details: report
        }
      } else {
        return {
          success: false,
          message: `Stress test failed with only ${successRate.toFixed(1)}% success rate`,
          details: report
        }
      }

    } catch (error) {
      return {
        success: false,
        message: `Stress test failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  async getStatus(): Promise<ValidationResult> {
    try {
      const health = await fetch('http://localhost:3000/api/health')
      const healthData = await health.json()
      
      const stats = await fetch('http://localhost:3000/api/stats')
      const statsData = await stats.json()

      return {
        success: true,
        message: 'System is running',
        details: {
          health: healthData,
          stats: statsData,
          uptime: healthData.uptime,
          status: 'operational'
        }
      }

    } catch (error) {
      return {
        success: false,
        message: 'System is not accessible',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
}

// Main execution function
async function main() {
  const app = new StressGPT7App()

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...')
    await app.shutdown()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...')
    await app.shutdown()
    process.exit(0)
  })

  // Check command line arguments
  const args = process.argv.slice(2)
  
  if (args.includes('--test')) {
    console.log('Running stress test only...')
    const testResult = await app.runStressTest()
    if (testResult.success) {
      console.log('Stress test completed successfully')
    } else {
      console.error('Stress test failed:', testResult.message)
      process.exit(1)
    }
    return
  }

  if (args.includes('--status')) {
    const status = await app.getStatus()
    console.log('System Status:', status.message)
    if (status.details) {
      console.log(JSON.stringify(status.details, null, 2))
    }
    return
  }

  // Normal startup
  const startupResult = await app.startup()
  
  if (startupResult.success) {
    console.log('\n' + '='.repeat(60))
    console.log('STRESSGPT7 STARTUP SUCCESSFUL')
    console.log('='.repeat(60))
    console.log(startupResult.message)
    console.log('')
    console.log('Access URLs:')
    console.log(`  GUI: ${startupResult.details.gui}`)
    console.log(`  API: ${startupResult.details.api}`)
    console.log(`  Health: ${startupResult.details.api}/health`)
    console.log(`  Docs: ${startupResult.details.api}/docs`)
    console.log('')
    console.log('The system is ready for use!')
    console.log('Press Ctrl+C to shutdown')
    console.log('='.repeat(60))
    
    // Keep the process running
    console.log('\nSystem is running. Type "hello" to test the AI assistant:')
    
    // Simple interactive test
    const readline = await import('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.setPrompt('StressGPT7> ')
    rl.prompt()

    rl.on('line', async (input) => {
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        rl.close()
        await app.shutdown()
        process.exit(0)
      }

      if (input.toLowerCase() === 'status') {
        const status = await app.getStatus()
        console.log('Status:', status.message)
        rl.prompt()
        return
      }

      if (input.toLowerCase() === 'test') {
        const testResult = await app.runStressTest()
        console.log('Test Result:', testResult.message)
        rl.prompt()
        return
      }

      if (input.trim()) {
        try {
          const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: input })
          })
          
          const result = await response.json()
          console.log('Assistant:', result.response.content)
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
}

// Run the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export default StressGPT7App
