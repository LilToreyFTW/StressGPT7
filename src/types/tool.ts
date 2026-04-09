export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
  metadata?: Record<string, unknown>
}

export interface Tool {
  name: string
  description: string
  isEnabled(): boolean
  getInputSchema(): Record<string, unknown>
  execute(input: Record<string, unknown>): Promise<ToolResult>
}

export interface ToolConfig {
  enabled: boolean
  timeoutMs?: number
  maxRetries?: number
  parameters?: Record<string, unknown>
}
