/**
 * Complete Stress Testing and Validation System for StressGPT7
 * Production-ready with comprehensive testing
 */

import AIEngine from '../core/AIEngine.js'
import CodeExecutor from '../tools/CodeExecutor.js'
import StressGPT7Server from '../api/server.js'

export interface TestResult {
  testName: string
  passed: boolean
  duration: number
  error?: string
  details?: any
}

export interface StressTestReport {
  totalTests: number
  passedTests: number
  failedTests: number
  averageDuration: number
  totalDuration: number
  results: TestResult[]
  summary: string
}

export class StressTest {
  private aiEngine: AIEngine
  private codeExecutor: CodeExecutor
  private server: StressGPT7Server
  private testResults: TestResult[] = []

  constructor() {
    this.aiEngine = new AIEngine()
    this.codeExecutor = new CodeExecutor()
    this.server = new StressGPT7Server(3001) // Use different port for testing
  }

  async runAllTests(): Promise<StressTestReport> {
    console.log('=== StressGPT7 Stress Testing Suite ===')
    console.log('Starting comprehensive testing...\n')

    const startTime = Date.now()
    this.testResults = []

    try {
      // Initialize components
      await this.codeExecutor.initialize()
      await this.server.start()

      // Run test suites
      await this.runAIEngineTests()
      await this.runCodeExecutionTests()
      await this.runAPITests()
      await this.runMultiLanguageTests()
      await this.runPerformanceTests()
      await this.runErrorHandlingTests()
      await this.runConcurrencyTests()

    } catch (error) {
      this.testResults.push({
        testName: 'Test Suite Initialization',
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      // Cleanup
      await this.server.stop()
      await this.codeExecutor.dispose()
    }

    const totalDuration = Date.now() - startTime
    const passedTests = this.testResults.filter(r => r.passed).length
    const averageDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / this.testResults.length

    const report: StressTestReport = {
      totalTests: this.testResults.length,
      passedTests,
      failedTests: this.testResults.length - passedTests,
      averageDuration,
      totalDuration,
      results: this.testResults,
      summary: this.generateSummary()
    }

    this.printReport(report)
    return report
  }

  private async runAIEngineTests(): Promise<void> {
    console.log('Testing AI Engine...')

    const tests = [
      {
        name: 'Basic Chat Response',
        test: () => this.aiEngine.processPrompt('hello')
      },
      {
        name: 'Code Generation - Python',
        test: () => this.aiEngine.processPrompt('Write a Python hello world program')
      },
      {
        name: 'Code Generation - Java',
        test: () => this.aiEngine.processPrompt('Create a Java class for a Person')
      },
      {
        name: 'Code Generation - C++',
        test: () => this.aiEngine.processPrompt('Write a C++ function for addition')
      },
      {
        name: 'Code Analysis Request',
        test: () => this.aiEngine.processPrompt('Analyze this Python code: print("hello")')
      },
      {
        name: 'Help Request',
        test: () => this.aiEngine.processPrompt('What can you do?')
      },
      {
        name: 'Complex Task',
        test: () => this.aiEngine.processPrompt('Create a web server in Node.js with Express')
      },
      {
        name: 'Multi-language Request',
        test: () => this.aiEngine.processPrompt('Generate the same function in Python and Java')
      }
    ]

    for (const test of tests) {
      await this.runTest(test.name, test.test)
    }
  }

  private async runCodeExecutionTests(): Promise<void> {
    console.log('Testing Code Execution...')

    const testCases = [
      {
        name: 'Python Execution',
        code: 'print("Hello, Python!")',
        language: 'python' as const
      },
      {
        name: 'JavaScript Execution',
        code: 'console.log("Hello, JavaScript!");',
        language: 'javascript' as const
      },
      {
        name: 'Python Function',
        code: 'def add(a, b): return a + b\nprint(add(5, 3))',
        language: 'python' as const
      },
      {
        name: 'JavaScript Function',
        code: 'function add(a, b) { return a + b; }\nconsole.log(add(5, 3));',
        language: 'javascript' as const
      },
      {
        name: 'Python with Input',
        code: 'name = input("Enter your name: ")\nprint(f"Hello, {name}!")',
        language: 'python' as const,
        input: 'StressGPT7'
      },
      {
        name: 'Error Handling',
        code: 'try:\n    print(1/0)\nexcept ZeroDivisionError:\n    print("Error caught")',
        language: 'python' as const
      }
    ]

    for (const testCase of testCases) {
      await this.runTest(testCase.name, async () => {
        const result = await this.codeExecutor.execute({
          code: testCase.code,
          language: testCase.language,
          input: testCase.input
        })
        
        if (!result.success) {
          throw new Error(result.error || 'Execution failed')
        }
        
        return result
      })
    }
  }

  private async runAPITests(): Promise<void> {
    console.log('Testing API Endpoints...')

    const apiTests = [
      {
        name: 'Health Check',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/health')
          if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`)
          }
          return await response.json()
        }
      },
      {
        name: 'Chat Endpoint',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'hello' })
          })
          if (!response.ok) {
            throw new Error(`Chat endpoint failed: ${response.status}`)
          }
          return await response.json()
        }
      },
      {
        name: 'Code Generation Endpoint',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt: 'Write a hello world program',
              language: 'python'
            })
          })
          if (!response.ok) {
            throw new Error(`Code generation endpoint failed: ${response.status}`)
          }
          return await response.json()
        }
      },
      {
        name: 'Languages Endpoint',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/languages')
          if (!response.ok) {
            throw new Error(`Languages endpoint failed: ${response.status}`)
          }
          return await response.json()
        }
      },
      {
        name: 'Stats Endpoint',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/stats')
          if (!response.ok) {
            throw new Error(`Stats endpoint failed: ${response.status}`)
          }
          return await response.json()
        }
      }
    ]

    for (const test of apiTests) {
      await this.runTest(test.name, test.test)
    }
  }

  private async runMultiLanguageTests(): Promise<void> {
    console.log('Testing Multi-Language Support...')

    const languages = ['python', 'java', 'c', 'cpp', 'csharp', 'javascript', 'typescript', 'nodejs']
    
    for (const language of languages) {
      await this.runTest(`Language Support - ${language}`, async () => {
        const prompt = `Write a hello world program in ${language}`
        const response = await this.aiEngine.processPrompt(prompt)
        
        if (response.type !== 'code') {
          throw new Error(`Expected code response for ${language}`)
        }
        
        if (!response.content.includes('hello') && !response.content.includes('Hello')) {
          throw new Error(`Response doesn't contain hello world for ${language}`)
        }
        
        return response
      })
    }
  }

  private async runPerformanceTests(): Promise<void> {
    console.log('Testing Performance...')

    // Test response times
    await this.runTest('Response Time - Simple Query', async () => {
      const start = Date.now()
      await this.aiEngine.processPrompt('hello')
      const duration = Date.now() - start
      
      if (duration > 5000) { // 5 seconds max
        throw new Error(`Response too slow: ${duration}ms`)
      }
      
      return { duration }
    })

    // Test concurrent requests
    await this.runTest('Concurrent Requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        this.aiEngine.processPrompt(`Test message ${i + 1}`)
      )
      
      const results = await Promise.all(promises)
      
      if (results.some(r => r.type === 'error')) {
        throw new Error('Some concurrent requests failed')
      }
      
      return { concurrentRequests: results.length }
    })

    // Test memory usage
    await this.runTest('Memory Usage', async () => {
      const memBefore = process.memoryUsage().heapUsed
      
      // Generate multiple responses
      for (let i = 0; i < 10; i++) {
        await this.aiEngine.processPrompt(`Test message ${i}`)
      }
      
      const memAfter = process.memoryUsage().heapUsed
      const memIncrease = memAfter - memBefore
      
      if (memIncrease > 50 * 1024 * 1024) { // 50MB max increase
        throw new Error(`Memory usage increased too much: ${memIncrease} bytes`)
      }
      
      return { memoryIncrease: memIncrease }
    })
  }

  private async runErrorHandlingTests(): Promise<void> {
    console.log('Testing Error Handling...')

    const errorTests = [
      {
        name: 'Empty Prompt',
        test: () => this.aiEngine.processPrompt('')
      },
      {
        name: 'Invalid Language Request',
        test: () => this.aiEngine.processPrompt('Write code in invalid_language')
      },
      {
        name: 'Malformed Code Execution',
        test: () => this.codeExecutor.execute({
          code: 'invalid syntax here',
          language: 'python'
        })
      },
      {
        name: 'Timeout Test',
        test: () => this.codeExecutor.execute({
          code: 'import time; time.sleep(20)', // 20 second sleep
          language: 'python',
          timeout: 1000 // 1 second timeout
        })
      },
      {
        name: 'API Invalid Endpoint',
        test: async () => {
          try {
            const response = await fetch('http://localhost:3001/api/invalid')
            return { status: response.status }
          } catch (error) {
            return { error: error.message }
          }
        }
      }

    for (const test of errorTests) {
      await this.runTest(test.name, test.test, true) // Expect errors
    }
  }

  private async runConcurrencyTests(): Promise<void> {
    console.log('Testing Concurrency...')

    // Test multiple simultaneous AI requests
    await this.runTest('Simultaneous AI Requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        this.aiEngine.processPrompt(`Concurrent test ${i + 1}`)
      )
      
      const results = await Promise.allSettled(promises)
      const failed = results.filter(r => r.status === 'rejected')
      
      if (failed.length > 2) { // Allow some failures
        throw new Error(`Too many concurrent requests failed: ${failed.length}`)
      }
      
      return { 
        total: results.length, 
        failed: failed.length 
      }
    })

    // Test multiple code executions
    await this.runTest('Simultaneous Code Execution', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        this.codeExecutor.execute({
          code: `print("Concurrent test ${i + 1}")`,
          language: 'python'
        })
      )
      
      const results = await Promise.allSettled(promises)
      const failed = results.filter(r => r.status === 'rejected')
      
      if (failed.length > 1) { // Allow some failures
        throw new Error(`Too many concurrent executions failed: ${failed.length}`)
      }
      
      return { 
        total: results.length, 
        failed: failed.length 
      }
    })
  }

  private async runTest(name: string, test: () => Promise<any>, expectError = false): Promise<void> {
    const startTime = Date.now()
    
    try {
      const result = await test()
      const duration = Date.now() - startTime
      
      if (expectError) {
        this.testResults.push({
          testName: name,
          passed: false,
          duration,
          error: 'Expected error but test passed',
          details: result
        })
        console.log(`  ${name}: FAILED (Expected error)`)
      } else {
        this.testResults.push({
          testName: name,
          passed: true,
          duration,
          details: result
        })
        console.log(`  ${name}: PASSED (${duration}ms)`)
      }
    } catch (error) {
      const duration = Date.now() - startTime
      
      if (expectError) {
        this.testResults.push({
          testName: name,
          passed: true,
          duration,
          details: { error: error.message }
        })
        console.log(`  ${name}: PASSED (Expected error) (${duration}ms)`)
      } else {
        this.testResults.push({
          testName: name,
          passed: false,
          duration,
          error: error instanceof Error ? error.message : String(error)
        })
        console.log(`  ${name}: FAILED (${duration}ms) - ${error}`)
      }
    }
  }

  private generateSummary(): string {
    const passed = this.testResults.filter(r => r.passed).length
    const total = this.testResults.length
    const successRate = ((passed / total) * 100).toFixed(1)
    
    let summary = `Stress Test Summary:\n`
    summary += `Total Tests: ${total}\n`
    summary += `Passed: ${passed}\n`
    summary += `Failed: ${total - passed}\n`
    summary += `Success Rate: ${successRate}%\n\n`
    
    // Categorize failures
    const failures = this.testResults.filter(r => !r.passed)
    if (failures.length > 0) {
      summary += 'Failed Tests:\n'
      failures.forEach(f => {
        summary += `- ${f.testName}: ${f.error}\n`
      })
    }
    
    // Performance summary
    const avgDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / this.testResults.length
    summary += `\nPerformance:\n`
    summary += `Average Test Duration: ${avgDuration.toFixed(1)}ms\n`
    
    const slowTests = this.testResults.filter(r => r.duration > 3000).sort((a, b) => b.duration - a.duration)
    if (slowTests.length > 0) {
      summary += `Slowest Tests:\n`
      slowTests.slice(0, 3).forEach(t => {
        summary += `- ${t.testName}: ${t.duration}ms\n`
      })
    }
    
    // Overall assessment
    summary += '\nOverall Assessment: '
    const successRateNum = parseFloat(successRate)
    if (successRateNum >= 95) {
      summary += 'EXCELLENT - System is performing optimally'
    } else if (successRateNum >= 90) {
      summary += 'GOOD - System is performing well with minor issues'
    } else if (successRateNum >= 80) {
      summary += 'ACCEPTABLE - System has some issues that need attention'
    } else {
      summary += 'NEEDS IMPROVEMENT - System has significant issues'
    }
    
    return summary
  }

  private printReport(report: StressTestReport): void {
    console.log('\n' + '='.repeat(50))
    console.log('STRESS TEST REPORT')
    console.log('='.repeat(50))
    console.log(report.summary)
    console.log('='.repeat(50))
    
    // Detailed results
    console.log('\nDetailed Results:')
    report.results.forEach(result => {
      const status = result.passed ? 'PASS' : 'FAIL'
      console.log(`  [${status}] ${result.testName} (${result.duration}ms)`)
      if (!result.passed && result.error) {
        console.log(`    Error: ${result.error}`)
      }
    })
    
    console.log('\n' + '='.repeat(50))
  }

  // Quick validation method for startup
  async quickValidation(): Promise<boolean> {
    console.log('Running quick validation...')
    
    try {
      // Test basic AI functionality
      const aiResponse = await this.aiEngine.processPrompt('hello')
      if (aiResponse.type === 'error') {
        throw new Error('AI engine failed basic test')
      }
      
      // Test code execution
      const execResult = await this.codeExecutor.execute({
        code: 'print("validation test")',
        language: 'python'
      })
      if (!execResult.success) {
        throw new Error('Code executor failed basic test')
      }
      
      console.log('Quick validation PASSED')
      return true
      
    } catch (error) {
      console.log(`Quick validation FAILED: ${error}`)
      return false
    }
  }
}

export default StressTest
