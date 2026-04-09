import { createLogger } from '@/utils/logger.js'
import type { StressGPT7Config } from '@/types/config.js'
import type { StateManager } from './StateManager.js'
import type { Command, CommandResult } from '@/types/command.js'

export class CommandManager {
  private logger = createLogger('CommandManager')
  private config: StressGPT7Config
  private stateManager: StateManager
  private commands: Map<string, Command> = new Map()

  constructor(config: StressGPT7Config, stateManager: StateManager) {
    this.config = config
    this.stateManager = stateManager
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing CommandManager...')
    
    try {
      await this.registerBuiltInCommands()
      this.logger.info(`CommandManager initialized with ${this.commands.size} commands`)
    } catch (error) {
      this.logger.error('Failed to initialize CommandManager:', error)
      throw error
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down CommandManager...')
    this.commands.clear()
    this.logger.info('CommandManager shutdown complete')
  }

  private async registerBuiltInCommands(): Promise<void> {
    const builtInCommands = [
      {
        name: 'help',
        description: 'Show available commands and help information',
        execute: async () => this.showHelp()
      },
      {
        name: 'clear',
        description: 'Clear the conversation history',
        execute: async () => this.clearHistory()
      },
      {
        name: 'status',
        description: 'Show current system status',
        execute: async () => this.showStatus()
      },
      {
        name: 'config',
        description: 'Show or update configuration',
        execute: async (args: string[]) => this.handleConfig(args)
      }
    ]

    for (const command of builtInCommands) {
      this.commands.set(command.name, command)
    }
  }

  async executeCommand(input: string): Promise<CommandResult> {
    const [commandName, ...args] = input.slice(1).split(' ') // Remove the leading '/'
    const command = this.commands.get(commandName)

    if (!command) {
      return {
        success: false,
        error: `Unknown command: ${commandName}. Type /help for available commands.`
      }
    }

    try {
      this.logger.info(`Executing command: ${commandName}`)
      const result = await command.execute(args)
      this.logger.debug(`Command ${commandName} executed successfully`)
      return result
    } catch (error) {
      this.logger.error(`Command ${commandName} execution failed:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private async showHelp(): Promise<CommandResult> {
    const commandList = Array.from(this.commands.values())
      .map(cmd => `  /${cmd.name.padEnd(12)} ${cmd.description}`)
      .join('\n')

    const helpText = `StressGPT7 Commands:

${commandList}

Type /command --help for specific command help.`

    return {
      success: true,
      data: { message: helpText }
    }
  }

  private async clearHistory(): Promise<CommandResult> {
    this.stateManager.clearMessages()
    return {
      success: true,
      data: { message: 'Conversation history cleared.' }
    }
  }

  private async showStatus(): Promise<CommandResult> {
    const state = this.stateManager.getState()
    const status = `
StressGPT7 Status:
- Session ID: ${state.session.id}
- Messages: ${state.messages.length}
- Current Directory: ${state.currentDirectory}
- Active Tools: ${state.activeTools.length}
- Theme: ${state.userPreferences.theme}
- Log Level: ${state.userPreferences.logLevel}
- Session Started: ${state.session.startTime.toISOString()}
- Last Activity: ${state.session.lastActivity.toISOString()}
`.trim()

    return {
      success: true,
      data: { message: status }
    }
  }

  private async handleConfig(args: string[]): Promise<CommandResult> {
    if (args.length === 0) {
      return {
        success: true,
        data: { 
          message: 'Current configuration:\n' + JSON.stringify(this.config, null, 2)
        }
      }
    }

    // Handle config updates
    return {
      success: false,
      error: 'Config updates not yet implemented'
    }
  }

  registerCommand(command: Command): void {
    this.commands.set(command.name, command)
    this.logger.info(`Registered command: ${command.name}`)
  }

  getCommands(): Command[] {
    return Array.from(this.commands.values())
  }
}
