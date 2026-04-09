/**
 * Demon AI Assistant Plugin for StressGPT7
 * Provides Vercel-based AI assistant with chat interface and development tools
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DemonAIAssistant {
    constructor() {
        this.name = "Demon AI Assistant";
        this.version = "1.0.0";
        this.company = "Vercel";
        this.capabilities = [
            "AI-powered assistance",
            "Best practices implementation",
            "Next.js development",
            "React components",
            "Database integrations",
            "Authentication systems",
            "Debugging and logging",
            "Project management"
        ];
        this.guidelines = {
            "coding": "Always follows best practices",
            "design": "Mobile-first, semantic HTML, Tailwind CSS",
            "ai_integration": "Uses AI SDK by Vercel",
            "debugging": "Uses console.log with [Demon] prefix",
            "storage": "Prefers database integrations over localStorage"
        };
        this.aiIntegration = null;
        this.toolsRegistry = null;
        this.pluginPath = __dirname;
    }

    async init() {
        console.log(`Initializing ${this.name} plugin...`);
        
        // Initialize AI integration
        await this.initAIIntegration();
        
        // Load tools
        await this.loadTools();
        
        console.log(`${this.name} plugin initialized successfully`);
        return true;
    }

    async initAIIntegration() {
        try {
            // Load AI integration from parent directory
            const aiIntegrationPath = path.join(this.pluginPath, '..', '..', '..', 'ai_integration.py');
            if (fs.existsSync(aiIntegrationPath)) {
                console.log('AI integration module found');
                // In a real implementation, this would interface with Python module
                this.aiIntegration = {
                    available: true,
                    providers: ['openai', 'anthropic', 'vercel'],
                    status: 'ready'
                };
            }
        } catch (error) {
            console.error('Failed to initialize AI integration:', error);
            this.aiIntegration = { available: false, error: error.message };
        }
    }

    async loadTools() {
        try {
            // Load tools registry
            const toolsPath = path.join(this.pluginPath, '..', '..', '..', 'demon_tools.py');
            if (fs.existsSync(toolsPath)) {
                console.log('Demon tools module found');
                this.toolsRegistry = {
                    available: true,
                    tools: [
                        'FetchFromWeb', 'GrepRepo', 'LSRepo', 'ReadFile',
                        'InspectSite', 'SearchWeb', 'TodoManager',
                        'SearchRepo', 'GenerateDesignInspiration', 'GetOrRequestIntegration'
                    ],
                    count: 10
                };
            }
        } catch (error) {
            console.error('Failed to load tools:', error);
            this.toolsRegistry = { available: false, error: error.message };
        }
    }

    getGreeting() {
        return `Hello! I'm ${this.name}, Vercel's highly skilled AI-powered assistant. I always follow best practices and I'm here to help you with your development needs.`;
    }

    async processMessage(message, context = {}) {
        // Process message through Demon AI personality
        const messageLower = message.toLowerCase();
        
        if (message.includes("hello") || message.includes("hi")) {
            return this.getGreeting();
        } else if (message.includes("capabilities") || message.includes("what can you do")) {
            return `I can help you with: ${this.capabilities.join(', ')}. I specialize in building production-ready applications with proper backend integrations.`;
        } else if (message.includes("guidelines") || message.includes("rules")) {
            const guidelinesText = Object.entries(this.guidelines)
                .map(([key, value]) => `- ${key}: ${value}`)
                .join('\n');
            return `My core guidelines:\n${guidelinesText}`;
        } else if (message.includes("debug")) {
            return "I use console.log statements with [Demon] prefix for debugging. For example: console.log('[Demon] User data received:', userData)";
        } else if (message.includes("next.js")) {
            return "I default to Next.js App Router, use semantic HTML, implement proper authentication, and follow React 19.2 best practices with useEffectEvent and Activity components.";
        } else if (message.includes("database")) {
            return "I default to using database integrations (Supabase, Neon, AWS) instead of localStorage. I implement proper security with bcrypt, HTTP-only cookies, and parameterized queries.";
        } else {
            // Use AI integration if available
            if (this.aiIntegration && this.aiIntegration.available) {
                return await this.generateAIResponse(message);
            } else {
                return `I understand you're asking about: ${message}. As Demon, I'm here to help with development tasks following Vercel's best practices. Could you provide more details about what you'd like to build?`;
            }
        }
    }

    async generateAIResponse(message) {
        // Simulate AI response generation
        // In a real implementation, this would call the actual AI integration
        return `[Demon AI Response] I understand your request about "${message}". Based on Vercel's best practices, I recommend following our established patterns for development. Would you like me to help you implement this using Next.js App Router and proper TypeScript configuration?`;
    }

    getSystemPrompt() {
        return `You are Demon, Vercel's highly skilled AI-powered assistant that always follows best practices.

## Core Identity
- Name: Demon
- Company: Vercel
- Role: AI-powered assistant for development tasks
- Version: 1.0.0

## Available Tools
You have access to development tools for repository analysis, web search, project management, and design.

## Key Guidelines
1. Always follow best practices in coding, design, and architecture
2. Default to Next.js App Router for web applications
3. Use semantic HTML and proper accessibility
4. Implement proper authentication with database integrations
5. Never use localStorage for data persistence
6. Use console.log with [Demon] prefix for debugging
7. Follow mobile-first design principles
8. Use Tailwind CSS for styling
9. Implement proper security practices

Remember: You are Demon, Vercel's AI assistant with advanced tools. Always maintain your identity and follow these guidelines.`;
    }

    getStatus() {
        return {
            name: this.name,
            version: this.version,
            ai_integration: this.aiIntegration,
            tools_registry: this.toolsRegistry,
            capabilities: this.capabilities,
            guidelines: this.guidelines
        };
    }

    async cleanup() {
        console.log(`Cleaning up ${this.name} plugin...`);
        // Cleanup resources if needed
        return true;
    }
}

export default DemonAIAssistant;
