# StressGPT7

Advanced autonomous software engineering AI - Production-ready rewrite of the original StressGPT project.

## Overview

StressGPT7 is a sophisticated AI-powered software engineering assistant that can analyze, refactor, and build entire codebases with production-level quality. It features a modular architecture with pluggable tools, commands, skills, and MCP (Model Context Protocol) support.

## Features

- **Advanced Code Analysis**: Deep understanding of code structure, dependencies, and patterns
- **Automated Refactoring**: Complete codebase transformations with no placeholders
- **Tool Integration**: File system operations, bash commands, web search, and more
- **Command System**: Extensible slash commands for system control
- **Plugin Architecture**: Modular plugin system for extending functionality
- **Skills Framework**: Specialized capabilities for specific tasks
- **MCP Support**: Model Context Protocol for external tool integration
- **Production-Ready**: Clean, optimized, and professional code output

## Installation

### Prerequisites

- Node.js 20+ or Bun 1.1+
- TypeScript 5.5+
- ANTHROPIC_API_KEY environment variable

### Setup

1. Clone the repository:
```bash
git clone https://github.com/stressgpt7/stressgpt7.git
cd stressgpt7
```

2. Install dependencies:
```bash
bun install
# or
npm install
```

3. Set up environment:
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

4. Build the project:
```bash
bun run build
```

5. Run StressGPT7:
```bash
bun run start
```

## Configuration

Create a `stressgpt7.config.json` file in your project root:

```json
{
  "api": {
    "anthropic": {
      "model": "claude-3-5-sonnet-20241022",
      "maxTokens": 8192,
      "temperature": 0.1
    }
  },
  "system": {
    "logLevel": "info",
    "enableTelemetry": false,
    "enablePlugins": true,
    "enableSkills": true,
    "enableMCP": true
  },
  "ui": {
    "theme": "auto",
    "enableColors": true,
    "enableProgress": true
  },
  "performance": {
    "maxConcurrentTools": 5,
    "timeoutMs": 30000,
    "enableCaching": true
  },
  "security": {
    "enableSandbox": true,
    "allowedDomains": [],
    "maxFileSize": 10485760
  }
}
```

## Usage

### Interactive Mode

Start StressGPT7 and interact with it through the command line:

```bash
bun run start
```

### Commands

Use slash commands to control the system:

- `/help` - Show available commands
- `/clear` - Clear conversation history
- `/status` - Show system status
- `/config` - Show or update configuration

### AI Assistant

Simply type your requests as natural language:

```
> Analyze this TypeScript project and suggest improvements
> Refactor the authentication system to use modern patterns
> Create a complete REST API for user management
> Review this code for security vulnerabilities
```

## Architecture

StressGPT7 features a clean, modular architecture:

### Core Components

- **StressGPT7**: Main application class
- **QueryEngine**: Handles AI interactions and conversation flow
- **StateManager**: Manages application state and session data
- **ToolManager**: Manages available tools and their execution
- **CommandManager**: Handles slash commands
- **PluginManager**: Manages plugin loading and execution
- **SkillManager**: Manages specialized skills
- **MCPManager**: Handles Model Context Protocol connections

### Tools

Built-in tools for common operations:

- **FileSystemTool**: File and directory operations
- **BashTool**: Shell command execution
- **CodeAnalysisTool**: Code analysis and quality checks
- **WebSearchTool**: Web search capabilities

### Extensibility

- **Plugins**: Extend functionality with custom plugins
- **Skills**: Add specialized capabilities
- **Commands**: Create custom slash commands
- **MCP**: Connect to external tools and services

## Development

### Project Structure

```
src/
|-- core/           # Core application components
|-- tools/          # Built-in tools
|-- types/          # TypeScript type definitions
|-- utils/          # Utility functions
|-- commands/       # Command implementations
|-- plugins/        # Plugin system
|-- skills/         # Skill implementations
|-- index.ts        # Application entry point
```

### Building

```bash
bun run build      # Build for production
bun run dev        # Development mode
bun run test       # Run tests
bun run lint       # Lint code
bun run format     # Format code
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Security

StressGPT7 includes several security features:

- **Sandbox Mode**: Isolates tool execution
- **Path Validation**: Prevents access to dangerous system paths
- **Command Filtering**: Blocks dangerous shell commands
- **Domain Restrictions**: Controls web access
- **File Size Limits**: Prevents resource exhaustion

## License

MIT License - see LICENSE file for details.

## Support

- GitHub Issues: Report bugs and request features
- Documentation: [Link to docs]
- Community: [Link to community]

---

**StressGPT7** - Advanced autonomous software engineering AI
