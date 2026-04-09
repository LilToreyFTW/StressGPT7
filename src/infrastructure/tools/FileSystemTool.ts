/**
 * Enhanced File System Tool for StressGPT7
 * Provides comprehensive file system operations with security and validation
 */

import { Result } from '../../core/types/Result.js'
import { BaseTool } from '../../core/interfaces/ITool.js'
import type { ToolContext, ToolResult } from '../../core/interfaces/ITool.js'
import { readFile, writeFile, readdir, stat, mkdir, rm, copyFile } from 'node:fs/promises'
import { join, resolve, dirname, extname, basename } from 'node:path'
import { createHash } from 'node:crypto'

/**
 * File system operation types
 */
export type FileSystemOperation = 
  | 'read'
  | 'write'
  | 'list'
  | 'delete'
  | 'create'
  | 'copy'
  | 'move'
  | 'exists'
  | 'info'

/**
 * File system operation input
 */
export interface FileSystemInput {
  /** Operation type */
  readonly operation: FileSystemOperation
  /** File or directory path */
  readonly path: string
  /** Target path (for copy/move operations) */
  readonly target?: string
  /** File content (for write operations) */
  readonly content?: string
  /** Directory creation options */
  readonly options?: {
    readonly recursive?: boolean
    readonly encoding?: BufferEncoding
    readonly overwrite?: boolean
    readonly maxFileSize?: number
  }
}

/**
 * File system operation result
 */
export interface FileSystemOutput {
  /** Operation result */
  readonly success: boolean
  /** File content (for read operations) */
  readonly content?: string
  /** Directory listing (for list operations) */
  readonly listing?: Array<{
    readonly name: string
    readonly path: string
    readonly type: 'file' | 'directory'
    readonly size: number
    readonly modified: Date
  }>
  /** File information (for info operations) */
  readonly info?: {
    readonly name: string
    readonly path: string
    readonly type: 'file' | 'directory'
    readonly size: number
    readonly created: Date
    readonly modified: Date
    readonly accessed: Date
    readonly permissions: string
    readonly hash?: string
  }
  /** Operation metadata */
  readonly metadata: {
    readonly operation: FileSystemOperation
    readonly path: string
    readonly duration: number
    readonly bytesProcessed?: number
  }
}

/**
 * Enhanced File System Tool implementation
 */
export class FileSystemTool extends BaseTool<FileSystemInput, FileSystemOutput> {
  public readonly name = 'file_system'
  public readonly description = 'Advanced file system operations with security and validation'
  public readonly version = '2.0.0'
  public readonly author = 'StressGPT7 Team'
  public readonly tags = ['file', 'system', 'io', 'storage']
  
  public readonly capabilities = {
    supportsAsync: true,
    requiresNetwork: false,
    requiresFileSystem: true,
    isSandboxSafe: false,
    maxTimeout: 30000
  }

  public readonly schema = {
    input: {
      type: 'object' as const,
      properties: {
        operation: {
          type: 'string',
          enum: ['read', 'write', 'list', 'delete', 'create', 'copy', 'move', 'exists', 'info'],
          description: 'The file system operation to perform'
        },
        path: {
          type: 'string',
          description: 'The file or directory path'
        },
        target: {
          type: 'string',
          description: 'Target path for copy/move operations'
        },
        content: {
          type: 'string',
          description: 'File content for write operations'
        },
        options: {
          type: 'object',
          properties: {
            recursive: { type: 'boolean' },
            encoding: { type: 'string', enum: ['utf8', 'ascii', 'base64', 'hex'] },
            overwrite: { type: 'boolean' },
            maxFileSize: { type: 'number' }
          }
        }
      },
      required: ['operation', 'path'],
      additionalProperties: false
    },
    output: {
      type: 'object' as const,
      properties: {
        success: { type: 'boolean' },
        content: { type: 'string' },
        listing: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              type: { type: 'string', enum: ['file', 'directory'] },
              size: { type: 'number' },
              modified: { type: 'string' }
            }
          }
        },
        info: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            path: { type: 'string' },
            type: { type: 'string', enum: ['file', 'directory'] },
            size: { type: 'number' },
            created: { type: 'string' },
            modified: { type: 'string' },
            accessed: { type: 'string' },
            permissions: { type: 'string' },
            hash: { type: 'string' }
          }
        },
        metadata: {
          type: 'object',
          properties: {
            operation: { type: 'string' },
            path: { type: 'string' },
            duration: { type: 'number' },
            bytesProcessed: { type: 'number' }
          }
        }
      },
      required: ['success', 'metadata'],
      additionalProperties: false
    }
  }

  /**
   * Validate input for file system operations
   */
  validateInput(input: unknown): Result<FileSystemInput> {
    try {
      if (typeof input !== 'object' || input === null) {
        return Result.failure(new Error('Input must be an object'))
      }

      const fsInput = input as FileSystemInput

      // Validate operation
      if (!fsInput.operation || !['read', 'write', 'list', 'delete', 'create', 'copy', 'move', 'exists', 'info'].includes(fsInput.operation)) {
        return Result.failure(new Error('Valid operation is required'))
      }

      // Validate path
      if (!fsInput.path || typeof fsInput.path !== 'string') {
        return Result.failure(new Error('Valid path is required'))
      }

      // Validate target for copy/move operations
      if ((fsInput.operation === 'copy' || fsInput.operation === 'move') && (!fsInput.target || typeof fsInput.target !== 'string')) {
        return Result.failure(new Error('Target path is required for copy/move operations'))
      }

      // Validate content for write operations
      if (fsInput.operation === 'write' && fsInput.content === undefined) {
        return Result.failure(new Error('Content is required for write operations'))
      }

      return Result.success(fsInput)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Execute file system operation
   */
  async execute(input: FileSystemInput, context: ToolContext): Promise<Result<ToolResult<FileSystemOutput>>> {
    const startTime = Date.now()
    
    try {
      // Validate path security
      const validationResult = this.validatePath(input.path, context)
      if (validationResult.isFailure()) {
        return Result.failure(validationResult.error)
      }

      // Resolve absolute paths
      const resolvedPath = resolve(context.cwd, input.path)
      const resolvedTarget = input.target ? resolve(context.cwd, input.target) : undefined

      // Execute operation
      const result = await this.executeOperation(input.operation, resolvedPath, resolvedTarget, input.options, input.content)
      
      const duration = Date.now() - startTime
      const output: FileSystemOutput = {
        success: result.success,
        ...result.data,
        metadata: {
          operation: input.operation,
          path: resolvedPath,
          duration,
          bytesProcessed: result.bytesProcessed
        }
      }

      return Result.success(this.createSuccess(output, duration))
    } catch (error) {
      const duration = Date.now() - startTime
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Validate path security
   */
  private validatePath(path: string, context: ToolContext): Result<void> {
    try {
      // Check for path traversal attempts
      if (path.includes('..') || path.includes('~')) {
        return Result.failure(new Error('Path traversal detected'))
      }

      // Check if path is within allowed paths
      const resolvedPath = resolve(context.cwd, path)
      const isAllowed = context.security.allowedPaths.some(allowedPath => 
        resolvedPath.startsWith(resolve(allowedPath))
      )

      if (!isAllowed) {
        return Result.failure(new Error('Path not in allowed directories'))
      }

      return Result.success(void 0)
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Execute file system operation
   */
  private async executeOperation(
    operation: FileSystemOperation,
    path: string,
    target?: string,
    options?: FileSystemInput['options'],
    content?: string
  ): Promise<{ success: boolean; data: Partial<FileSystemOutput>; bytesProcessed?: number }> {
    switch (operation) {
      case 'read':
        return await this.readOperation(path, options)
      case 'write':
        return await this.writeOperation(path, content!, options)
      case 'list':
        return await this.listOperation(path)
      case 'delete':
        return await this.deleteOperation(path, options)
      case 'create':
        return await this.createOperation(path, options)
      case 'copy':
        return await this.copyOperation(path, target!)
      case 'move':
        return await this.moveOperation(path, target!)
      case 'exists':
        return await this.existsOperation(path)
      case 'info':
        return await this.infoOperation(path)
      default:
        throw new Error(`Unsupported operation: ${operation}`)
    }
  }

  /**
   * Read file operation
   */
  private async readOperation(path: string, options?: FileSystemInput['options']): Promise<{ success: boolean; data: Partial<FileSystemOutput>; bytesProcessed?: number }> {
    try {
      const stats = await stat(path)
      if (!stats.isFile()) {
        return { success: false, data: {} }
      }

      // Check file size limit
      if (options?.maxFileSize && stats.size > options.maxFileSize) {
        return { success: false, data: {} }
      }

      const encoding = options?.encoding || 'utf8'
      const content = await readFile(path, { encoding })
      
      return { 
        success: true, 
        data: { content },
        bytesProcessed: stats.size
      }
    } catch (error) {
      return { success: false, data: {} }
    }
  }

  /**
   * Write file operation
   */
  private async writeOperation(path: string, content: string, options?: FileSystemInput['options']): Promise<{ success: boolean; data: Partial<FileSystemOutput>; bytesProcessed?: number }> {
    try {
      // Check if file exists and overwrite is false
      if (!options?.overwrite) {
        try {
          await stat(path)
          return { success: false, data: {} }
        } catch {
          // File doesn't exist, continue
        }
      }

      // Create directory if it doesn't exist
      await mkdir(dirname(path), { recursive: true })

      const encoding = options?.encoding || 'utf8'
      const buffer = Buffer.from(content, encoding)
      
      await writeFile(path, buffer, { encoding })
      
      return { 
        success: true, 
        data: {},
        bytesProcessed: buffer.length
      }
    } catch (error) {
      return { success: false, data: {} }
    }
  }

  /**
   * List directory operation
   */
  private async listOperation(path: string): Promise<{ success: boolean; data: Partial<FileSystemOutput> }> {
    try {
      const stats = await stat(path)
      if (!stats.isDirectory()) {
        return { success: false, data: {} }
      }

      const entries = await readdir(path, { withFileTypes: true })
      const listing = []

      for (const entry of entries) {
        const entryPath = join(path, entry.name)
        const entryStats = await stat(entryPath)
        
        listing.push({
          name: entry.name,
          path: entryPath,
          type: entry.isFile() ? 'file' as const : 'directory' as const,
          size: entryStats.size,
          modified: entryStats.mtime
        })
      }

      return { success: true, data: { listing } }
    } catch (error) {
      return { success: false, data: {} }
    }
  }

  /**
   * Delete operation
   */
  private async deleteOperation(path: string, options?: FileSystemInput['options']): Promise<{ success: boolean; data: Partial<FileSystemOutput> }> {
    try {
      await rm(path, { recursive: options?.recursive || false })
      return { success: true, data: {} }
    } catch (error) {
      return { success: false, data: {} }
    }
  }

  /**
   * Create directory operation
   */
  private async createOperation(path: string, options?: FileSystemInput['options']): Promise<{ success: boolean; data: Partial<FileSystemOutput> }> {
    try {
      await mkdir(path, { recursive: options?.recursive || false })
      return { success: true, data: {} }
    } catch (error) {
      return { success: false, data: {} }
    }
  }

  /**
   * Copy operation
   */
  private async copyOperation(source: string, target: string): Promise<{ success: boolean; data: Partial<FileSystemOutput> }> {
    try {
      await copyFile(source, target)
      return { success: true, data: {} }
    } catch (error) {
      return { success: false, data: {} }
    }
  }

  /**
   * Move operation
   */
  private async moveOperation(source: string, target: string): Promise<{ success: boolean; data: Partial<FileSystemOutput> }> {
    try {
      await this.copyOperation(source, target)
      await rm(source)
      return { success: true, data: {} }
    } catch (error) {
      return { success: false, data: {} }
    }
  }

  /**
   * Exists operation
   */
  private async existsOperation(path: string): Promise<{ success: boolean; data: Partial<FileSystemOutput> }> {
    try {
      await stat(path)
      return { success: true, data: {} }
    } catch (error) {
      return { success: false, data: {} }
    }
  }

  /**
   * Info operation
   */
  private async infoOperation(path: string): Promise<{ success: boolean; data: Partial<FileSystemOutput> }> {
    try {
      const stats = await stat(path)
      const hash = stats.isFile() ? await this.calculateFileHash(path) : undefined

      const info = {
        name: basename(path),
        path,
        type: stats.isFile() ? 'file' as const : 'directory' as const,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        permissions: stats.mode.toString(8),
        hash
      }

      return { success: true, data: { info } }
    } catch (error) {
      return { success: false, data: {} }
    }
  }

  /**
   * Calculate file hash
   */
  private async calculateFileHash(path: string): Promise<string> {
    try {
      const content = await readFile(path)
      return createHash('sha256').update(content).digest('hex')
    } catch {
      return ''
    }
  }
}
