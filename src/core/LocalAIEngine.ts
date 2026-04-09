import { createLogger } from '../utils/logger.js'
import type { StressGPT7Config } from '../types/config.js'
import type { StateManager } from './StateManager.js'
import type { ToolManager } from './ToolManager.js'

const logger = createLogger('LocalAIEngine')

interface AIResponse {
  content: string
  reasoning: string
  confidence: number
  tools_used: string[]
}

interface KnowledgeBase {
  patterns: Map<string, string[]>
  templates: Map<string, string>
  solutions: Map<string, string>
  code_patterns: Map<string, string>
}

export class LocalAIEngine {
  private config: StressGPT7Config
  private stateManager: StateManager
  private toolManager: ToolManager
  private knowledgeBase: KnowledgeBase
  private reasoningDepth: number = 3

  constructor(config: StressGPT7Config, stateManager: StateManager, toolManager: ToolManager) {
    this.config = config
    this.stateManager = stateManager
    this.toolManager = toolManager
    this.knowledgeBase = this.initializeKnowledgeBase()
  }

  private initializeKnowledgeBase(): KnowledgeBase {
    return {
      patterns: new Map([
        ['web_app', ['react', 'nodejs', 'express', 'mongodb', 'authentication', 'rest api']],
        ['mobile_app', ['react native', 'firebase', 'authentication', 'offline support', 'push notifications']],
        ['api', ['rest api', 'express', 'validation', 'error handling', 'documentation', 'testing']],
        ['database', ['sql', 'nosql', 'schema design', 'indexing', 'migrations', 'relationships']],
        ['security', ['authentication', 'authorization', 'encryption', 'validation', 'rate limiting', 'audit']],
        ['testing', ['unit tests', 'integration tests', 'e2e tests', 'mocking', 'coverage', 'ci/cd']],
        ['deployment', ['docker', 'kubernetes', 'ci/cd', 'monitoring', 'logging', 'scaling']],
        ['ui', ['react', 'vue', 'angular', 'css', 'tailwind', 'responsive design', 'accessibility']],
        ['python', ['fastapi', 'django', 'pandas', 'numpy', 'machine learning', 'data analysis']],
        ['system_architecture', ['microservices', 'load balancing', 'caching', 'message queues', 'scaling']],
      ]),
      templates: new Map([
        ['react_component', `import React from 'react';

interface Props {
  // Define props here
}

export function ComponentName({}: Props) {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}`],
        ['express_server', `import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes here

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});`],
        ['python_api', `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/items/")
def create_item(item: Item):
    return item`],
        ['dockerfile', `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`],
      ]),
      solutions: new Map([
        ['authentication', `JWT-based authentication with refresh tokens:
- Login endpoint returns access token (15min) and refresh token (7days)
- Access token stored in memory/httpOnly cookie
- Refresh token stored in secure httpOnly cookie
- Middleware validates tokens on protected routes
- Automatic token refresh on access token expiry`],
        ['error_handling', `Comprehensive error handling:
- Custom error classes for different error types
- Global error middleware for consistent responses
- Error logging with context and stack traces
- User-friendly error messages for clients
- Graceful degradation for non-critical errors`],
        ['performance', `Performance optimization strategies:
- Database query optimization with proper indexing
- Caching frequently accessed data (Redis/Memory)
- Implement pagination for large datasets
- Use connection pooling for database connections
- Optimize images and static assets
- Implement lazy loading where appropriate`],
      ]),
      code_patterns: new Map([
        ['async_error_handling', `try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  logger.error('Operation failed:', error);
  throw new CustomError('Operation failed', error);
}`],
        ['validation', `const validateInput = (input: unknown): InputType => {
  const result = inputSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(result.error.message);
  }
  return result.data;
};`],
        ['database_transaction', `const transaction = await db.transaction();
try {
  await operation1(transaction);
  await operation2(transaction);
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}`],
      ]),
    }
  }

  async processQuery(query: string): Promise<AIResponse> {
    logger.info(`Processing query: ${query.substring(0, 100)}...`)
    
    const analysis = this.analyzeQuery(query)
    const reasoning = this.generateReasoning(query, analysis)
    const content = await this.generateResponse(query, analysis, reasoning)
    
    this.stateManager.addMessage({
      type: 'assistant',
      content,
      timestamp: new Date(),
      id: crypto.randomUUID()
    })

    return {
      content,
      reasoning,
      confidence: this.calculateConfidence(analysis),
      tools_used: analysis.requiredTools
    }
  }

  private analyzeQuery(query: string): {
    type: string
    complexity: 'simple' | 'medium' | 'complex'
    domain: string[]
    requiredTools: string[]
    patterns: string[]
  } {
    const queryLower = query.toLowerCase()
    const domains: string[] = []
    const requiredTools: string[] = []
    const patterns: string[] = []

    // Detect domains
    for (const [domain, keywords] of this.knowledgeBase.patterns) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        domains.push(domain)
      }
    }

    // Detect required tools
    if (queryLower.includes('file') || queryLower.includes('read') || queryLower.includes('write')) {
      requiredTools.push('FileSystemTool')
    }
    if (queryLower.includes('run') || queryLower.includes('execute') || queryLower.includes('command')) {
      requiredTools.push('BashTool')
    }
    if (queryLower.includes('search') || queryLower.includes('find') || queryLower.includes('web')) {
      requiredTools.push('WebSearchTool')
    }
    if (queryLower.includes('code') || queryLower.includes('analyze') || queryLower.includes('review')) {
      requiredTools.push('CodeAnalysisTool')
    }

    // Detect patterns
    if (queryLower.includes('create') || queryLower.includes('build') || queryLower.includes('implement')) {
      patterns.push('creation')
    }
    if (queryLower.includes('fix') || queryLower.includes('debug') || queryLower.includes('error')) {
      patterns.push('debugging')
    }
    if (queryLower.includes('optimize') || queryLower.includes('improve') || queryLower.includes('performance')) {
      patterns.push('optimization')
    }

    // Determine complexity
    let complexity: 'simple' | 'medium' | 'complex' = 'simple'
    if (queryLower.length > 200 || domains.length > 2) {
      complexity = 'complex'
    } else if (queryLower.length > 100 || domains.length > 1) {
      complexity = 'medium'
    }

    const type = this.detectRequestType(queryLower, domains)

    return { type, complexity, domain: domains, requiredTools, patterns }
  }

  private detectRequestType(query: string, domains: string[]): string {
    if (domains.includes('web_app')) return 'web_application'
    if (domains.includes('mobile_app')) return 'mobile_application'
    if (domains.includes('api')) return 'api_development'
    if (domains.includes('security')) return 'security_implementation'
    if (domains.includes('testing')) return 'testing_strategy'
    if (domains.includes('deployment')) return 'deployment_setup'
    if (domains.includes('ui')) return 'ui_development'
    if (domains.includes('python')) return 'python_development'
    if (domains.includes('system_architecture')) return 'system_design'
    return 'general_development'
  }

  private generateReasoning(query: string, analysis: any): string {
    const reasoning = [
      `Query Analysis: ${analysis.type} request with ${analysis.complexity} complexity`,
      `Detected domains: ${analysis.domain.join(', ')}`,
      `Required tools: ${analysis.requiredTools.join(', ') || 'none'}`,
      `Patterns: ${analysis.patterns.join(', ') || 'none'}`
    ]

    if (analysis.complexity === 'complex') {
      reasoning.push('Breaking down into smaller components for better handling')
    }

    return reasoning.join('\n')
  }

  private async generateResponse(query: string, analysis: any, reasoning: string): Promise<string> {
    let response = ''

    // Start with appropriate greeting and understanding
    response += this.generateUnderstanding(query, analysis)

    // Add reasoning explanation
    response += `\n\n**Analysis:**\n${reasoning}`

    // Generate main content based on type
    switch (analysis.type) {
      case 'web_application':
        response += await this.generateWebApplication(query, analysis)
        break
      case 'mobile_application':
        response += await this.generateMobileApplication(query, analysis)
        break
      case 'api_development':
        response += await this.generateAPI(query, analysis)
        break
      case 'security_implementation':
        response += await this.generateSecurityImplementation(query, analysis)
        break
      case 'system_design':
        response += await this.generateSystemDesign(query, analysis)
        break
      case 'python_development':
        response += await this.generatePythonSolution(query, analysis)
        break
      default:
        response += await this.generateGeneralSolution(query, analysis)
    }

    // Add best practices and next steps
    response += this.generateBestPractices(analysis)
    response += this.generateNextSteps(analysis)

    return response
  }

  private generateUnderstanding(query: string, analysis: any): string {
    const understanding = `I understand you want to ${this.extractIntent(query)}. `

    if (analysis.domain.length > 0) {
      return understanding + `This involves ${analysis.domain.join(', ')} technologies. `
    }

    return understanding
  }

  private extractIntent(query: string): string {
    const queryLower = query.toLowerCase()
    
    if (queryLower.includes('create') || queryLower.includes('build')) {
      return 'create a new application/system'
    } else if (queryLower.includes('fix') || queryLower.includes('debug')) {
      return 'fix issues in your code'
    } else if (queryLower.includes('optimize') || queryLower.includes('improve')) {
      return 'optimize your existing system'
    } else if (queryLower.includes('implement') || queryLower.includes('add')) {
      return 'implement new features'
    } else {
      return 'work on your development task'
    }
  }

  private async generateWebApplication(query: string, analysis: any): Promise<string> {
    let response = '\n\n## Web Application Solution\n\n'

    // Add React component template
    response += '### Frontend (React)\n\n'
    response += this.knowledgeBase.templates.get('react_component') + '\n\n'

    // Add Express server template
    response += '### Backend (Node.js/Express)\n\n'
    response += this.knowledgeBase.templates.get('express_server') + '\n\n'

    // Add package.json
    response += '### Package.json\n\n'
    response += `{
  "name": "web-app",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "nodemon server.js",
    "client": "cd client && npm start"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^6.0.0",
    "morgan": "^1.10.0"
  }
}\n\n`

    return response
  }

  private async generateMobileApplication(query: string, analysis: any): Promise<string> {
    let response = '\n\n## Mobile Application Solution\n\n'

    response += '### React Native Setup\n\n'
    response += `# App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}\n\n`

    return response
  }

  private async generateAPI(query: string, analysis: any): Promise<string> {
    let response = '\n\n## API Development Solution\n\n'

    response += '### REST API (Node.js/Express)\n\n'
    response += this.knowledgeBase.templates.get('express_server') + '\n\n'

    response += '### API Endpoints\n\n'
    response += `// API Routes
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const item = new Item(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});\n\n`

    return response
  }

  private async generateSecurityImplementation(query: string, analysis: any): Promise<string> {
    let response = '\n\n## Security Implementation\n\n'

    response += this.knowledgeBase.solutions.get('authentication') + '\n\n'

    response += '### Security Middleware\n\n'
    response += `const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);\n\n`

    return response
  }

  private async generateSystemDesign(query: string, analysis: any): Promise<string> {
    let response = '\n\n## System Architecture Design\n\n'

    response += '### Architecture Overview\n\n'
    response += '- **Frontend**: React/Vue.js SPA\n'
    response += '- **Backend**: Microservices with Node.js/Python\n'
    response += '- **Database**: PostgreSQL for relational, Redis for caching\n'
    response += '- **Message Queue**: RabbitMQ/Apache Kafka\n'
    response += '- **Load Balancer**: Nginx\n'
    response += '- **Containerization**: Docker\n'
    response += '- **Orchestration**: Kubernetes\n\n'

    return response
  }

  private async generatePythonSolution(query: string, analysis: any): Promise<string> {
    let response = '\n\n## Python Solution\n\n'

    response += this.knowledgeBase.templates.get('python_api') + '\n\n'

    response += '### Requirements.txt\n\n'
    response += `fastapi==0.104.0
uvicorn==0.24.0
pydantic==2.4.0
sqlalchemy==2.0.0
alembic==1.12.0\n\n`

    return response
  }

  private async generateGeneralSolution(query: string, analysis: any): Promise<string> {
    let response = '\n\n## Solution Approach\n\n'

    response += 'Based on your request, here\'s a comprehensive solution:\n\n'
    response += '1. **Understanding Requirements**: Analyze the specific needs\n'
    response += '2. **Architecture Design**: Choose appropriate patterns and technologies\n'
    response += '3. **Implementation**: Build the solution step by step\n'
    response += '4. **Testing**: Ensure quality and reliability\n'
    response += '5. **Deployment**: Prepare for production\n\n'

    return response
  }

  private generateBestPractices(analysis: any): string {
    let response = '\n\n## Best Practices\n\n'

    const practices = [
      'Use proper error handling and logging',
      'Implement input validation and sanitization',
      'Follow security best practices',
      'Write clean, maintainable code',
      'Add comprehensive tests',
      'Document your code',
      'Use version control effectively',
      'Monitor performance and errors'
    ]

    practices.forEach(practice => {
      response += `- ${practice}\n`
    })

    return response
  }

  private generateNextSteps(analysis: any): string {
    let response = '\n\n## Next Steps\n\n'

    response += '1. **Setup Environment**: Install dependencies and configure tools\n'
    response += '2. **Implement Core Features**: Build the main functionality\n'
    response += '3. **Add Testing**: Write unit and integration tests\n'
    response += '4. **Documentation**: Create comprehensive documentation\n'
    response += '5. **Deployment**: Prepare for production deployment\n'
    response += '6. **Monitoring**: Set up logging and monitoring\n'

    return response
  }

  private calculateConfidence(analysis: any): number {
    let confidence = 0.8 // Base confidence

    // Increase confidence for known patterns
    if (analysis.domain.length > 0) confidence += 0.1
    if (analysis.requiredTools.length > 0) confidence += 0.05
    if (analysis.patterns.length > 0) confidence += 0.05

    return Math.min(confidence, 1.0)
  }

  async executeTool(toolName: string, parameters: any): Promise<any> {
    const tools = await this.toolManager.getAvailableTools()
    if (!tools.includes(toolName)) {
      throw new Error(`Tool ${toolName} not available`)
    }

    return await this.toolManager.executeTool(toolName, parameters)
  }

  async getAvailableTools(): Promise<string[]> {
    return await this.toolManager.getAvailableTools()
  }

  updateKnowledgeBase(newPatterns: Map<string, string[]>, newSolutions: Map<string, string>): void {
    // Update knowledge base with new patterns and solutions
    for (const [key, value] of newPatterns) {
      this.knowledgeBase.patterns.set(key, value)
    }
    for (const [key, value] of newSolutions) {
      this.knowledgeBase.solutions.set(key, value)
    }

    logger.info('Knowledge base updated')
  }
}
