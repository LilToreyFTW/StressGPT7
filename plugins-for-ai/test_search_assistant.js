/**
 * Test Search Assistant Plugin
 */

import StressGPT7PluginSystem from './index.js';

async function testSearchAssistant() {
    console.log('Testing Search Assistant Plugin...');
    
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
            
            // Test Search Assistant
            const searchAssistant = pluginSystem.getPlugin('search-assistant');
            if (searchAssistant) {
                console.log('\n=== Testing Search Assistant ===');
                
                // Test greeting
                const greeting = await searchAssistant.processMessage('Hello Search Assistant!');
                console.log(`Greeting: ${greeting.substring(0, 100)}...`);
                
                // Test different query types
                const testQueries = [
                    'What is machine learning?',
                    'Search for latest technology news',
                    'Who is Albert Einstein?',
                    'Write a function to sort an array',
                    'Translate hello to Spanish',
                    'Calculate 5 + 3',
                    'https://example.com'
                ];
                
                console.log('\n=== Testing Different Query Types ===');
                for (const query of testQueries) {
                    console.log(`\nQuery: ${query}`);
                    const response = await searchAssistant.processMessage(query);
                    console.log(`Response: ${response.substring(0, 150)}...`);
                }
                
                // Test with mock search results
                console.log('\n=== Testing with Search Results ===');
                const mockSearchResults = [
                    {
                        title: 'Machine Learning Overview',
                        snippet: 'Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience.',
                        url: 'https://example.com/ml'
                    },
                    {
                        title: 'AI Research Advances',
                        snippet: 'Recent advances in artificial intelligence research have shown significant improvements in natural language processing.',
                        url: 'https://example.com/ai'
                    }
                ];
                
                const responseWithResults = await searchAssistant.processMessage(
                    'What is machine learning?', 
                    mockSearchResults
                );
                console.log(`Response with results: ${responseWithResults.substring(0, 200)}...`);
                
                // Get plugin status
                const pluginStatus = searchAssistant.getStatus();
                console.log(`\nPlugin Status:`);
                console.log(`- Name: ${pluginStatus.name}`);
                console.log(`- Version: ${pluginStatus.version}`);
                console.log(`- Capabilities: ${pluginStatus.capabilities.length}`);
                console.log(`- Query Types: ${pluginStatus.query_types.length}`);
                
            } else {
                console.log('Search Assistant plugin not found');
            }
            
            console.log('\nSearch Assistant plugin test completed successfully!');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await pluginSystem.shutdown();
    }
}

testSearchAssistant();
