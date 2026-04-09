/**
 * Simple test for StressGPT7 Plugin System
 */

import StressGPT7PluginSystem from './index.js';

async function testPlugins() {
    console.log('Testing StressGPT7 Plugin System...');
    
    const pluginSystem = new StressGPT7PluginSystem();
    
    try {
        // Initialize
        const initialized = await pluginSystem.initialize();
        console.log(`Initialization: ${initialized ? 'SUCCESS' : 'FAILED'}`);
        
        if (initialized) {
            // Get status
            const status = pluginSystem.getSystemStatus();
            console.log(`Loaded plugins: ${status.plugin_count}`);
            console.log(`Available tools: ${status.available_tools.length}`);
            console.log(`Capabilities: ${status.capabilities.join(', ')}`);
            
            // Test Demon AI
            const demonAI = pluginSystem.getPlugin('demon-ai-assistant');
            if (demonAI) {
                const response = await demonAI.processMessage('Hello!');
                console.log(`Demon AI Response: ${response.substring(0, 50)}...`);
            }
            
            // Test a tool
            const toolResult = await pluginSystem.executeTool('LSRepo', {
                taskNameActive: 'Testing',
                taskNameComplete: 'Test complete'
            });
            console.log(`LSRepo Tool: ${toolResult.total_entries} items found`);
            
            console.log('Plugin system test completed successfully!');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await pluginSystem.shutdown();
    }
}

testPlugins();
