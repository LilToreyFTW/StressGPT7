/**
 * StressGPT7 Plugin System Main Entry Point
 * Integrates all plugins and provides unified interface
 */

import PluginLoader from './plugin_loader.js';

class StressGPT7PluginSystem {
    constructor() {
        this.name = "StressGPT7 Plugin System";
        this.version = "1.0.0";
        this.loader = new PluginLoader();
        this.plugins = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) {
            return true;
        }

        console.log('Initializing StressGPT7 Plugin System...');
        
        try {
            // Load all plugins
            const loadedPlugins = await this.loader.loadAllPlugins();
            
            // Store plugin references
            for (const plugin of loadedPlugins) {
                this.plugins.set(plugin.name, plugin);
            }
            
            this.initialized = true;
            console.log(`Plugin system initialized with ${loadedPlugins.length} plugins`);
            
            return true;
        } catch (error) {
            console.error('Failed to initialize plugin system:', error);
            return false;
        }
    }

    getPlugin(name) {
        return this.loader.getPlugin(name);
    }

    getAllPlugins() {
        return this.loader.getLoadedPlugins();
    }

    async executeTool(toolName, params = {}) {
        // Try to find the tool in the demon-tools plugin
        const demonTools = this.getPlugin('demon-tools');
        if (demonTools) {
            return await demonTools.executeTool(toolName, params);
        }
        
        return { error: `Tool '${toolName}' not found in any loaded plugin` };
    }

    async processMessage(message, context = {}) {
        // Try to process message through demon-ai-assistant plugin
        const demonAI = this.getPlugin('demon-ai-assistant');
        if (demonAI) {
            return await demonAI.processMessage(message, context);
        }
        
        return `Plugin system response: ${message}`;
    }

    async createProject(projectName, projectPath, projectType = 'web') {
        // Use project-manager plugin
        const projectManager = this.getPlugin('project-manager');
        if (projectManager) {
            return await projectManager.createNewProject(projectName, projectPath, projectType);
        }
        
        return false;
    }

    async openProject(projectPath) {
        // Use project-manager plugin
        const projectManager = this.getPlugin('project-manager');
        if (projectManager) {
            return await projectManager.openProject(projectPath);
        }
        
        return false;
    }

    getSystemStatus() {
        return {
            name: this.name,
            version: this.version,
            initialized: this.initialized,
            loaded_plugins: this.getAllPlugins(),
            plugin_count: this.plugins.size,
            available_tools: this.getAvailableTools(),
            capabilities: this.getCapabilities()
        };
    }

    getAvailableTools() {
        const demonTools = this.getPlugin('demon-tools');
        if (demonTools) {
            return demonTools.getAllTools ? demonTools.getAllTools() : [];
        }
        return [];
    }

    getCapabilities() {
        const capabilities = [];
        
        if (this.getPlugin('demon-ai-assistant')) {
            capabilities.push('ai-assistant', 'chat-interface', 'ai-integration');
        }
        
        if (this.getPlugin('demon-tools')) {
            capabilities.push('development-tools', 'web-search', 'file-operations');
        }
        
        if (this.getPlugin('project-manager')) {
            capabilities.push('project-management', 'file-operations', 'template-generation');
        }
        
        return capabilities;
    }

    async reloadPlugin(name) {
        return await this.loader.reloadPlugin(name);
    }

    async unloadPlugin(name) {
        return await this.loader.unloadPlugin(name);
    }

    async shutdown() {
        console.log('Shutting down StressGPT7 Plugin System...');
        
        // Unload all plugins
        for (const pluginName of this.plugins.keys()) {
            await this.loader.unloadPlugin(pluginName);
        }
        
        this.initialized = false;
        console.log('Plugin system shutdown complete');
        
        return true;
    }
}

export default StressGPT7PluginSystem;
