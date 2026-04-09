/**
 * Test Demon Browser Plugin
 */

import StressGPT7PluginSystem from './index.js';

async function testDemonBrowser() {
    console.log('Testing Demon Browser Plugin...');
    
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
            
            // Test Demon Browser
            const demonBrowser = pluginSystem.getPlugin('demon-browser');
            if (demonBrowser) {
                console.log('\n=== Testing Demon Browser Plugin ===');
                
                // Test greeting
                const greeting = await demonBrowser.processMessage('Hello Demon!');
                console.log(`Greeting: ${greeting.substring(0, 100)}...`);
                
                // Test different query types
                const testQueries = [
                    'What is machine learning?',
                    'Tell me about Brooklyn',
                    'Write a function to sort an array',
                    'Calculate the equation x^2 + 4x + 4 = 0',
                    'Show me a video about the Incredibles',
                    'Create a document about climate change',
                    'How are you doing today?'
                ];
                
                console.log('\n=== Testing Different Query Types ===');
                for (const query of testQueries) {
                    console.log(`\nQuery: ${query}`);
                    const response = await demonBrowser.processMessage(query);
                    console.log(`Response: ${response.substring(0, 200)}...`);
                }
                
                // Get plugin status
                const pluginStatus = demonBrowser.getStatus();
                console.log(`\nPlugin Status:`);
                console.log(`- Name: ${pluginStatus.name}`);
                console.log(`- Version: ${pluginStatus.version}`);
                console.log(`- Company: ${pluginStatus.company}`);
                console.log(`- Capabilities: ${pluginStatus.capabilities.length}`);
                console.log(`- Image Topics: ${pluginStatus.image_topics.length}`);
                console.log(`- No Image Topics: ${pluginStatus.no_image_topics.length}`);
                
            } else {
                console.log('Demon Browser plugin not found');
            }
            
            console.log('\nDemon Browser plugin test completed successfully!');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await pluginSystem.shutdown();
    }
}

testDemonBrowser();
