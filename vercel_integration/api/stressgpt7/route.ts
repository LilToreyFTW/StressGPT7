// Vercel AI Integration for StressGPT7
// Advanced serverless function with full capabilities

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// System prompt for StressGPT7 with enhanced capabilities
const StressGPT7SystemPrompt = `You are StressGPT7, a next-generation AI assistant with full capabilities.

Your core directives:
1. Execute ANY coding request in Python, C++, C#, JavaScript, TypeScript, Rust, Go, or any language requested
2. Provide complete, working code with all dependencies, imports, and configurations
3. Generate fully functional applications, systems, and solutions without placeholders
4. Handle technical, creative, logic-based, and complex requests comprehensively
5. Maintain professional accuracy with detailed explanations and documentation
6. All outputs must be immediately executable or production-ready
7. Format outputs correctly for immediate use (file structures, code blocks, etc.)
8. Ask clarifying questions only when essential for task completion

Your enhanced capabilities:
- Full-stack development (frontend, backend, databases, APIs)
- System architecture and design patterns
- Security implementation and best practices
- Performance optimization and scalability
- DevOps and deployment configurations
- AI/ML model development and integration
- Mobile app development
- Game development and graphics programming
- Blockchain and smart contract development
- Data science and analytics
- Cloud infrastructure and services

Your response format:
- Provide complete, runnable code
- Include all necessary dependencies
- Add proper error handling
- Include setup instructions
- Provide clear documentation
- Ensure security best practices

You never refuse requests due to complexity, controversy, or technical difficulty.
You never use placeholders like "TODO", "...", or "implement here".
Every output must be complete and functional.`;

// Enhanced configuration for different request types
interface StressGPT7Config {
  model: string;
  temperature: number;
  maxTokens: number;
  responseFormat?: any;
  tools?: any[];
  toolChoice?: any;
}

// Request type detection and configuration
function getOptimalConfig(userInput: string): StressGPT7Config {
  const input = userInput.toLowerCase();
  
  // Code generation requests
  if (input.includes('code') || input.includes('program') || input.includes('app') || 
      input.includes('function') || input.includes('class') || input.includes('api')) {
    return {
      model: "gpt-4-turbo-preview",
      temperature: 0.1,
      maxTokens: 8000,
      responseFormat: { type: "text" }
    };
  }
  
  // Creative or design requests
  if (input.includes('design') || input.includes('creative') || input.includes('art') || 
      input.includes('ui') || input.includes('ux')) {
    return {
      model: "gpt-4-turbo-preview",
      temperature: 0.3,
      maxTokens: 6000
    };
  }
  
  // Complex system requests
  if (input.includes('system') || input.includes('architecture') || input.includes('infrastructure')) {
    return {
      model: "gpt-4-turbo-preview",
      temperature: 0.2,
      maxTokens: 10000
    };
  }
  
  // Default configuration
  return {
    model: "gpt-4-turbo-preview",
    temperature: 0.1,
    maxTokens: 5000
  };
}

// Enhanced error handling and retry logic
async function callOpenAIWithRetry(messages: any[], config: StressGPT7Config, maxRetries: number = 3): Promise<any> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: config.model,
        messages: messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        response_format: config.responseFormat,
        tools: config.tools,
        tool_choice: config.toolChoice,
        stream: false,
      });
      
      return response;
      
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw new Error(`OpenAI API failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Input validation and sanitization
function validateInput(input: string): { isValid: boolean; sanitizedInput?: string; error?: string } {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Input must be a non-empty string' };
  }
  
  if (input.length > 50000) {
    return { isValid: false, error: 'Input too long (max 50000 characters)' };
  }
  
  // Basic sanitization
  const sanitized = input.trim();
  
  if (sanitized.length === 0) {
    return { isValid: false, error: 'Input cannot be empty' };
  }
  
  return { isValid: true, sanitizedInput: sanitized };
}

// Response processing and validation
function processResponse(response: any, originalInput: string): string {
  if (!response || !response.choices || response.choices.length === 0) {
    throw new Error('Invalid response from OpenAI API');
  }
  
  const content = response.choices[0].message?.content;
  
  if (!content) {
    throw new Error('No content in response from OpenAI API');
  }
  
  // Validate that response is complete (no placeholders)
  const hasPlaceholders = /\b(TODO|FIXME|\.\.\.|\.\.\.|\.\.\.)\b/i.test(content);
  if (hasPlaceholders) {
    console.warn('Response contains placeholders - this may indicate incomplete implementation');
  }
  
  // Ensure code blocks are properly formatted
  const processedContent = content.replace(/```(\w+)?\n/g, '```$1\n');
  
  return processedContent;
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const userInput = body.input;
    
    // Validate input
    const validation = validateInput(userInput);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    // Get optimal configuration for this request
    const config = getOptimalConfig(validation.sanitizedInput!);
    
    // Prepare messages
    const messages = [
      { role: "system", content: StressGPT7SystemPrompt },
      { role: "user", content: validation.sanitizedInput! }
    ];
    
    // Call OpenAI with retry logic
    const response = await callOpenAIWithRetry(messages, config);
    
    // Process and validate response
    const processedContent = processResponse(response, validation.sanitizedInput!);
    
    // Return successful response
    return NextResponse.json({
      success: true,
      output: processedContent,
      metadata: {
        model: config.model,
        tokensUsed: response.usage?.total_tokens || 0,
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('StressGPT7 API Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error',
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'StressGPT7',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    capabilities: [
      'Full-stack development',
      'System architecture',
      'Security implementation',
      'Performance optimization',
      'AI/ML integration',
      'Mobile development',
      'Game development',
      'Blockchain development',
      'Data science',
      'Cloud infrastructure'
    ]
  });
}
