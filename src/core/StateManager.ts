import { createLogger } from '@/utils/logger.js'
import type { StressGPT7Config } from '@/types/config.js'
import type { Message } from '@/types/message.js'

export interface AppState {
  messages: Message[]
  currentDirectory: string
  activeTools: string[]
  userPreferences: {
    theme: 'light' | 'dark' | 'auto'
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }
  session: {
    id: string
    startTime: Date
    lastActivity: Date
  }
}

export class StateManager {
  private logger = createLogger('StateManager')
  private config: StressGPT7Config
  private state: AppState

  constructor(config: StressGPT7Config) {
    this.config = config
    this.state = this.getInitialState()
  }

  private getInitialState(): AppState {
    return {
      messages: [],
      currentDirectory: process.cwd(),
      activeTools: [],
      userPreferences: {
        theme: this.config.ui.theme,
        logLevel: this.config.system.logLevel,
      },
      session: {
        id: this.generateSessionId(),
        startTime: new Date(),
        lastActivity: new Date(),
      },
    }
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing StateManager...')
    
    try {
      // Load any persisted state if needed
      await this.loadPersistedState()
      this.logger.info('StateManager initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize StateManager:', error)
      throw error
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down StateManager...')
    
    try {
      // Persist state if needed
      await this.persistState()
      this.logger.info('StateManager shutdown complete')
    } catch (error) {
      this.logger.error('Error during StateManager shutdown:', error)
    }
  }

  getState(): AppState {
    return { ...this.state }
  }

  updateState(updates: Partial<AppState>): void {
    this.state = { ...this.state, ...updates }
    this.state.session.lastActivity = new Date()
  }

  addMessage(message: Message): void {
    this.state.messages.push(message)
    this.state.session.lastActivity = new Date()
  }

  getMessages(): Message[] {
    return [...this.state.messages]
  }

  clearMessages(): void {
    this.state.messages = []
    this.state.session.lastActivity = new Date()
  }

  setActiveTools(tools: string[]): void {
    this.state.activeTools = tools
    this.state.session.lastActivity = new Date()
  }

  getActiveTools(): string[] {
    return [...this.state.activeTools]
  }

  setCurrentDirectory(directory: string): void {
    this.state.currentDirectory = directory
    this.state.session.lastActivity = new Date()
  }

  getCurrentDirectory(): string {
    return this.state.currentDirectory
  }

  updateUserPreferences(preferences: Partial<AppState['userPreferences']>): void {
    this.state.userPreferences = { ...this.state.userPreferences, ...preferences }
    this.state.session.lastActivity = new Date()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async loadPersistedState(): Promise<void> {
    // Implementation for loading persisted state
    // This could load from a file, database, etc.
  }

  private async persistState(): Promise<void> {
    // Implementation for persisting state
    // This could save to a file, database, etc.
  }
}
