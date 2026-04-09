import { createLogger } from '@/utils/logger.js'
import type { StressGPT7Config } from '@/types/config.js'
import type { StateManager } from '@/core/StateManager.js'
import type { Tool, ToolResult } from '@/types/tool.js'
import { spawn } from 'node:child_process'

export class BashTool implements Tool {
  name = 'bash'
  private logger = createLogger('BashTool')
  private config: StressGPT7Config
  private stateManager: StateManager

  constructor(config: StressGPT7Config, stateManager: StateManager) {
    this.config = config
    this.stateManager = stateManager
  }

  get description(): string {
    return 'Execute bash commands and shell scripts'
  }

  isEnabled(): boolean {
    return this.config.security.enableSandbox
  }

  getInputSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The bash command to execute'
        },
        cwd: {
          type: 'string',
          description: 'Working directory for command execution'
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds',
          default: 30000
        }
      },
      required: ['command']
    }
  }

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const { command, cwd, timeout = this.config.performance.timeoutMs } = input as {
      command: string
      cwd?: string
      timeout?: number
    }

    if (!command) {
      return {
        success: false,
        error: 'Missing required parameter: command'
      }
    }

    // Security check
    if (!this.isCommandSafe(command)) {
      return {
        success: false,
        error: 'Command blocked for security reasons'
      }
    }

    try {
      const result = await this.executeCommand(command, cwd, timeout)
      return {
        success: true,
        data: result
      }
    } catch (error) {
      this.logger.error('Bash command execution failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private async executeCommand(command: string, cwd?: string, timeout?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const workingDir = cwd || this.stateManager.getCurrentDirectory()
      
      this.logger.info(`Executing command: ${command} in ${workingDir}`)
      
      const child = spawn('bash', ['-c', command], {
        cwd: workingDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PATH: process.env.PATH }
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      const timeoutId = timeout ? setTimeout(() => {
        child.kill('SIGKILL')
        reject(new Error(`Command timed out after ${timeout}ms`))
      }, timeout) : undefined

      child.on('close', (code, signal) => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        const duration = Date.now() - startTime
        
        resolve({
          command,
          cwd: workingDir,
          exitCode: code,
          signal,
          stdout,
          stderr,
          duration
        })
      })

      child.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        reject(error)
      })
    })
  }

  private isCommandSafe(command: string): boolean {
    const dangerousCommands = [
      'rm -rf /',
      'sudo rm',
      'format',
      'fdisk',
      'mkfs',
      'dd if=',
      'shutdown',
      'reboot',
      'halt',
      'poweroff',
      'passwd',
      'su',
      'sudo su',
      'chmod 777 /',
      'chown root',
      'crontab',
      'systemctl',
      'service'
    ]

    const lowerCommand = command.toLowerCase()
    return !dangerousCommands.some(dangerous => lowerCommand.includes(dangerous))
  }
}
