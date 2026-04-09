#!/usr/bin/env node

// Simple StressGPT7 with Local AI Engine - No complex imports
import { createLogger } from './utils/logger.js'
import { LocalAIEngine } from './core/LocalAIEngine.js'

const logger = createLogger('StressGPT7')

class SimpleStressGPT7 {
  private aiEngine: LocalAIEngine
  private isRunning = false

  constructor() {
    // Create a simple config
    const config = {
      api: {
        localAI: {
          model: 'stressgpt7-local',
          maxTokens: 8192,
          temperature: 0.1,
          reasoningDepth: 3
        }
      },
      system: {
        logLevel: 'info' as const,
        enableTelemetry: false,
        enablePlugins: false,
        enableSkills: false,
        enableMCP: false
      },
      ui: {
        theme: 'auto' as const,
        fontSize: 14,
        fontFamily: 'system-ui',
        enableColors: true,
        enableProgress: true
      },
      performance: {
        maxConcurrentTools: 5,
        timeoutMs: 30000
      },
      security: {
        enableSandbox: false,
        maxFileSize: 10485760
      }
    }

    // Create a simple state manager
    const stateManager = {
      messages: [],
      currentDirectory: process.cwd(),
      activeTools: [],
      userPreferences: {},
      addMessage: (message: any) => {
        stateManager.messages.push(message)
        logger.info('Message added:', message.type)
      },
      getMessages: () => stateManager.messages,
      clearMessages: () => {
        stateManager.messages = []
      }
    }

    // Create a simple tool manager
    const toolManager = {
      tools: new Map(),
      availableTools: ['FileSystemTool', 'BashTool', 'WebSearchTool', 'CodeAnalysisTool'],
      getAvailableTools: () => Promise.resolve(toolManager.availableTools),
      executeTool: async (toolName: string, params: any) => {
        logger.info(`Executing tool: ${toolName}`, params)
        return { success: true, result: `Tool ${toolName} executed with params: ${JSON.stringify(params)}` }
      },
      hasTool: (toolName: string) => toolManager.availableTools.includes(toolName)
    }

    this.aiEngine = new LocalAIEngine(config, stateManager as any, toolManager as any)
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('StressGPT7 is already running')
      return
    }

    this.isRunning = true
    logger.info('Starting StressGPT7 with Local AI Engine...')
    
    console.log('\n' + '='.repeat(60))
    console.log('  STRESSGPT7 - LOCAL AI ENGINE')
    console.log('  Advanced Software Engineering Assistant')
    console.log('  Powered by Local AI (No External Dependencies)')
    console.log('='.repeat(60) + '\n')

    this.showWelcome()
    await this.startInteractiveMode()
  }

  private showWelcome(): void {
    console.log('Welcome to StressGPT7! I can help you with:')
    console.log('  - Full-stack web development (React, Node.js, etc.)')
    console.log('  - Mobile app development (React Native, etc.)')
    console.log('  - API design and implementation')
    console.log('  - Database design and optimization')
    console.log('  - Security implementation')
    console.log('  - System architecture design')
    console.log('  - Code analysis and optimization')
    console.log('  - And much more!')
    console.log('\nType your request below, or type "help" for commands.')
    console.log('Type "exit" to quit.\n')
  }

  private async startInteractiveMode(): Promise<void> {
    const readline = await import('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const askQuestion = (query: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(query, (answer) => {
          resolve(answer)
        })
      })
    }

    while (this.isRunning) {
      try {
        const input = await askQuestion('StressGPT7> ')
        
        if (!input.trim()) continue
        
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
          break
        }

        if (input.toLowerCase() === 'help') {
          this.showHelp()
          continue
        }

        if (input.toLowerCase() === 'status') {
          this.showStatus()
          continue
        }

        if (input.toLowerCase() === 'clear') {
          console.clear()
          this.showWelcome()
          continue
        }

        // Process the query with Local AI Engine
        console.log('\nProcessing your request...')
        const response = await this.aiEngine.processQuery(input)
        
        console.log('\n' + '='.repeat(60))
        console.log('RESPONSE:')
        console.log('='.repeat(60))
        console.log(response.content)
        
        if (response.reasoning) {
          console.log('\n--- Reasoning ---')
          console.log(response.reasoning)
        }
        
        console.log(`\nConfidence: ${(response.confidence * 100).toFixed(1)}%`)
        if (response.tools_used && response.tools_used.length > 0) {
          console.log(`Tools used: ${response.tools_used.join(', ')}`)
        }
        console.log('='.repeat(60) + '\n')

      } catch (error) {
        logger.error('Error processing request:', error)
        console.log(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.log('Please try again or type "help" for assistance.\n')
      }
    }

    rl.close()
    await this.shutdown()
  }

  private showHelp(): void {
    console.log('\nAvailable Commands:')
    console.log('  help     - Show this help message')
    console.log('  status   - Show system status')
    console.log('  clear    - Clear the screen')
    console.log('  exit     - Exit StressGPT7')
    console.log('\nExample Requests:')
    console.log('  "Create a React todo app with TypeScript"')
    console.log('  "Build a REST API for user management"')
    console.log('  "Design a database schema for an e-commerce site"')
    console.log('  "Implement JWT authentication in Node.js"')
    console.log('  "Create a Python Flask application with PostgreSQL"')
    console.log('')
  }

  private showStatus(): void {
    console.log('\nStressGPT7 Status:')
    console.log('  - AI Engine: Local (StressGPT7)')
    console.log('  - Status: Running')
    console.log('  - Available Tools: 4 (FileSystem, Bash, WebSearch, CodeAnalysis)')
    console.log('  - Knowledge Base: Loaded')
    console.log('  - Reasoning Depth: 3 levels')
    console.log('')
  }

  async shutdown(): Promise<void> {
    this.isRunning = false
    logger.info('StressGPT7 shutting down...')
    console.log('\nThank you for using StressGPT7!')
    console.log('Goodbye!\n')
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nReceived SIGINT. Shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n\nReceived SIGTERM. Shutting down gracefully...')
  process.exit(0)
})

// Start the application
async function main(): Promise<void> {
  try {
    const stressGPT7 = new SimpleStressGPT7()
    await stressGPT7.start()
  } catch (error) {
    logger.error('Failed to start StressGPT7:', error)
    console.error('Failed to start StressGPT7:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

// Run the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
