// StressGPT7 with Plugins - Enhanced Vercel Deployment
import { createServer } from 'http';
import { join } from 'path';
import { readFile } from 'fs/promises';

const server = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Handle API endpoints
    if (pathname.startsWith('/api/')) {
      await handleAPIRequest(req, res, pathname);
      return;
    }

    // Serve HTML for all other routes
    await serveHTML(res);
  } catch (error) {
    console.error('Request error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

async function handleAPIRequest(req, res, pathname) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const data = JSON.parse(body || '{}');
      let response;

      switch (pathname) {
        case '/api/chat':
          response = await handleChatRequest(data);
          break;
        case '/api/code':
          response = await handleCodeRequest(data);
          break;
        case '/api/health':
          response = await handleHealthRequest();
          break;
        case '/api/plugins':
          response = await handlePluginsRequest();
          break;
        case '/api/plugins/execute':
          response = await handlePluginExecuteRequest(data);
          break;
        default:
          response = { error: 'Endpoint not found' };
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (error) {
      console.error('API error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
}

async function handleChatRequest(data) {
  // Enhanced chat with plugin context
  const pluginContext = await getPluginContext();
  const baseResponse = {
    success: true,
    response: {
      type: 'text',
      content: `Hello! I'm StressGPT7 with enhanced plugin support. 

${pluginContext}

I can help you with:
- AI-powered assistance with multiple plugins
- Code generation in various languages
- Project management and file operations
- Advanced search capabilities
- Development tools and utilities
- Interactive chat with rich formatting

What would you like to work on today?`,
      metadata: {
        plugins: ['demon-ai-assistant', 'demon-tools', 'project-manager', 'search-assistant', 'demon-browser'],
        capabilities: ['ai-chat', 'code-generation', 'project-management', 'search', 'tools']
      }
    },
    sessionId: data.sessionId || 'demo-session'
  };

  return baseResponse;
}

async function handleCodeRequest(data) {
  const { language = 'javascript', prompt = 'hello world' } = data;
  
  const codeExamples = {
    python: `#!/usr/bin/env python3
"""
Python code generated with StressGPT7 plugins
"""
print("Hello from StressGPT7 with plugins!")`,
    
    javascript: `// JavaScript code generated with StressGPT7 plugins
console.log("Hello from StressGPT7 with plugins!");`,
    
    typescript: `// TypeScript code generated with StressGPT7 plugins
interface Message {
  text: string;
  timestamp: Date;
}

const message: Message = {
  text: "Hello from StressGPT7 with plugins!",
  timestamp: new Date()
};

console.log(message.text);`,
    
    java: `// Java code generated with StressGPT7 plugins
public class StressGPT7Demo {
    public static void main(String[] args) {
        System.out.println("Hello from StressGPT7 with plugins!");
    }
}`
  };

  return {
    success: true,
    code: codeExamples[language] || codeExamples.javascript,
    language,
    explanation: `Generated ${language} code using StressGPT7 plugin system with enhanced AI capabilities.`,
    plugins: ['demon-ai-assistant', 'demon-tools']
  };
}

async function handleHealthRequest() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime() * 1000,
    plugins: {
      loaded: 5,
      enabled: ['demon-ai-assistant', 'demon-tools', 'project-manager', 'search-assistant', 'demon-browser'],
      status: 'operational'
    },
    features: {
      'ai-chat': true,
      'code-generation': true,
      'project-management': true,
      'search': true,
      'tools': true,
      'plugins': true
    }
  };
}

async function handlePluginsRequest() {
  return {
    success: true,
    plugins: [
      {
        name: 'demon-ai-assistant',
        version: '1.0.0',
        type: 'ai-assistant',
        description: 'Demon AI Assistant with Vercel integration',
        capabilities: ['chat-interface', 'ai-integration', 'development-tools'],
        status: 'active'
      },
      {
        name: 'demon-tools',
        version: '1.0.0',
        type: 'tools',
        description: '11 development tools for Demon AI',
        tools: ['FetchFromWeb', 'GrepRepo', 'ReadFile', 'SearchWeb', 'TodoManager'],
        status: 'active'
      },
      {
        name: 'project-manager',
        version: '1.0.0',
        type: 'project-management',
        description: 'Project management and file operations',
        capabilities: ['create-projects', 'file-operations', 'command-execution'],
        status: 'active'
      },
      {
        name: 'search-assistant',
        version: '1.0.0',
        type: 'search',
        description: 'Advanced search assistant with comprehensive formatting',
        capabilities: ['comprehensive-search', 'advanced-formatting', 'citation-management'],
        status: 'active'
      },
      {
        name: 'demon-browser',
        version: '1.0.0',
        type: 'ai-chat',
        description: 'Advanced AI chat with formatting and media support',
        capabilities: ['ai-chat-interface', 'markdown-formatting', 'context-aware-responses'],
        status: 'active'
      }
    ]
  };
}

async function handlePluginExecuteRequest(data) {
  const { plugin, tool, args = [] } = data;
  
  // Simulate plugin tool execution
  const results = {
    'demon-tools': {
      'FetchFromWeb': { success: true, data: 'Web content fetched successfully' },
      'GrepRepo': { success: true, matches: ['file1.js', 'file2.ts'] },
      'ReadFile': { success: true, content: 'File content here' },
      'SearchWeb': { success: true, results: ['Result 1', 'Result 2'] },
      'TodoManager': { success: true, todos: ['Task 1', 'Task 2'] }
    }
  };

  const result = results[plugin]?.[tool] || { success: false, error: 'Tool not found' };
  
  return {
    success: true,
    plugin,
    tool,
    result,
    executionTime: Date.now()
  };
}

async function getPluginContext() {
  return `**Available Plugins (5):**
- **demon-ai-assistant**: AI-powered assistance with development tools
- **demon-tools**: 11 development tools including web fetching and search
- **project-manager**: Project management and file operations
- **search-assistant**: Advanced search with formatting and citations
- **demon-browser**: Enhanced AI chat with rich formatting support`;
}

async function serveHTML(res) {
  try {
    const htmlPath = join(process.cwd(), 'src', 'gui', 'app.html');
    const html = await readFile(htmlPath, 'utf-8');
    
    // Enhance HTML with plugin information
    const enhancedHTML = html.replace(
      '</head>',
      `
  <style>
    .plugin-badge {
      background: linear-gradient(135deg, #4ec9b0, #007acc);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      margin: 2px;
      display: inline-block;
    }
    .plugin-status {
      background: #2a2a2a;
      border: 1px solid #3e3e42;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }
  </style>
  </head>`
    ).replace(
      '<div class="status-item">',
      '<div class="plugin-status"><strong>Active Plugins:</strong><br><span class="plugin-badge">demon-ai-assistant</span><span class="plugin-badge">demon-tools</span><span class="plugin-badge">project-manager</span><span class="plugin-badge">search-assistant</span><span class="plugin-badge">demon-browser</span></div><div class="status-item">'
    );
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(enhancedHTML);
  } catch (error) {
    console.error('Error serving HTML:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error loading application');
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`StressGPT7 with Plugins server running on port ${PORT}`);
  console.log('Active plugins: demon-ai-assistant, demon-tools, project-manager, search-assistant, demon-browser');
});

export default server;
