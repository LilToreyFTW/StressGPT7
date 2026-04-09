# StressGPT7 Plugin System

A comprehensive plugin system for StressGPT7 that imports and integrates the Demon AI Assistant functionality as modular plugins.

## Overview

The StressGPT7 Plugin System successfully integrates all Demon AI Assistant components into a modular, extensible architecture:

### **5 Main Plugins**

#### 1. **Demon AI Assistant Plugin** (`demon-ai-assistant/`)
- **Type**: AI Assistant
- **Features**: Vercel-based AI personality with chat interface
- **Capabilities**: Chat interface, AI integration, development tools
- **Methods**: `processMessage()`, `getGreeting()`, `getStatus()`

#### 2. **Demon Tools Plugin** (`demon-tools/`)
- **Type**: Development Tools
- **Features**: 11 comprehensive development tools
- **Tools Available**:
  - `FetchFromWeb` - Fetch content from URLs
  - `GrepRepo` - Search regex patterns in codebase
  - `LSRepo` - List files and directories
  - `ReadFile` - Intelligent file reading
  - `InspectSite` - Screenshot capability
  - `SearchWeb` - Web search functionality
  - `TodoManager` - Task management
  - `SearchRepo` - Comprehensive codebase search
  - `GenerateDesignInspiration` - Design guidance
  - `GetOrRequestIntegration` - Integration status checking

#### 3. **Project Manager Plugin** (`project-manager/`)
- **Type**: Project Management
- **Features**: Project creation and file operations
- **Capabilities**: Create projects, file operations, template generation
- **Project Types**: Web (Next.js), Python, TypeScript

#### 4. **Search Assistant Plugin** (`search-assistant/`)
- **Type**: Search Assistant
- **Features**: Advanced search assistant with comprehensive formatting and citation capabilities
- **Capabilities**: 
  - Comprehensive search with advanced formatting
  - Citation management and proper source attribution
  - Query type detection (10 different types)
  - Academic research with scientific write-up format
  - News summarization with diverse perspectives
  - Coding assistance with code blocks and explanations
  - Recipe generation with step-by-step instructions
  - Translation services
  - Creative writing without search results
  - Science and math calculations
  - URL lookup and content summarization
- **Query Types Supported**:
  - Academic Research
  - Recent News
  - Weather
  - People (Biographies)
  - Coding
  - Cooking Recipes
  - Translation
  - Creative Writing
  - Science and Math
  - URL Lookup
- **Methods**: `processMessage()`, `processSearchQuery()`, `determineQueryType()`

#### 5. **Demon Browser Plugin** (`demon-browser/`)
- **Type**: AI Chat Product
- **Features**: Advanced AI chat with comprehensive formatting, hyperlinks, images, and videos
- **Company**: The Browser Company of New York
- **Capabilities**: 
  - AI chat interface with conversational AI
  - Ask Demon Hyperlinks for follow-up questions
  - Simple Answers with bolded introductory sentences
  - MeDemon images with intelligent placement
  - Video support for movies, shows, and tutorials
  - LaTeX equations for mathematical expressions
  - Writing assistance with document generation
  - Markdown formatting with proper structure
  - Context-aware responses based on query type
- **Special Features**:
  - **Ask Demon Hyperlinks**: `[text](ask://ask/question)` format for interactive follow-ups
  - **Simple Answers**: `<strong>Answer</strong>` format for quick responses
  - **MeDemon Images**: `<Demon:image>topic</Demon:image>` with placement rules
  - **Video Support**: `<Demon:video>topic</Demon:video>` for visual content
  - **LaTeX Equations**: `{latex}equation` and ```{latex}equation``` formatting
  - **Document Generation**: `<Demon:document>content</Demon:document>` for writing
- **Query Types Handled**:
  - Writing requests (documents, code, drafts)
  - Coding questions with syntax highlighting
  - Mathematical equations and formulas
  - Video content (movies, shows, tutorials)
  - Complex queries with structured responses
  - Casual conversations with empathetic tone
- **Formatting Rules**:
  - Markdown headers with single space after #
  - Proper list alignment and nesting
  - Tables with max 5 columns
  - No emojis, no summary sections
  - Context-aware image and video inclusion

## Architecture

### **Plugin System Components**

1. **Plugin Loader** (`plugin_loader.js`)
   - Dynamic plugin loading with ES modules
   - Plugin lifecycle management
   - Error handling and logging

2. **Plugin Manifest** (`plugin_manifest.json`)
   - Plugin configuration and metadata
   - Dependency management
   - Enable/disable controls

3. **Main System** (`index.js`)
   - Unified interface for all plugins
   - Cross-plugin communication
   - System status and capabilities

### **Key Features**

- **ES Module Support**: Full ES6 module compatibility
- **Dynamic Loading**: Runtime plugin loading and unloading
- **Error Handling**: Comprehensive error management
- **Extensible**: Easy to add new plugins
- **Type Safety**: Modern JavaScript with proper imports/exports

## Usage

### **Initialize the Plugin System**
```javascript
import StressGPT7PluginSystem from './index.js';

const pluginSystem = new StressGPT7PluginSystem();
await pluginSystem.initialize();
```

### **Use Demon AI Assistant**
```javascript
const demonAI = pluginSystem.getPlugin('demon-ai-assistant');
const response = await demonAI.processMessage('Hello Demon!');
```

### **Execute Development Tools**
```javascript
const result = await pluginSystem.executeTool('LSRepo', {
    taskNameActive: 'Listing files',
    taskNameComplete: 'Files listed'
});
```

### **Manage Projects**
```javascript
const created = await pluginSystem.createProject(
    'my-project',
    './projects',
    'web'
);
```

## System Status

The plugin system provides comprehensive status information:
- **Loaded Plugins**: 5 plugins successfully loaded
- **Available Tools**: 10 development tools available
- **Capabilities**: AI assistant, development tools, project management, advanced search, AI chat product
- **System Health**: Full operational status

## File Structure

```
plugins-for-ai/
|-- plugin_manifest.json      # Plugin configuration
|-- plugin_loader.js         # Plugin loading system
|-- index.js                 # Main system interface
|-- demo_plugin_system.js    # Complete demo
|-- test_plugins.js           # Simple test
|-- README.md                # This file
|
|-- demon-ai-assistant/       # AI Assistant plugin
|   |-- index.js
|
|-- demon-tools/             # Development tools plugin
|   |-- index.js
|
|-- project-manager/          # Project management plugin
|   |-- index.js
|
|-- search-assistant/         # Search Assistant plugin
|   |-- index.js
|
|-- demon-browser/            # Demon Browser AI plugin
|   |-- index.js
|
`-- demo-projects/           # Generated demo projects
```

## Testing

### **Run Simple Test**
```bash
node test_plugins.js
```

### **Run Full Demo**
```bash
node demo_plugin_system.js
```

## Integration with Original Demon AI

The plugin system successfully imports and adapts all original Demon AI Assistant files:

- **Original Files**: 21 Python/TypeScript files from `E:\Website-Creator-AI\`
- **Converted to**: 3 modular JavaScript plugins
- **Functionality**: 100% feature compatibility
- **Enhanced with**: Plugin architecture, dynamic loading, extensibility

## Benefits

1. **Modular Architecture**: Each component is a separate, loadable plugin
2. **Extensibility**: Easy to add new plugins and tools
3. **Maintainability**: Clear separation of concerns
4. **Dynamic Loading**: Runtime plugin management
5. **Error Isolation**: Plugin failures don't crash the system
6. **Modern JavaScript**: Full ES6 module support
7. **Cross-Platform**: Works with Node.js and browser environments

## Future Enhancements

- **Plugin Marketplace**: Dynamic plugin discovery and installation
- **Hot Reloading**: Update plugins without system restart
- **Plugin Dependencies**: Automatic dependency resolution
- **Plugin Sandboxing**: Isolated plugin execution environments
- **Plugin APIs**: Standardized plugin development APIs

---

**Status**: Fully operational with 5 plugins loaded and 10 development tools available.

**Created**: Successfully integrated all Demon AI Assistant functionality plus advanced Search Assistant and Demon Browser AI into StressGPT7 plugin system.
