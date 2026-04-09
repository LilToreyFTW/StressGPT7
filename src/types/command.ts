export interface Command {
  name: string
  description: string
  execute(args: string[]): Promise<CommandResult>
}

export interface CommandResult {
  success: boolean
  data?: unknown
  error?: string
}
