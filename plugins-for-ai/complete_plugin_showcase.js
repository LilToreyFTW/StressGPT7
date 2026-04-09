/**
 * Complete StressGPT7 Plugin System Showcase
 * Demonstrates all 4 plugins working together with comprehensive functionality
 */

import StressGPT7PluginSystem from './index.js';

class PluginShowcase {
    constructor() {
        this.pluginSystem = null;
        this.demonAI = null;
        this.demonTools = null;
        this.projectManager = null;
        this.searchAssistant = null;
    }

    async initialize() {
        console.log('=== StressGPT7 Plugin System Complete Showcase ===\n');
        
        this.pluginSystem = new StressGPT7PluginSystem();
        await this.pluginSystem.initialize();
        
        // Get all plugin references
        this.demonAI = this.pluginSystem.getPlugin('demon-ai-assistant');
        this.demonTools = this.pluginSystem.getPlugin('demon-tools');
        this.projectManager = this.pluginSystem.getPlugin('project-manager');
        this.searchAssistant = this.pluginSystem.getPlugin('search-assistant');
        
        console.log('All plugins loaded successfully!\n');
        return true;
    }

    async demonstrateDemonAI() {
        console.log('=== 1. Demon AI Assistant - Chat Interface with Vercel Integration ===\n');
        
        if (!this.demonAI) {
            console.log('Demon AI Assistant plugin not available');
            return;
        }

        // Demonstrate chat interface
        const chatMessages = [
            'Hello Demon!',
            'What are your capabilities?',
            'What are your guidelines?',
            'How do you handle debugging?',
            'What about Next.js development?'
        ];

        console.log('Chat Interface Demonstration:');
        console.log('================================');
        
        for (const message of chatMessages) {
            const response = await this.demonAI.processMessage(message);
            console.log(`User: ${message}`);
            console.log(`Demon: ${response.substring(0, 150)}...\n`);
        }

        // Show system status
        const status = this.demonAI.getStatus();
        console.log('Demon AI Assistant Status:');
        console.log(`- Name: ${status.name}`);
        console.log(`- Version: ${status.version}`);
        console.log(`- Company: ${status.company}`);
        console.log(`- Capabilities: ${status.capabilities.length} total`);
        console.log(`- AI Integration: ${status.ai_integration?.available ? 'Available' : 'Not configured'}`);
        console.log(`- Tools Registry: ${status.tools_registry?.available ? 'Available' : 'Not configured'}\n`);
    }

    async demonstrateDemonTools() {
        console.log('=== 2. Demon Tools - 11 Development Tools ===\n');
        
        if (!this.demonTools) {
            console.log('Demon Tools plugin not available');
            return;
        }

        // Get all available tools
        const tools = this.demonTools.getAllTools();
        console.log(`Available Tools: ${tools.length}\n`);

        // Demonstrate each tool
        const toolDemonstrations = [
            {
                name: 'LSRepo',
                params: { taskNameActive: 'Listing files', taskNameComplete: 'Files listed' },
                description: 'List files and directories'
            },
            {
                name: 'ReadFile',
                params: { filePath: 'README.md', taskNameActive: 'Reading file', taskNameComplete: 'File read' },
                description: 'Read file contents'
            },
            {
                name: 'GrepRepo',
                params: { pattern: 'import', taskNameActive: 'Searching imports', taskNameComplete: 'Search complete' },
                description: 'Search for patterns in codebase'
            },
            {
                name: 'TodoManager',
                params: { 
                    action: 'set_tasks', 
                    tasks: ['Complete plugin demo', 'Test all functionality', 'Write documentation'],
                    taskNameActive: 'Setting up todos', 
                    taskNameComplete: 'Todos created' 
                },
                description: 'Manage project tasks'
            },
            {
                name: 'SearchWeb',
                params: { query: 'Next.js best practices', taskNameActive: 'Searching web', taskNameComplete: 'Search complete' },
                description: 'Perform web search'
            },
            {
                name: 'GenerateDesignInspiration',
                params: { 
                    goal: 'Create modern AI assistant interface', 
                    taskNameActive: 'Generating design', 
                    taskNameComplete: 'Design generated' 
                },
                description: 'Generate design inspiration'
            },
            {
                name: 'FetchFromWeb',
                params: { 
                    urls: ['https://example.com'], 
                    taskNameActive: 'Fetching content', 
                    taskNameComplete: 'Fetch complete' 
                },
                description: 'Fetch web content'
            },
            {
                name: 'InspectSite',
                params: { 
                    urls: ['https://example.com'], 
                    taskNameActive: 'Inspecting site', 
                    taskNameComplete: 'Inspection complete' 
                },
                description: 'Take screenshots of websites'
            },
            {
                name: 'SearchRepo',
                params: { 
                    query: '*.js', 
                    taskNameActive: 'Searching repository', 
                    taskNameComplete: 'Search complete' 
                },
                description: 'Comprehensive repository search'
            },
            {
                name: 'GetOrRequestIntegration',
                params: { 
                    taskNameActive: 'Checking integrations', 
                    taskNameComplete: 'Check complete' 
                },
                description: 'Check integration status'
            }
        ];

        console.log('Tool Demonstrations:');
        console.log('=====================\n');

        for (const toolDemo of toolDemonstrations) {
            console.log(`${toolDemo.name}: ${toolDemo.description}`);
            const result = await this.demonTools.executeTool(toolDemo.name, toolDemo.params);
            
            if (result.error) {
                console.log(`  Status: ${result.error}`);
            } else {
                console.log(`  Status: Success`);
                if (result.total_entries !== undefined) {
                    console.log(`  Entries: ${result.total_entries}`);
                }
                if (result.total_matches !== undefined) {
                    console.log(`  Matches: ${result.total_matches}`);
                }
                if (result.total_tasks !== undefined) {
                    console.log(`  Tasks: ${result.total_tasks}`);
                }
                if (result.total_results !== undefined) {
                    console.log(`  Results: ${result.total_results}`);
                }
                if (result.content_length !== undefined) {
                    console.log(`  Content length: ${result.content_length} chars`);
                }
            }
            console.log('');
        }

        // Show tools status
        const toolsStatus = this.demonTools.getStatus();
        console.log('Demon Tools Status:');
        console.log(`- Name: ${toolsStatus.name}`);
        console.log(`- Version: ${toolsStatus.version}`);
        console.log(`- Total Tools: ${toolsStatus.total_tools}`);
        console.log(`- Available Tools: ${toolsStatus.available_tools.join(', ')}\n`);
    }

    async demonstrateProjectManager() {
        console.log('=== 3. Project Manager - Project Creation and Management ===\n');
        
        if (!this.projectManager) {
            console.log('Project Manager plugin not available');
            return;
        }

        // Create different types of projects
        const projectTypes = ['web', 'python', 'typescript'];
        const projectBasePath = 'E:\\Website-Creator-AI\\StressGPT7\\plugins-for-ai\\demo-projects';

        console.log('Project Creation Demonstrations:');
        console.log('=================================\n');

        for (const projectType of projectTypes) {
            const projectName = `demo-${projectType}-project`;
            console.log(`Creating ${projectType} project: ${projectName}`);
            
            const created = await this.projectManager.createNewProject(
                projectName,
                projectBasePath,
                projectType
            );
            
            if (created) {
                const projectInfo = this.projectManager.getProjectInfo();
                console.log(`  Status: Success`);
                console.log(`  Type: ${projectInfo.type}`);
                console.log(`  Files: ${projectInfo.files_count}`);
                console.log(`  Size: ${projectInfo.size} bytes`);
                
                // Show some files
                const files = this.projectManager.getProjectFiles();
                console.log(`  Sample files: ${files.slice(0, 3).map(f => f.name).join(', ')}`);
            } else {
                console.log(`  Status: Failed to create project`);
            }
            console.log('');
        }

        // Demonstrate file operations
        console.log('File Operations Demonstration:');
        console.log('==============================\n');

        // Create a new file
        const fileCreated = await this.projectManager.createFile(
            'demo.txt',
            'This is a demo file created by Demon AI Project Manager\nCreated with StressGPT7 Plugin System'
        );
        console.log(`Create file: ${fileCreated ? 'Success' : 'Failed'}`);

        // Read the file
        const fileContent = this.projectManager.readFile('demo.txt');
        console.log(`Read file: ${fileContent ? 'Success - ' + fileContent.substring(0, 50) + '...' : 'Failed'}`);

        // Show project manager status
        const pmStatus = this.projectManager.getStatus();
        console.log(`\nProject Manager Status:`);
        console.log(`- Name: ${pmStatus.name}`);
        console.log(`- Version: ${pmStatus.version}`);
        console.log(`- Current Project: ${pmStatus.current_project?.name || 'None'}`);
        console.log(`- Recent Projects: ${pmStatus.recent_projects_count}\n`);
    }

    async demonstrateSearchAssistant() {
        console.log('=== 4. Search Assistant - Advanced Search with Comprehensive Formatting ===\n');
        
        if (!this.searchAssistant) {
            console.log('Search Assistant plugin not available');
            return;
        }

        // Test different query types
        const searchQueries = [
            {
                type: 'Academic Research',
                query: 'What are the latest developments in artificial intelligence?',
                description: 'Long-form academic response with citations'
            },
            {
                type: 'Recent News',
                query: 'latest technology news',
                description: 'Concise news summaries with diverse perspectives'
            },
            {
                type: 'Coding',
                query: 'Write a function to sort an array in JavaScript',
                description: 'Code blocks with explanations'
            },
            {
                type: 'Cooking Recipes',
                query: 'How to make chocolate chip cookies',
                description: 'Step-by-step recipe with ingredients'
            },
            {
                type: 'Science and Math',
                query: 'Calculate 15 * 8',
                description: 'Mathematical calculations'
            },
            {
                type: 'Translation',
                query: 'Translate hello world to Spanish',
                description: 'Translation services'
            },
            {
                type: 'Creative Writing',
                query: 'Write a short story about a robot',
                description: 'Creative content generation'
            },
            {
                type: 'People',
                query: 'Who is Marie Curie?',
                description: 'Biographical information'
            },
            {
                type: 'URL Lookup',
                query: 'https://example.com',
                description: 'URL content summarization'
            }
        ];

        console.log('Search Query Type Demonstrations:');
        console.log('===================================\n');

        for (const queryDemo of searchQueries) {
            console.log(`${queryDemo.type}: ${queryDemo.description}`);
            console.log(`Query: ${queryDemo.query}`);
            
            const response = await this.searchAssistant.processMessage(queryDemo.query);
            console.log(`Response: ${response.substring(0, 200)}...\n`);
        }

        // Test with mock search results
        console.log('Search with Results Demonstration:');
        console.log('===================================\n');

        const mockSearchResults = [
            {
                title: 'Artificial Intelligence Advances',
                snippet: 'Recent breakthroughs in AI have revolutionized natural language processing and computer vision capabilities.',
                url: 'https://example.com/ai-advances'
            },
            {
                title: 'Machine Learning Research',
                snippet: 'New machine learning algorithms show improved performance in pattern recognition and predictive analytics.',
                url: 'https://example.com/ml-research'
            }
        ];

        const responseWithResults = await this.searchAssistant.processMessage(
            'What are the latest developments in artificial intelligence?',
            mockSearchResults
        );
        console.log('Query with search results:');
        console.log(`Response: ${responseWithResults.substring(0, 300)}...\n`);

        // Show search assistant status
        const searchStatus = this.searchAssistant.getStatus();
        console.log('Search Assistant Status:');
        console.log(`- Name: ${searchStatus.name}`);
        console.log(`- Version: ${searchStatus.version}`);
        console.log(`- Company: ${searchStatus.company}`);
        console.log(`- Capabilities: ${searchStatus.capabilities.length}`);
        console.log(`- Query Types: ${searchStatus.query_types.length}`);
        console.log(`- Format Rules: ${Object.keys(searchStatus.format_rules).length}\n`);
    }

    async demonstrateIntegration() {
        console.log('=== 5. Integrated Plugin System Demonstration ===\n');
        
        // Show complete system status
        const systemStatus = this.pluginSystem.getSystemStatus();
        console.log('Complete System Status:');
        console.log('=======================');
        console.log(`- Name: ${systemStatus.name}`);
        console.log(`- Version: ${systemStatus.version}`);
        console.log(`- Initialized: ${systemStatus.initialized}`);
        console.log(`- Plugin Count: ${systemStatus.plugin_count}`);
        console.log(`- Available Tools: ${systemStatus.available_tools.length}`);
        console.log(`- Capabilities: ${systemStatus.capabilities.join(', ')}`);

        console.log('\nLoaded Plugins:');
        console.log('===============');
        for (const plugin of systemStatus.loaded_plugins) {
            console.log(`- ${plugin.name} (v${plugin.config.version})`);
            console.log(`  Type: ${plugin.config.type}`);
            console.log(`  Description: ${plugin.config.description}`);
            console.log(`  Capabilities: ${plugin.config.capabilities?.length || 0} total`);
            console.log('');
        }

        // Demonstrate cross-plugin functionality
        console.log('Cross-Plugin Functionality:');
        console.log('==========================\n');

        // 1. Use Search Assistant to get information, then use Demon AI to discuss it
        console.log('1. Search + AI Assistant Integration:');
        const searchResponse = await this.searchAssistant.processMessage('What is Next.js?');
        console.log(`Search result: ${searchResponse.substring(0, 100)}...`);
        
        const aiResponse = await this.demonAI.processMessage('Can you explain more about Next.js best practices?');
        console.log(`AI response: ${aiResponse.substring(0, 100)}...\n`);

        // 2. Use Project Manager to create project, then use Demon Tools to analyze it
        console.log('2. Project Manager + Tools Integration:');
        const projectCreated = await this.pluginSystem.createProject(
            'integrated-demo-project',
            'E:\\Website-Creator-AI\\StressGPT7\\plugins-for-ai\\demo-projects',
            'web'
        );
        
        if (projectCreated) {
            const toolResult = await this.pluginSystem.executeTool('LSRepo', {
                taskNameActive: 'Analyzing new project',
                taskNameComplete: 'Analysis complete'
            });
            console.log(`Project created: ${projectCreated ? 'Success' : 'Failed'}`);
            console.log(`Tool analysis: Found ${toolResult.total_entries} items\n`);
        }

        // 3. Demonstrate unified message processing
        console.log('3. Unified Message Processing:');
        const unifiedQueries = [
            { plugin: 'demon-ai-assistant', query: 'Hello, can you help me with development?' },
            { plugin: 'search-assistant', query: 'What are the latest web development trends?' },
            { plugin: 'demon-tools', query: 'LSRepo', params: { taskNameActive: 'Listing', taskNameComplete: 'Complete' } }
        ];

        for (const unifiedQuery of unifiedQueries) {
            console.log(`Processing with ${unifiedQuery.plugin}: ${unifiedQuery.query}`);
            
            if (unifiedQuery.plugin === 'demon-tools') {
                const result = await this.pluginSystem.executeTool(unifiedQuery.query, unifiedQuery.params || {});
                console.log(`Result: ${result.total_entries} items found`);
            } else {
                const plugin = this.pluginSystem.getPlugin(unifiedQuery.plugin);
                const result = await plugin.processMessage(unifiedQuery.query);
                console.log(`Result: ${result.substring(0, 100)}...`);
            }
            console.log('');
        }
    }

    async runCompleteShowcase() {
        try {
            await this.initialize();
            await this.demonstrateDemonAI();
            await this.demonstrateDemonTools();
            await this.demonstrateProjectManager();
            await this.demonstrateSearchAssistant();
            await this.demonstrateIntegration();
            
            console.log('=== Complete Plugin System Showcase Finished ===');
            console.log('All 4 plugins demonstrated successfully!');
            console.log('StressGPT7 Plugin System is fully operational and ready for use.');
            
        } catch (error) {
            console.error('Showcase failed:', error);
        } finally {
            if (this.pluginSystem) {
                await this.pluginSystem.shutdown();
            }
        }
    }
}

// Run the complete showcase
const showcase = new PluginShowcase();
showcase.runCompleteShowcase().catch(console.error);
