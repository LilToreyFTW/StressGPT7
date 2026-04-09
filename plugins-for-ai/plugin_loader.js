/**
 * StressGPT7 Plugin Loader
 * Manages loading and initialization of plugins
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PluginLoader {
    constructor() {
        this.plugins = new Map();
        this.manifestPath = path.join(__dirname, 'plugin_manifest.json');
        this.pluginDirectory = __dirname;
    }

    async loadManifest() {
        try {
            const manifestData = fs.readFileSync(this.manifestPath, 'utf8');
            return JSON.parse(manifestData);
        } catch (error) {
            console.error('Failed to load plugin manifest:', error);
            return { plugins: [] };
        }
    }

    async loadPlugin(pluginConfig) {
        try {
            const pluginPath = path.join(this.pluginDirectory, pluginConfig.name);
            
            if (!fs.existsSync(pluginPath)) {
                console.warn(`Plugin directory not found: ${pluginPath}`);
                return null;
            }

            const mainPath = path.join(pluginPath, pluginConfig.main);
            if (!fs.existsSync(mainPath)) {
                console.warn(`Plugin main file not found: ${mainPath}`);
                return null;
            }

            // Load plugin
            const pluginModule = await import(`file://${mainPath}`);
            const plugin = pluginModule.default || pluginModule;
            
            // Initialize plugin if it has an init method
            if (typeof plugin.init === 'function') {
                await plugin.init();
            }

            this.plugins.set(pluginConfig.name, {
                config: pluginConfig,
                instance: plugin,
                loaded: true,
                loadTime: new Date().toISOString()
            });

            console.log(`Plugin loaded successfully: ${pluginConfig.name}`);
            return plugin;
        } catch (error) {
            console.error(`Failed to load plugin ${pluginConfig.name}:`, error);
            return null;
        }
    }

    async loadAllPlugins() {
        const manifest = await this.loadManifest();
        const enabledPlugins = manifest.plugins.filter(p => p.enabled);

        console.log(`Loading ${enabledPlugins.length} enabled plugins...`);

        for (const pluginConfig of enabledPlugins) {
            await this.loadPlugin(pluginConfig);
        }

        return this.getLoadedPlugins();
    }

    getLoadedPlugins() {
        return Array.from(this.plugins.entries()).map(([name, plugin]) => ({
            name,
            config: plugin.config,
            loaded: plugin.loaded,
            loadTime: plugin.loadTime
        }));
    }

    getPlugin(name) {
        const plugin = this.plugins.get(name);
        return plugin ? plugin.instance : null;
    }

    async unloadPlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) return false;

        try {
            // Call cleanup if available
            if (typeof plugin.instance.cleanup === 'function') {
                await plugin.instance.cleanup();
            }

            this.plugins.delete(name);
            console.log(`Plugin unloaded: ${name}`);
            return true;
        } catch (error) {
            console.error(`Failed to unload plugin ${name}:`, error);
            return false;
        }
    }

    async reloadPlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) return false;

        const config = plugin.config;
        await this.unloadPlugin(name);
        return await this.loadPlugin(config);
    }
}

export default PluginLoader;
