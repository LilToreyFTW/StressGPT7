import { createLogger } from '@/utils/logger.js'
import type { StressGPT7Config } from '@/types/config.js'
import type { StateManager } from '@/core/StateManager.js'
import type { Tool, ToolResult } from '@/types/tool.js'
import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'

export class FileSystemTool implements Tool {
  name = 'file_system'
  private logger = createLogger('FileSystemTool')
  private config: StressGPT7Config
  private stateManager: StateManager

  constructor(config: StressGPT7Config, stateManager: StateManager) {
    this.config = config
    this.stateManager = stateManager
  }

  get description(): string {
    return 'File system operations: read, write, list, and analyze files and directories'
  }

  isEnabled(): boolean {
    return true // Always enabled for basic functionality
  }

  getInputSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['read', 'write', 'list', 'stat', 'create_dir', 'delete'],
          description: 'The action to perform'
        },
        path: {
          type: 'string',
          description: 'File or directory path'
        },
        content: {
          type: 'string',
          description: 'Content to write (for write action)'
        },
        encoding: {
          type: 'string',
          enum: ['utf8', 'base64'],
          default: 'utf8',
          description: 'File encoding'
        }
      },
      required: ['action', 'path']
    }
  }

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const { action, path, content, encoding = 'utf8' } = input as {
      action: string
      path: string
      content?: string
      encoding?: string
    }

    if (!action || !path) {
      return {
        success: false,
        error: 'Missing required parameters: action and path'
      }
    }

    try {
      const resolvedPath = resolve(this.stateManager.getCurrentDirectory(), path)

      // Security check
      if (!this.isPathSafe(resolvedPath)) {
        return {
          success: false,
          error: 'Path access denied for security reasons'
        }
      }

      switch (action) {
        case 'read':
          return await this.readFile(resolvedPath, encoding as BufferEncoding)
        case 'write':
          if (!content) {
            return { success: false, error: 'Content is required for write action' }
          }
          return await this.writeFile(resolvedPath, content, encoding as BufferEncoding)
        case 'list':
          return await this.listDirectory(resolvedPath)
        case 'stat':
          return await this.getStat(resolvedPath)
        default:
          return {
            success: false,
            error: `Unsupported action: ${action}`
          }
      }
    } catch (error) {
      this.logger.error('File system operation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private async readFile(path: string, encoding: BufferEncoding): Promise<ToolResult> {
    const content = await readFile(path, encoding)
    return {
      success: true,
      data: { content, encoding, path }
    }
  }

  private async writeFile(path: string, content: string, encoding: BufferEncoding): Promise<ToolResult> {
    await writeFile(path, content, encoding)
    return {
      success: true,
      data: { message: 'File written successfully', path, bytesWritten: Buffer.byteLength(content, encoding) }
    }
  }

  private async listDirectory(path: string): Promise<ToolResult> {
    const entries = await readdir(path, { withFileTypes: true })
    const items = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      path: join(path, entry.name)
    }))
    return {
      success: true,
      data: { items, path }
    }
  }

  private async getStat(path: string): Promise<ToolResult> {
    const stats = await stat(path)
    return {
      success: true,
      data: {
        path,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime
      }
    }
  }

  private isPathSafe(path: string): boolean {
    // Basic security check - prevent access to system directories
    const dangerousPaths = [
      '/etc',
      '/usr/bin',
      '/usr/sbin',
      '/bin',
      '/sbin',
      'C:\\Windows',
      'C:\\Program Files',
      'C:\\Program Files (x86)'
    ]

    const normalizedPath = path.toLowerCase()
    return !dangerousPaths.some(dangerous => normalizedPath.startsWith(dangerous.toLowerCase()))
  }
}
