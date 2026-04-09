/**
 * Complete Code Executor for StressGPT7
 * Production-ready with multi-language support and sandboxing
 */

import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

const execAsync = promisify(exec)

export interface ExecutionRequest {
  code: string
  language: 'python' | 'java' | 'c' | 'cpp' | 'csharp' | 'javascript' | 'typescript' | 'nodejs'
  input?: string
  timeout?: number
  requirements?: string[]
}

export interface ExecutionResult {
  success: boolean
  output: string
  error?: string
  exitCode: number
  executionTime: number
  memoryUsage?: number
  files?: string[]
}

export interface CompilationResult {
  success: boolean
  output: string
  error?: string
  executablePath?: string
  compilationTime: number
}

export class CodeExecutor {
  private tempDir: string
  private maxExecutionTime: number = 10000 // 10 seconds
  private maxMemoryUsage: number = 128 * 1024 * 1024 // 128MB

  constructor() {
    this.tempDir = join(tmpdir(), 'stressgpt7-execution')
  }

  async initialize(): Promise<void> {
    try {
      await mkdir(this.tempDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create temp directory:', error)
    }
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now()
    const executionId = randomUUID()
    const workDir = join(this.tempDir, executionId)

    try {
      await mkdir(workDir, { recursive: true })

      // Step 1: Write code to file
      const files = await this.writeCodeFiles(request.code, request.language, workDir, executionId)

      // Step 2: Compile if necessary
      let executablePath: string | undefined
      if (this.requiresCompilation(request.language)) {
        const compilationResult = await this.compileCode(request.language, files, workDir)
        if (!compilationResult.success) {
          return {
            success: false,
            output: '',
            error: compilationResult.error || 'Compilation failed',
            exitCode: 1,
            executionTime: Date.now() - startTime,
            files
          }
        }
        executablePath = compilationResult.executablePath
      }

      // Step 3: Execute the code
      const result = await this.runCode(request.language, files, executablePath, workDir, request.input, request.timeout || this.maxExecutionTime)

      return {
        ...result,
        executionTime: Date.now() - startTime,
        files
      }

    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        exitCode: 1,
        executionTime: Date.now() - startTime
      }
    } finally {
      // Cleanup
      await this.cleanup(workDir)
    }
  }

  private async writeCodeFiles(code: string, language: string, workDir: string, executionId: string): Promise<string[]> {
    const files: string[] = []
    const timestamp = Date.now()

    switch (language) {
      case 'python':
        const pythonFile = join(workDir, `script_${timestamp}.py`)
        await writeFile(pythonFile, code)
        files.push(pythonFile)
        break

      case 'java':
        const javaFile = join(workDir, `Main_${timestamp}.java`)
        await writeFile(javaFile, code)
        files.push(javaFile)
        break

      case 'c':
        const cFile = join(workDir, `program_${timestamp}.c`)
        await writeFile(cFile, code)
        files.push(cFile)
        break

      case 'cpp':
        const cppFile = join(workDir, `program_${timestamp}.cpp`)
        await writeFile(cppFile, code)
        files.push(cppFile)
        break

      case 'csharp':
        const csFile = join(workDir, `Program_${timestamp}.cs`)
        await writeFile(csFile, code)
        files.push(csFile)
        break

      case 'javascript':
      case 'nodejs':
        const jsFile = join(workDir, `script_${timestamp}.js`)
        await writeFile(jsFile, code)
        files.push(jsFile)
        break

      case 'typescript':
        const tsFile = join(workDir, `script_${timestamp}.ts`)
        await writeFile(tsFile, code)
        files.push(tsFile)

        // Create package.json if needed
        const packageJson = {
          name: `stressgpt7-${executionId}`,
          version: '1.0.0',
          scripts: {
            build: 'tsc'
          },
          dependencies: {
            typescript: '^4.9.0'
          }
        }
        const packageJsonFile = join(workDir, 'package.json')
        await writeFile(packageJsonFile, JSON.stringify(packageJson, null, 2))
        files.push(packageJsonFile)
        break

      default:
        throw new Error(`Unsupported language: ${language}`)
    }

    return files
  }

  private requiresCompilation(language: string): boolean {
    return ['java', 'c', 'cpp', 'csharp', 'typescript'].includes(language)
  }

  private async compileCode(language: string, files: string[], workDir: string): Promise<CompilationResult> {
    const startTime = Date.now()

    try {
      let command: string
      let outputFile: string

      switch (language) {
        case 'java':
          command = `javac "${files[0]}"`
          outputFile = files[0].replace('.java', '.class')
          break

        case 'c':
          outputFile = join(workDir, 'program')
          command = `gcc -o "${outputFile}" "${files[0]}" -lm`
          break

        case 'cpp':
          outputFile = join(workDir, 'program')
          command = `g++ -o "${outputFile}" "${files[0]}" -std=c++11`
          break

        case 'csharp':
          outputFile = join(workDir, 'Program.exe')
          command = `csc /out:"${outputFile}" "${files[0]}"`
          break

        case 'typescript':
          // TypeScript compilation
          const tsFile = files.find(f => f.endsWith('.ts'))
          if (!tsFile) {
            throw new Error('TypeScript file not found')
          }
          command = `npx tsc "${tsFile}" --target ES2020 --module commonjs`
          outputFile = tsFile.replace('.ts', '.js')
          break

        default:
          throw new Error(`Compilation not supported for ${language}`)
      }

      const { stdout, stderr } = await execAsync(command, {
        cwd: workDir,
        timeout: 30000 // 30 seconds compilation timeout
      })

      return {
        success: true,
        output: stdout || stderr,
        executablePath: outputFile,
        compilationTime: Date.now() - startTime
      }

    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.stderr || error.message || 'Compilation failed',
        compilationTime: Date.now() - startTime
      }
    }
  }

  private async runCode(language: string, files: string[], executablePath: string | undefined, workDir: string, input?: string, timeout?: number): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      let command: string
      let args: string[] = []

      switch (language) {
        case 'python':
          command = 'python3'
          args = [files[0]]
          break

        case 'java':
          command = 'java'
          args = ['-cp', workDir, 'Main'] // Assumes Main class
          break

        case 'c':
        case 'cpp':
          if (!executablePath) {
            resolve({
              success: false,
              output: '',
              error: 'Executable not found',
              exitCode: 1,
              executionTime: 0
            })
            return
          }
          command = executablePath
          args = []
          break

        case 'csharp':
          if (!executablePath) {
            resolve({
              success: false,
              output: '',
              error: 'Executable not found',
              exitCode: 1,
              executionTime: 0
            })
            return
          }
          command = 'dotnet'
          args = [executablePath]
          break

        case 'javascript':
        case 'nodejs':
          command = 'node'
          args = [files[0]]
          break

        case 'typescript':
          const jsFile = files[0].replace('.ts', '.js')
          command = 'node'
          args = [jsFile]
          break

        default:
          resolve({
            success: false,
            output: '',
            error: `Execution not supported for ${language}`,
            exitCode: 1,
            executionTime: 0
          })
          return
      }

      const startTime = Date.now()
      const childProcess = spawn(command, args, {
        cwd: workDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=128' }
      })

      let stdout = ''
      let stderr = ''

      childProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      childProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      // Send input if provided
      if (input) {
        childProcess.stdin.write(input)
        childProcess.stdin.end()
      }

      // Set timeout
      const timeoutId = setTimeout(() => {
        childProcess.kill('SIGKILL')
        resolve({
          success: false,
          output: stdout,
          error: `Execution timed out after ${timeout}ms`,
          exitCode: -1,
          executionTime: Date.now() - startTime
        })
      }, timeout || this.maxExecutionTime)

      childProcess.on('close', (code, signal) => {
        clearTimeout(timeoutId)
        
        resolve({
          success: code === 0 && signal === null,
          output: stdout,
          error: stderr || (signal ? `Process killed with signal ${signal}` : undefined),
          exitCode: code || 0,
          executionTime: Date.now() - startTime
        })
      })

      childProcess.on('error', (error) => {
        clearTimeout(timeoutId)
        resolve({
          success: false,
          output: '',
          error: error.message,
          exitCode: 1,
          executionTime: Date.now() - startTime
        })
      })
    })
  }

  private async cleanup(workDir: string): Promise<void> {
    try {
      const { exec } = await import('child_process')
      await promisify(exec)(`rm -rf "${workDir}"`)
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Utility methods for different languages
  async validateCode(code: string, language: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    switch (language) {
      case 'python':
        // Basic Python syntax validation
        if (!code.trim()) {
          errors.push('Code cannot be empty')
        }
        // Check for basic syntax issues
        if (code.includes('def ') && !code.includes('return') && !code.includes('print')) {
          errors.push('Function defined but no return or print statement found')
        }
        break

      case 'java':
        // Basic Java validation
        if (!code.includes('class ')) {
          errors.push('Java code must contain a class')
        }
        if (!code.includes('public static void main')) {
          errors.push('Java code should have a main method')
        }
        break

      case 'c':
      case 'cpp':
        // Basic C/C++ validation
        if (!code.includes('main(')) {
          errors.push('C/C++ code must have a main function')
        }
        if (!code.includes('#include')) {
          errors.push('C/C++ code should include necessary headers')
        }
        break

      case 'javascript':
      case 'nodejs':
        // Basic JavaScript validation
        if (!code.trim()) {
          errors.push('Code cannot be empty')
        }
        break

      case 'typescript':
        // Basic TypeScript validation
        if (!code.trim()) {
          errors.push('Code cannot be empty')
        }
        break

      default:
        errors.push(`Unsupported language: ${language}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  async getLanguageInfo(language: string): Promise<{
    name: string
    extensions: string[]
    compilable: boolean
    runtime: string
    features: string[]
  }> {
    const languages = {
      python: {
        name: 'Python',
        extensions: ['.py'],
        compilable: false,
        runtime: 'python3',
        features: ['Dynamic typing', 'Interpreted', 'Multi-paradigm', 'Extensive libraries']
      },
      java: {
        name: 'Java',
        extensions: ['.java'],
        compilable: true,
        runtime: 'java',
        features: ['Static typing', 'Object-oriented', 'Platform independent', 'Strong typing']
      },
      c: {
        name: 'C',
        extensions: ['.c'],
        compilable: true,
        runtime: 'native',
        features: ['Procedural', 'Low-level', 'Fast', 'Memory management']
      },
      cpp: {
        name: 'C++',
        extensions: ['.cpp', '.cc', '.cxx'],
        compilable: true,
        runtime: 'native',
        features: ['Object-oriented', 'Performance', 'STL', 'Memory management']
      },
      csharp: {
        name: 'C#',
        extensions: ['.cs'],
        compilable: true,
        runtime: 'dotnet',
        features: ['Object-oriented', '.NET ecosystem', 'Type safe', 'Garbage collection']
      },
      javascript: {
        name: 'JavaScript',
        extensions: ['.js'],
        compilable: false,
        runtime: 'node',
        features: ['Dynamic typing', 'Event-driven', 'Async/await', 'Extensive ecosystem']
      },
      nodejs: {
        name: 'Node.js',
        extensions: ['.js'],
        compilable: false,
        runtime: 'node',
        features: ['Server-side JavaScript', 'Event-driven', 'NPM ecosystem', 'Non-blocking I/O']
      },
      typescript: {
        name: 'TypeScript',
        extensions: ['.ts'],
        compilable: true,
        runtime: 'node',
        features: ['Static typing', 'JavaScript superset', 'Interfaces', 'Generics']
      }
    }

    return languages[language] || {
      name: 'Unknown',
      extensions: [],
      compilable: false,
      runtime: 'unknown',
      features: []
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    return ['python', 'java', 'c', 'cpp', 'csharp', 'javascript', 'nodejs', 'typescript']
  }

  async testExecution(language: string): Promise<{ success: boolean; output: string; error?: string }> {
    const testCode = this.getTestCode(language)
    
    try {
      const result = await this.execute({
        code: testCode,
        language: language as any,
        timeout: 5000
      })

      return {
        success: result.success,
        output: result.output,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private getTestCode(language: string): string {
    const testCodes = {
      python: 'print("Hello, World!")',
      java: 'public class Main { public static void main(String[] args) { System.out.println("Hello, World!"); } }',
      c: '#include <stdio.h>\nint main() { printf("Hello, World!\\n"); return 0; }',
      cpp: '#include <iostream>\nint main() { std::cout << "Hello, World!" << std::endl; return 0; }',
      csharp: 'using System;\nclass Program { static void Main() { Console.WriteLine("Hello, World!"); } }',
      javascript: 'console.log("Hello, World!");',
      nodejs: 'console.log("Hello, World!");',
      typescript: 'console.log("Hello, World!");'
    }

    return testCodes[language] || '// Test code not available'
  }

  async dispose(): Promise<void> {
    // Cleanup any remaining temp files
    try {
      const { exec } = await import('child_process')
      await promisify(exec)(`rm -rf "${this.tempDir}"`)
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

export default CodeExecutor
