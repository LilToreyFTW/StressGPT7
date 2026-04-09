/**
 * StressGPT7 Plugin System Demo
 * Demonstrates the complete plugin functionality
 */

import StressGPT7PluginSystem from './index.js';

async function runDemo() {
    console.log('=== StressGPT7 Plugin System Demo ===\n');
    
    // Initialize the plugin system
    const pluginSystem = new StressGPT7PluginSystem();
    
    try {
        // Initialize all plugins
        console.log('1. Initializing plugin system...');
        const initialized = await pluginSystem.initialize();
        
        if (!initialized) {
            console.error('Failed to initialize plugin system');
            return;
        }
        
        console.log('   Plugin system initialized successfully!\n');
        
        // Show system status
        console.log('2. System Status:');
        const status = pluginSystem.getSystemStatus();
        console.log(`   Name: ${status.name}`);
        console.log(`   Version: ${status.version}`);
        console.log(`   Loaded plugins: ${status.plugin_count}`);
        console.log(`   Capabilities: ${status.capabilities.join(', ')}\n`);
        
        // Show loaded plugins
        console.log('3. Loaded Plugins:');
        for (const plugin of status.loaded_plugins) {
            console.log(`   - ${plugin.name} (v${plugin.config.version})`);
            console.log(`     Type: ${plugin.config.type}`);
            console.log(`     Description: ${plugin.config.description}`);
            console.log(`     Capabilities: ${plugin.config.capabilities?.join(', ') || 'N/A'}`);
            console.log('');
        }
        
        // Demonstrate Demon AI Assistant
        console.log('4. Testing Demon AI Assistant:');
        const demonAI = pluginSystem.getPlugin('demon-ai-assistant');
        if (demonAI) {
            const greeting = await demonAI.processMessage('Hello Demon!');
            console.log(`   Greeting: ${greeting.substring(0, 100)}...`);
            
            const capabilities = await demonAI.processMessage('What can you do?');
            console.log(`   Capabilities: ${capabilities.substring(0, 100)}...`);
        }
        console.log('');
        
        // Demonstrate Demon Tools
        console.log('5. Testing Demon Tools:');
        const availableTools = pluginSystem.getAvailableTools();
        console.log(`   Available tools: ${availableTools.length}`);
        
        for (const tool of availableTools.slice(0, 3)) {
            console.log(`   - ${tool.name}: ${tool.description}`);
        }
        
        // Test a few tools
        console.log('\n   Testing LSRepo tool:');
        const lsResult = await pluginSystem.executeTool('LSRepo', {
            taskNameActive: 'Listing files',
            taskNameComplete: 'Files listed'
        });
        console.log(`   Result: Found ${lsResult.total_entries} items`);
        
        console.log('\n   Testing TodoManager tool:');
        const todoResult = await pluginSystem.executeTool('TodoManager', {
            action: 'set_tasks',
            tasks: ['Create demo project', 'Test plugin system', 'Write documentation'],
            taskNameActive: 'Setting up todos',
            taskNameComplete: 'Todos created'
        });
        console.log(`   Result: Created ${todoResult.total_tasks} tasks`);
        
        console.log('\n   Testing GenerateDesignInspiration tool:');
        const designResult = await pluginSystem.executeTool('GenerateDesignInspiration', {
            goal: 'Create a modern AI assistant interface',
            taskNameActive: 'Generating design',
            taskNameComplete: 'Design generated'
        });
        console.log(`   Result: Design brief created with ${Object.keys(designResult.design_brief).length} sections`);
        console.log('');
        
        // Demonstrate Project Manager
        console.log('6. Testing Project Manager:');
        const projectManager = pluginSystem.getPlugin('project-manager');
        if (projectManager) {
            // Create a demo project
            const projectCreated = await pluginSystem.createProject(
                'stressgpt7-demo-project',
                'E:\\Website-Creator-AI\\StressGPT7\\plugins-for-ai\\demo-projects',
                'web'
            );
            
            if (projectCreated) {
                console.log('   Demo project created successfully!');
                
                // Get project info
                const projectInfo = projectManager.getProjectInfo();
                console.log(`   Project type: ${projectInfo.type}`);
                console.log(`   Files count: ${projectInfo.files_count}`);
                console.log(`   Project size: ${projectInfo.size} bytes`);
            }
        }
        console.log('');
        
        // Show final system status
        console.log('7. Final System Status:');
        const finalStatus = pluginSystem.getSystemStatus();
        console.log(`   Total plugins loaded: ${finalStatus.plugin_count}`);
        console.log(`   Available tools: ${finalStatus.available_tools.length}`);
        console.log(`   System capabilities: ${finalStatus.capabilities.length}`);
        console.log('');
        
        console.log('=== Demo Complete ===');
        console.log('StressGPT7 Plugin System is fully operational!');
        console.log('\nFeatures available:');
        console.log('- AI Assistant with Vercel integration');
        console.log('- 11 development tools');
        console.log('- Project management with templates');
        console.log('- Plugin-based architecture');
        console.log('- Extensible system for new plugins');
        
    } catch (error) {
        console.error('Demo failed:', error);
    } finally {
        // Cleanup
        await pluginSystem.shutdown();
    }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
    runDemo().catch(console.error);
}

export { runDemo };
