/**
 * StressGPT7 Vercel Integration - Client Examples
 * 
 * This file contains various client implementations for calling the StressGPT7 API.
 * Includes JavaScript, Python, and other language examples.
 */

// JavaScript/TypeScript Client Example
class StressGPT7Client {
  constructor(baseUrl = 'https://your-app.vercel.app') {
    this.baseUrl = baseUrl;
  }

  async call(input, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/stressgpt7`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify({ input }),
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  async createWebApp(description) {
    const prompt = `Create a complete web application: ${description}. Include all necessary files, dependencies, and setup instructions.`;
    return this.call(prompt);
  }

  async createMobileApp(description) {
    const prompt = `Create a complete mobile application: ${description}. Include React Native code, backend API, and deployment instructions.`;
    return this.call(prompt);
  }

  async createSystemArchitecture(requirements) {
    const prompt = `Design a complete system architecture: ${requirements}. Include diagrams, component design, and implementation details.`;
    return this.call(prompt);
  }

  async implementSecurity(features) {
    const prompt = `Implement comprehensive security features: ${features}. Include authentication, authorization, and security best practices.`;
    return this.call(prompt);
  }
}

// Usage Example
async function exampleUsage() {
  const client = new StressGPT7Client();

  try {
    // Create a full-stack e-commerce app
    const ecommerceResult = await client.createWebApp(
      'E-commerce platform with React frontend, Node.js backend, MongoDB database, Stripe payments, and admin dashboard'
    );
    console.log('E-commerce app created:', ecommerceResult.output);

    // Create a mobile app
    const mobileResult = await client.createMobileApp(
      'Fitness tracking app with React Native, Firebase backend, social features, and workout analytics'
    );
    console.log('Mobile app created:', mobileResult.output);

    // Design system architecture
    const architectureResult = await client.createSystemArchitecture(
      'Social media platform for 1M+ users with microservices, Kubernetes deployment, and real-time features'
    );
    console.log('System architecture designed:', architectureResult.output);

    // Implement security
    const securityResult = await client.implementSecurity(
      'JWT authentication, OAuth2 integration, rate limiting, input validation, and security monitoring'
    );
    console.log('Security implemented:', securityResult.output);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// React Hook Example
import { useState, useCallback } from 'react';

export function useStressGPT7() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const callStressGPT7 = useCallback(async (input) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const client = new StressGPT7Client();
      const result = await client.call(input);
      setResponse(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { callStressGPT7, loading, error, response };
}

// React Component Example
export function StressGPT7Interface() {
  const { callStressGPT7, loading, error, response } = useStressGPT7();
  const [input, setInput] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      await callStressGPT7(input);
    } catch (err) {
      console.error('Request failed:', err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask StressGPT7 to create anything..."
          className="w-full p-4 border rounded-lg h-32"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Generate'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          Error: {error}
        </div>
      )}

      {response && (
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-bold mb-2">Response:</h3>
          <pre className="whitespace-pre-wrap">{response.output}</pre>
          {response.metadata && (
            <div className="mt-4 text-sm text-gray-600">
              <p>Model: {response.metadata.model}</p>
              <p>Tokens: {response.metadata.tokensUsed}</p>
              <p>Request ID: {response.metadata.requestId}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Node.js Server Example
const express = require('express');
const axios = require('axios');

class StressGPT7Server {
  constructor(apiUrl = 'https://your-app.vercel.app/api/stressgpt7') {
    this.apiUrl = apiUrl;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  setupRoutes() {
    // Proxy endpoint for StressGPT7 API
    this.app.post('/api/generate', async (req, res) => {
      try {
        const { input } = req.body;
        
        if (!input) {
          return res.status(400).json({ error: 'Input is required' });
        }

        const response = await axios.post(this.apiUrl, { input });
        res.json(response.data);
      } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
          error: error.response?.data?.error || 'Internal server error' 
        });
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'StressGPT7 Proxy' });
    });

    // Serve frontend
    this.app.get('/', (req, res) => {
      res.sendFile(__dirname + '/public/index.html');
    });
  }

  start(port = 3001) {
    this.app.listen(port, () => {
      console.log(`StressGPT7 server running on port ${port}`);
    });
  }
}

// Usage
const server = new StressGPT7Server();
server.start();

// WebSocket Example for Real-time Updates
const WebSocket = require('ws');

class StressGPT7WebSocket {
  constructor(apiUrl = 'https://your-app.vercel.app/api/stressgpt7') {
    this.apiUrl = apiUrl;
    this.wss = new WebSocket.Server({ port: 8080 });
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('Client connected');

      ws.on('message', async (message) => {
        try {
          const { input, requestId } = JSON.parse(message);
          
          // Send processing status
          ws.send(JSON.stringify({
            type: 'status',
            requestId,
            status: 'processing'
          }));

          // Call StressGPT7 API
          const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input })
          });

          const data = await response.json();

          // Send result
          ws.send(JSON.stringify({
            type: 'result',
            requestId,
            data
          }));

        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            requestId: JSON.parse(message).requestId,
            error: error.message
          }));
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
  }
}

// Browser Example (vanilla JavaScript)
class BrowserStressGPT7Client {
  constructor(apiUrl = 'https://your-app.vercel.app/api/stressgpt7') {
    this.apiUrl = apiUrl;
  }

  async call(input) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }
}

// Browser usage
const browserClient = new BrowserStressGPT7Client();

document.getElementById('generate-btn').addEventListener('click', async () => {
  const input = document.getElementById('input').value;
  const output = document.getElementById('output');
  
  if (!input.trim()) return;

  try {
    output.textContent = 'Processing...';
    
    const result = await browserClient.call(input);
    
    output.innerHTML = `
      <pre>${result.output}</pre>
      <div class="metadata">
        <small>Model: ${result.metadata.model} | Tokens: ${result.metadata.tokensUsed}</small>
      </div>
    `;
    
  } catch (error) {
    output.innerHTML = `<div class="error">Error: ${error.message}</div>`;
  }
});

// Error Handling and Retry Logic
class RobustStressGPT7Client {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  async callWithRetry(input, retries = this.maxRetries) {
    try {
      const response = await fetch(`${this.baseUrl}/api/stressgpt7`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) return data;
        throw new Error(data.error || 'Request failed');
      }

      if (response.status >= 500 && retries > 0) {
        // Retry on server errors
        await this.delay(this.retryDelay * (this.maxRetries - retries + 1));
        return this.callWithRetry(input, retries - 1);
      }

      throw new Error(`HTTP error! status: ${response.status}`);

    } catch (error) {
      if (retries > 0 && error.name !== 'AbortError') {
        await this.delay(this.retryDelay * (this.maxRetries - retries + 1));
        return this.callWithRetry(input, retries - 1);
      }
      throw error;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    StressGPT7Client,
    StressGPT7Server,
    StressGPT7WebSocket,
    BrowserStressGPT7Client,
    RobustStressGPT7Client,
  };
}

// Example usage for testing
if (typeof window !== 'undefined') {
  // Browser environment
  window.StressGPT7Client = StressGPT7Client;
  window.BrowserStressGPT7Client = BrowserStressGPT7Client;
}
