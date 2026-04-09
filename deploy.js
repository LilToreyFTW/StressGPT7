// StressGPT7 - Simple Vercel Deployment Server
import { createServer } from 'http';

const server = createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Simple AI responses
  const responses = {
    'hello': 'Hello! I\'m StressGPT7, your advanced AI assistant. I can help you with programming, code generation, analysis, and more.',
    'python': '```python\n# Python code example\ndef hello_world():\n    print("Hello, World!")\n    return "Hello, World!"\n\nhello_world()\n```',
    'javascript': '```javascript\n// JavaScript code example\nfunction helloWorld() {\n    console.log("Hello, World!");\n    return "Hello, World!";\n}\n\nhelloWorld();\n```'
  };

  // Handle requests
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        let response;
        
        if (pathname === '/api/chat') {
          response = {
            success: true,
            response: {
              type: 'text',
              content: responses.hello,
              metadata: null
            },
            sessionId: data.sessionId || 'demo-session'
          };
        } else if (pathname === '/api/health') {
          response = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime() * 1000
          };
        } else {
          response = { error: 'Endpoint not found' };
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    
    return;
  }

  // Serve HTML for all other routes
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StressGPT7 - Advanced AI Assistant</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary: #007acc;
            --secondary: #3c3c3c;
            --accent: #4ec9b0;
            --background: #1e1e1e;
            --surface: #252526;
            --surface-hover: #2a2a2a;
            --text: #d4d4d4;
            --text-secondary: #9d9d9d;
            --error: #f14c4c;
            --warning: #ffcc02;
            --success: #4ec9b0;
            --border: #3e3e42;
            --code-bg: #0e0e0e;
            --code-text: #d4d4d4;
        }

        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: var(--background);
            color: var(--text);
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .header {
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--primary);
        }

        .logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 1.2rem;
            box-shadow: 0 2px 8px rgba(0,122,204,0.3);
        }

        .status-bar {
            display: flex;
            align-items: center;
            gap: 2rem;
        }

        .status-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: var(--text-secondary);
        }

        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--success);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .main {
            flex: 1;
            display: flex;
            overflow: hidden;
        }

        .sidebar {
            width: 280px;
            background: var(--surface);
            border-right: 1px solid var(--border);
            padding: 1.5rem;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }

        .sidebar-section {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .sidebar-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--border);
        }

        .tool-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .tool-item {
            padding: 0.75rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            border: 1px solid transparent;
        }

        .tool-item:hover {
            background: var(--surface-hover);
            border-color: var(--border);
        }

        .tool-item.active {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }

        .tool-icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 0.75rem;
            background: var(--surface);
            border-radius: 4px;
            padding: 2px;
        }

        .tool-item.active .tool-icon {
            background: rgba(255,255,255,0.2);
        }

        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: var(--background);
        }

        .chat-header {
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .chat-title {
            font-size: 1.125rem;
            font-weight: 500;
        }

        .chat-actions {
            display: flex;
            gap: 0.5rem;
        }

        .btn-icon {
            padding: 0.5rem;
            background: var(--surface-hover);
            border: 1px solid var(--border);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            color: var(--text);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .btn-icon:hover {
            background: var(--primary);
            border-color: var(--primary);
            color: white;
        }

        .chat-messages {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .message {
            max-width: 75%;
            padding: 1.25rem;
            border-radius: 16px;
            animation: slideIn 0.3s ease-out;
            position: relative;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .message.user {
            background: var(--primary);
            color: white;
            align-self: flex-end;
            margin-left: auto;
            border-bottom-right-radius: 4px;
        }

        .message.assistant {
            background: var(--surface);
            border: 1px solid var(--border);
            align-self: flex-start;
            border-bottom-left-radius: 4px;
        }

        .message-header {
            font-size: 0.875rem;
            opacity: 0.8;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }

        .message-content {
            line-height: 1.6;
            white-space: pre-wrap;
        }

        .message-content code {
            background: var(--code-bg);
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 0.875rem;
        }

        .message-content pre {
            background: var(--code-bg);
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            margin: 0.5rem 0;
        }

        .message-content pre code {
            background: none;
            padding: 0;
        }

        .message-tools {
            margin-top: 0.75rem;
            font-size: 0.75rem;
            opacity: 0.7;
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .message-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }

        .btn-small {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            background: var(--surface-hover);
            border: 1px solid var(--border);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            color: var(--text);
        }

        .btn-small:hover {
            background: var(--primary);
            border-color: var(--primary);
            color: white;
        }

        .input-container {
            padding: 1.5rem 2rem;
            background: var(--surface);
            border-top: 1px solid var(--border);
        }

        .input-wrapper {
            display: flex;
            gap: 1rem;
            align-items: flex-end;
        }

        .input-box {
            flex: 1;
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 0.75rem 1rem;
            color: var(--text);
            resize: none;
            min-height: 44px;
            max-height: 120px;
            font-family: inherit;
            font-size: 0.875rem;
            line-height: 1.4;
            transition: all 0.2s;
        }

        .input-box:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 2px rgba(0,122,204,0.2);
        }

        .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
        }

        .btn-primary:hover:not(:disabled) {
            background: #0066cc;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,122,204,0.3);
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .typing-indicator {
            display: none;
            align-items: center;
            gap: 0.5rem;
            padding: 1rem 2rem;
            color: var(--text-secondary);
        }

        .typing-indicator.active {
            display: flex;
        }

        .typing-dots {
            display: flex;
            gap: 0.25rem;
        }

        .typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--text-secondary);
            animation: typing 1.4s infinite;
        }

        .typing-dot:nth-child(2) {
            animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes typing {
            0%, 60%, 100% { opacity: 0.3; }
            30% { opacity: 1; }
        }

        @media (max-width: 768px) {
            .sidebar {
                display: none;
            }
            
            .message {
                max-width: 90%;
            }
            
            .header {
                padding: 1rem;
            }
            
            .chat-messages {
                padding: 1rem;
            }
            
            .input-container {
                padding: 1rem;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="logo">
            <div class="logo-icon">S7</div>
            <span>StressGPT7</span>
        </div>
        <div class="status-bar">
            <div class="status-item">
                <div class="status-indicator"></div>
                <span>AI Engine: Online</span>
            </div>
            <div class="status-item">
                <span>Model: stressgpt7-local</span>
            </div>
            <div class="status-item">
                <span id="sessionInfo">Session: Active</span>
            </div>
        </div>
    </header>

    <main class="main">
        <aside class="sidebar">
            <div class="sidebar-section">
                <div class="sidebar-title">AI Assistant</div>
                <ul class="tool-list">
                    <li class="tool-item active" data-tool="chat">
                        <span class="tool-icon">AI</span>
                        <span>Chat</span>
                    </li>
                    <li class="tool-item" data-tool="code">
                        <span class="tool-icon">CD</span>
                        <span>Code Generation</span>
                    </li>
                </ul>
            </div>

            <div class="sidebar-section">
                <div class="sidebar-title">Languages</div>
                <ul class="tool-list">
                    <li class="tool-item" data-lang="python">
                        <span class="tool-icon">PY</span>
                        <span>Python</span>
                    </li>
                    <li class="tool-item" data-lang="javascript">
                        <span class="tool-icon">JS</span>
                        <span>JavaScript</span>
                    </li>
                </ul>
            </div>
        </aside>

        <div class="chat-container">
            <div class="chat-header">
                <div class="chat-title" id="chatTitle">AI Assistant</div>
                <div class="chat-actions">
                    <button class="btn-icon" id="clearChat" title="Clear Chat">Clear</button>
                </div>
            </div>

            <div class="chat-messages" id="chatMessages">
                <div class="message assistant">
                    <div class="message-header">StressGPT7 Assistant</div>
                    <div class="message-content">
                        Hello! I'm StressGPT7, your advanced AI assistant. I can help you with:

                        <br><br>**Programming Languages:**
                        <br>Python, JavaScript, Java, C, C++, C#, TypeScript

                        <br><br>**Capabilities:**
                        <br>Code generation and analysis
                        <br>Multi-language support
                        <br>Code execution and testing
                        <br>Debugging and optimization
                        <br>Best practices and patterns

                        <br><br>What would you like to work on today?
                    </div>
                    <div class="message-actions">
                        <button class="btn-small" onclick="copyMessage(this)">Copy</button>
                    </div>
                </div>
            </div>

            <div class="typing-indicator" id="typingIndicator">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
                <span>Thinking...</span>
            </div>

            <div class="input-container">
                <div class="input-wrapper">
                    <textarea 
                        id="messageInput" 
                        class="input-box" 
                        placeholder="Type your message here... (Press Enter to send)"
                        rows="1"
                    ></textarea>
                    <div class="input-actions">
                        <button class="btn btn-primary" id="sendBtn">
                            <span>📤</span>
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        class StressGPT7GUI {
            constructor() {
                this.apiBase = window.location.origin + '/api';
                this.sessionId = this.generateSessionId();
                
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.focusInput();
            }

            setupEventListeners() {
                const messageInput = document.getElementById('messageInput');
                const sendBtn = document.getElementById('sendBtn');

                messageInput.addEventListener('input', () => this.autoResizeTextarea(messageInput));
                messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
                sendBtn.addEventListener('click', () => this.sendMessage());

                document.getElementById('clearChat').addEventListener('click', () => this.clearChat());

                this.checkHealth();
            }

            handleKeyDown(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            }

            async sendMessage() {
                const messageInput = document.getElementById('messageInput');
                const message = messageInput.value.trim();
                
                if (!message) return;

                this.addMessage('user', message);
                
                messageInput.value = '';
                this.autoResizeTextarea(messageInput);
                this.showTypingIndicator();

                try {
                    const response = await this.makeAPIRequest('/chat', {
                        message,
                        sessionId: this.sessionId
                    });

                    this.hideTypingIndicator();
                    
                    if (response.response) {
                        this.addMessage('assistant', response.response.content, response.response.type, response.response.metadata);
                    } else {
                        this.addMessage('assistant', 'Sorry, I encountered an error processing your request.', 'error');
                    }
                } catch (error) {
                    this.hideTypingIndicator();
                    this.addMessage('assistant', 'Error: Unable to connect to server. Please check your connection.', 'error');
                }
            }

            addMessage(type, content, messageType = 'text', metadata = null) {
                const messagesContainer = document.getElementById('chatMessages');
                const messageDiv = document.createElement('div');
                messageDiv.className = \`message \${type}\`;
                
                const headerDiv = document.createElement('div');
                headerDiv.className = 'message-header';
                headerDiv.textContent = type === 'user' ? 'You' : 'StressGPT7 Assistant';
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'message-content';
                
                if (messageType === 'code') {
                    contentDiv.innerHTML = this.formatCode(content);
                } else {
                    contentDiv.textContent = content;
                }
                
                messageDiv.appendChild(headerDiv);
                messageDiv.appendChild(contentDiv);

                if (metadata) {
                    const toolsDiv = document.createElement('div');
                    toolsDiv.className = 'message-tools';
                    
                    let metadataText = '';
                    if (metadata.language) metadataText += \`Language: \${metadata.language}\`;
                    if (metadata.confidence) metadataText += \` | Confidence: \${(metadata.confidence * 100).toFixed(1)}%\`;
                    
                    toolsDiv.textContent = metadataText;
                    messageDiv.appendChild(toolsDiv);
                }

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'message-actions';
                actionsDiv.innerHTML = \`
                    <button class="btn-small" onclick="copyMessage(this)">Copy</button>
                \`;
                messageDiv.appendChild(actionsDiv);
                
                messagesContainer.appendChild(messageDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

            formatCode(code) {
                return code.replace(/\`\`\`(\w+)?\\n([\\s\\S]*?)\\\`\`/g, (match, lang, code) => {
                    return \`<pre><code class="language-\${lang || 'text'}">\${code}</code></pre>\`;
                }).replace(/\`([^\`]+)\`/g, '<code>$1</code>');
            }

            showTypingIndicator() {
                document.getElementById('typingIndicator').classList.add('active');
                const messagesContainer = document.getElementById('chatMessages');
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

            hideTypingIndicator() {
                document.getElementById('typingIndicator').classList.remove('active');
            }

            clearChat() {
                if (confirm('Are you sure you want to clear the chat?')) {
                    const messagesContainer = document.getElementById('chatMessages');
                    messagesContainer.innerHTML = \`
                        <div class="message assistant">
                            <div class="message-header">StressGPT7 Assistant</div>
                            <div class="message-content">Chat cleared. How can I help you today?</div>
                        </div>
                    \`;
                }
            }

            async makeAPIRequest(endpoint, data) {
                const response = await fetch(this.apiBase + endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    throw new Error(\`HTTP error! status: \${response.status}\`);
                }

                return await response.json();
            }

            async checkHealth() {
                try {
                    const response = await fetch(this.apiBase + '/health');
                    const health = await response.json();
                    
                    if (health.status === 'healthy') {
                        document.getElementById('sessionInfo').textContent = \`Session: Active (\${this.sessionId.substring(0, 8)}...)\`;
                    } else {
                        document.getElementById('sessionInfo').textContent = 'Session: Limited';
                    }
                } catch (error) {
                    document.getElementById('sessionInfo').textContent = 'Session: Offline';
                }
            }

            autoResizeTextarea(textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
            }

            focusInput() {
                document.getElementById('messageInput').focus();
            }

            generateSessionId() {
                return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            }
        }

        function copyMessage(button) {
            const message = button.closest('.message').querySelector('.message-content').textContent;
            navigator.clipboard.writeText(message).then(() => {
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 2000);
            });
        }

        const app = new StressGPT7GUI();
    </script>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`StressGPT7 server running on port ${PORT}`);
});

export default server;
