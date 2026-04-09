export interface Message {
  id: string
  type: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface ToolMessage extends Message {
  type: 'tool'
  toolName: string
  toolInput: Record<string, unknown>
  toolResult: unknown
}

export interface SystemMessage extends Message {
  type: 'system'
  subtype?: 'info' | 'warning' | 'error' | 'tool_result'
}

export interface UserMessage extends Message {
  type: 'user'
  isMeta?: boolean
}

export interface AssistantMessage extends Message {
  type: 'assistant'
  stopReason?: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}
