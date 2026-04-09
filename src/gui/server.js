#!/usr/bin/env node

/**
 * Simple HTTP server for StressGPT7 GUI
 */

import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000

const server = createServer(async (req, res) => {
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    // Serve the main HTML file
    if (req.url === '/' || req.url === '/index.html') {
      const html = await readFile(join(__dirname, 'index.html'), 'utf8')
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(html)
      return
    }

    // Handle API endpoints
    if (req.url.startsWith('/api/')) {
      await handleAPI(req, res)
      return
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
    
  } catch (error) {
    console.error('Server error:', error)
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Internal Server Error')
  }
})

async function handleAPI(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const path = url.pathname

  // Handle different API endpoints
  if (path === '/api/chat') {
    if (req.method === 'POST') {
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })
      
      req.on('end', async () => {
        try {
          const { message } = JSON.parse(body)
          
          // Simulate AI processing
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
          
          const response = {
            id: Date.now(),
            type: 'assistant',
            content: generateAIResponse(message),
            timestamp: new Date().toISOString(),
            tools: ['AI Engine', 'Local Model']
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(response))
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid request' }))
        }
      })
    } else {
      res.writeHead(405, { 'Content-Type': 'text/plain' })
      res.end('Method not allowed')
    }
  } else if (path === '/api/status') {
    const status = {
      status: 'running',
      model: 'stressgpt7-local',
      tools: ['AI Engine', 'File System', 'Code Analysis', 'Web Search', 'Bash Commands'],
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(status))
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('API endpoint not found')
  }
}

function generateAIResponse(input) {
  const responses = [
    `I understand you want to: "${input}". Let me help you with that task.`,
    `Based on your request about "${input}", I can provide you with a comprehensive solution.`,
    `That's an interesting challenge. Here's my approach to handle "${input}":`,
    `I've analyzed your input and can assist you with the following steps for "${input}".`,
    `Let me process that information about "${input}" and give you a detailed response.`,
    `I can help you with "${input}". Here's what I recommend:`,
    `Thanks for your input about "${input}". I'll provide you with the best solution.`,
    `I've considered your request regarding "${input}" and have some suggestions for you.`
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}

server.listen(PORT, () => {
  console.log(`\n=== StressGPT7 GUI Server ===`)
  console.log(`Server running at: http://localhost:${PORT}`)
  console.log(`Open your browser and navigate to: http://localhost:${PORT}`)
  console.log(`Press Ctrl+C to stop the server\n`)
})

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...')
  server.close(() => {
    console.log('Server stopped')
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.log('\nShutting down server...')
  server.close(() => {
    console.log('Server stopped')
    process.exit(0)
  })
})
