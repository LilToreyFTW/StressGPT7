/**
 * Project Manager Plugin for StressGPT7
 * Provides project management and file operations capabilities
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProjectManager {
    constructor() {
        this.name = "Project Manager";
        this.version = "1.0.0";
        this.currentProject = null;
        this.recentProjects = [];
        this.pluginPath = __dirname;
    }

    async init() {
        console.log(`Initializing ${this.name} plugin...`);
        
        // Load recent projects
        await this.loadRecentProjects();
        
        console.log(`${this.name} plugin initialized successfully`);
        return true;
    }

    async loadRecentProjects() {
        try {
            const configPath = path.join(this.pluginPath, 'projects.json');
            if (fs.existsSync(configPath)) {
                const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                this.recentProjects = data.recent_projects || [];
            }
        } catch (error) {
            console.error('Failed to load recent projects:', error);
        }
    }

    async saveRecentProjects() {
        try {
            const configPath = path.join(this.pluginPath, 'projects.json');
            const data = {
                recent_projects: this.recentProjects,
                last_updated: new Date().toISOString()
            };
            fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Failed to save recent projects:', error);
        }
    }

    async createNewProject(projectName, projectPath, projectType = 'web') {
        try {
            const fullPath = path.join(projectPath, projectName);
            
            // Create project directory
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
            
            // Create project structure based on type
            await this.createProjectStructure(fullPath, projectType);
            
            // Update current project
            this.currentProject = {
                name: projectName,
                path: fullPath,
                type: projectType,
                created_at: new Date().toISOString()
            };
            
            // Add to recent projects
            const projectInfo = {
                name: projectName,
                path: fullPath,
                type: projectType,
                last_accessed: new Date().toISOString()
            };
            
            this.recentProjects = this.recentProjects.filter(p => p.path !== fullPath);
            this.recentProjects.unshift(projectInfo);
            this.recentProjects = this.recentProjects.slice(0, 10);
            
            await this.saveRecentProjects();
            console.log(`Created new project: ${projectName} at ${fullPath}`);
            return true;
            
        } catch (error) {
            console.error(`Failed to create project: ${error.message}`);
            return false;
        }
    }

    async createProjectStructure(projectPath, projectType) {
        switch (projectType) {
            case 'web':
                await this.createWebProjectStructure(projectPath);
                break;
            case 'python':
                await this.createPythonProjectStructure(projectPath);
                break;
            case 'typescript':
                await this.createTypeScriptProjectStructure(projectPath);
                break;
            default:
                await this.createBasicProjectStructure(projectPath);
        }
    }

    async createWebProjectStructure(projectPath) {
        const directories = ['app', 'components', 'lib', 'hooks', 'types', 'public', 'styles', 'utils'];
        
        for (const dir of directories) {
            fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
        }
        
        // Create basic files
        const files = {
            'package.json': this.getWebPackageJson(),
            'next.config.mjs': this.getNextConfig(),
            'tailwind.config.ts': this.getTailwindConfig(),
            'tsconfig.json': this.getTsConfig(),
            '.gitignore': this.getGitignore(),
            'README.md': this.getReadmeTemplate('web'),
            'app/layout.tsx': this.getLayoutTemplate(),
            'app/page.tsx': this.getPageTemplate()
        };
        
        for (const [filePath, content] of Object.entries(files)) {
            fs.writeFileSync(path.join(projectPath, filePath), content);
        }
    }

    async createPythonProjectStructure(projectPath) {
        const directories = ['src', 'tests', 'docs', 'scripts'];
        
        for (const dir of directories) {
            fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
        }
        
        const files = {
            'requirements.txt': this.getPythonRequirements(),
            'pyproject.toml': this.getPyprojectToml(),
            '.gitignore': this.getPythonGitignore(),
            'README.md': this.getReadmeTemplate('python'),
            'src/main.py': this.getPythonMainTemplate(),
            'src/__init__.py': '# Package initialization'
        };
        
        for (const [filePath, content] of Object.entries(files)) {
            fs.writeFileSync(path.join(projectPath, filePath), content);
        }
    }

    async createTypeScriptProjectStructure(projectPath) {
        const directories = ['src', 'dist', 'tests', 'types'];
        
        for (const dir of directories) {
            fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
        }
        
        const files = {
            'package.json': this.getTypeScriptPackageJson(),
            'tsconfig.json': this.getTypeScriptTsConfig(),
            '.gitignore': this.getGitignore(),
            'README.md': this.getReadmeTemplate('typescript'),
            'src/index.ts': this.getTypeScriptMainTemplate()
        };
        
        for (const [filePath, content] of Object.entries(files)) {
            fs.writeFileSync(path.join(projectPath, filePath), content);
        }
    }

    async createBasicProjectStructure(projectPath) {
        const directories = ['src', 'docs'];
        
        for (const dir of directories) {
            fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
        }
        
        fs.writeFileSync(path.join(projectPath, 'README.md'), this.getReadmeTemplate('basic'));
    }

    async openProject(projectPath) {
        try {
            if (!fs.existsSync(projectPath)) {
                return false;
            }
            
            const projectType = this.detectProjectType(projectPath);
            
            this.currentProject = {
                name: path.basename(projectPath),
                path: projectPath,
                type: projectType,
                opened_at: new Date().toISOString()
            };
            
            // Update recent projects
            const projectInfo = {
                name: path.basename(projectPath),
                path: projectPath,
                type: projectType,
                last_accessed: new Date().toISOString()
            };
            
            this.recentProjects = this.recentProjects.filter(p => p.path !== projectPath);
            this.recentProjects.unshift(projectInfo);
            this.recentProjects = this.recentProjects.slice(0, 10);
            
            await this.saveRecentProjects();
            console.log(`Opened project: ${path.basename(projectPath)}`);
            return true;
            
        } catch (error) {
            console.error(`Failed to open project: ${error.message}`);
            return false;
        }
    }

    detectProjectType(projectPath) {
        if (fs.existsSync(path.join(projectPath, 'package.json'))) {
            const packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
            if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
                return 'web';
            } else if (packageJson.dependencies?.typescript || fs.existsSync(path.join(projectPath, 'tsconfig.json'))) {
                return 'typescript';
            } else {
                return 'node';
            }
        } else if (fs.existsSync(path.join(projectPath, 'requirements.txt')) || fs.existsSync(path.join(projectPath, 'pyproject.toml'))) {
            return 'python';
        } else {
            return 'unknown';
        }
    }

    getProjectFiles(projectPath = null) {
        if (!projectPath && this.currentProject) {
            projectPath = this.currentProject.path;
        }
        
        if (!projectPath || !fs.existsSync(projectPath)) {
            return [];
        }
        
        try {
            const files = [];
            const items = fs.readdirSync(projectPath, { withFileTypes: true });
            
            for (const item of items) {
                if (item.isFile() && !item.name.startsWith('.')) {
                    const fullPath = path.join(projectPath, item.name);
                    const stats = fs.statSync(fullPath);
                    files.push({
                        name: item.name,
                        path: path.relative(projectPath, fullPath),
                        size: stats.size,
                        modified: stats.mtime.toISOString()
                    });
                }
            }
            
            return files.sort((a, b) => a.path.localeCompare(b.path));
            
        } catch (error) {
            console.error(`Failed to get project files: ${error.message}`);
            return [];
        }
    }

    async createFile(filePath, content, projectPath = null) {
        if (!projectPath && this.currentProject) {
            projectPath = this.currentProject.path;
        }
        
        if (!projectPath) {
            return false;
        }
        
        try {
            const fullPath = path.join(projectPath, filePath);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, content);
            console.log(`Created file: ${filePath}`);
            return true;
        } catch (error) {
            console.error(`Failed to create file: ${error.message}`);
            return false;
        }
    }

    readFile(filePath, projectPath = null) {
        if (!projectPath && this.currentProject) {
            projectPath = this.currentProject.path;
        }
        
        if (!projectPath) {
            return null;
        }
        
        try {
            const fullPath = path.join(projectPath, filePath);
            if (fs.existsSync(fullPath)) {
                return fs.readFileSync(fullPath, 'utf8');
            }
            return null;
        } catch (error) {
            console.error(`Failed to read file: ${error.message}`);
            return null;
        }
    }

    async updateFile(filePath, content, projectPath = null) {
        if (!projectPath && this.currentProject) {
            projectPath = this.currentProject.path;
        }
        
        if (!projectPath) {
            return false;
        }
        
        try {
            const fullPath = path.join(projectPath, filePath);
            fs.writeFileSync(fullPath, content);
            console.log(`Updated file: ${filePath}`);
            return true;
        } catch (error) {
            console.error(`Failed to update file: ${error.message}`);
            return false;
        }
    }

    async deleteFile(filePath, projectPath = null) {
        if (!projectPath && this.currentProject) {
            projectPath = this.currentProject.path;
        }
        
        if (!projectPath) {
            return false;
        }
        
        try {
            const fullPath = path.join(projectPath, filePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`Deleted file: ${filePath}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Failed to delete file: ${error.message}`);
            return false;
        }
    }

    getProjectInfo(projectPath = null) {
        if (!projectPath && this.currentProject) {
            projectPath = this.currentProject.path;
        }
        
        if (!projectPath || !fs.existsSync(projectPath)) {
            return {};
        }
        
        try {
            const stats = fs.statSync(projectPath);
            
            const info = {
                name: path.basename(projectPath),
                path: projectPath,
                type: this.detectProjectType(projectPath),
                files_count: this.getProjectFiles(projectPath).length,
                size: this.calculateDirectorySize(projectPath),
                created: stats.birthtime.toISOString()
            };
            
            // Add package.json info if available
            const packageJsonPath = path.join(projectPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                info.dependencies = packageData.dependencies || {};
                info.dev_dependencies = packageData.devDependencies || {};
                info.scripts = packageData.scripts || {};
            }
            
            return info;
            
        } catch (error) {
            console.error(`Failed to get project info: ${error.message}`);
            return {};
        }
    }

    calculateDirectorySize(dirPath) {
        let totalSize = 0;
        
        try {
            const items = fs.readdirSync(dirPath, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item.name);
                
                if (item.isFile()) {
                    totalSize += fs.statSync(fullPath).size;
                } else if (item.isDirectory()) {
                    totalSize += this.calculateDirectorySize(fullPath);
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
        
        return totalSize;
    }

    getStatus() {
        return {
            name: this.name,
            version: this.version,
            current_project: this.currentProject,
            recent_projects_count: this.recentProjects.length,
            recent_projects: this.recentProjects.slice(0, 5)
        };
    }

    async cleanup() {
        console.log(`Cleaning up ${this.name} plugin...`);
        await this.saveRecentProjects();
        return true;
    }

    // Template methods
    getWebPackageJson() {
        return JSON.stringify({
            name: "demon-web-project",
            version: "0.1.0",
            private: true,
            scripts: {
                dev: "next dev",
                build: "next build",
                start: "next start",
                lint: "next lint"
            },
            dependencies: {
                next: "^16.0.0",
                react: "^19.2.0",
                "react-dom": "^19.2.0",
                tailwindcss: "^3.4.0"
            },
            devDependencies: {
                "@types/node": "^22.0.0",
                "@types/react": "^19.0.0",
                "@types/react-dom": "^19.0.0",
                typescript: "^5.6.0",
                eslint: "^9.0.0"
            }
        }, null, 2);
    }

    getNextConfig() {
        return '/** @type {import(\'next\').NextConfig} */\nconst nextConfig = {\n  cacheComponents: true,\n  reactCompiler: true,\n}\n\nexport default nextConfig;';
    }

    getTailwindConfig() {
        return 'import type { Config } from \'tailwindcss\'\n\nconst config: Config = {\n  content: [\n    \'./pages/**/*.{js,ts,jsx,tsx,mdx}\',\n    \'./components/**/*.{js,ts,jsx,tsx,mdx}\',\n    \'./app/**/*.{js,ts,jsx,tsx,mdx}\',\n  ],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n}\n\nexport default config';
    }

    getTsConfig() {
        return JSON.stringify({
            compilerOptions: {
                target: "ES2022",
                lib: ["ES2022"],
                allowJs: true,
                skipLibCheck: true,
                strict: true,
                forceConsistentCasingInFileNames: true,
                noEmit: true,
                esModuleInterop: true,
                module: "ESNext",
                moduleResolution: "bundler",
                resolveJsonModule: true,
                isolatedModules: true,
                jsx: "preserve",
                incremental: true,
                plugins: [{ name: "next" }],
                paths: { "@/*": ["./*"] }
            },
            include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
            exclude: ["node_modules"]
        }, null, 2);
    }

    getGitignore() {
        return `# Dependencies
node_modules/
.pnp
.pnp.js

# Production
build/
dist/
.next/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db`;
    }

    getReadmeTemplate(projectType) {
        return `# ${projectType.charAt(0).toUpperCase() + projectType.slice(1)} Project

Created with Demon AI Assistant

## Getting Started

1. Install dependencies:
   \`\`\`bash
   ${projectType === 'web' || projectType === 'typescript' ? 'npm install' : 'pip install -r requirements.txt'}
   \`\`\`

2. Run the development server:
   \`\`\`bash
   ${projectType === 'web' ? 'npm run dev' : projectType === 'typescript' ? 'npm run dev' : 'python src/main.py'}
   \`\`\`

## Project Structure

This project follows best practices recommended by Demon AI.

## Learn More

- [Demon AI Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs) (for web projects)
`;
    }

    getLayoutTemplate() {
        return 'import type { Metadata } from \'next\'\n\nexport const metadata: Metadata = {\n  title: \'Demon AI Project\',\n  description: \'Created with Demon AI Assistant\',\n}\n\nexport default function RootLayout({\n  children,\n}: {\n  children: React.ReactNode\n}) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  )\n}';
    }

    getPageTemplate() {
        return 'export default function Home() {\n  return (\n    <main>\n      <h1>Welcome to Demon AI Project</h1>\n      <p>This project was created with Demon AI Assistant</p>\n    </main>\n  )\n}';
    }

    getPythonRequirements() {
        return `# Python dependencies
requests>=2.31.0
numpy>=1.24.0
pandas>=2.0.0
python-dotenv>=1.0.0`;
    }

    getPyprojectToml() {
        return `[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "demon-python-project"
version = "0.1.0"
description = "Created with Demon AI Assistant"
requires-python = ">=3.8"

[tool.black]
line-length = 88
target-version = ['py38']

[tool.isort]
profile = "black"`;
    }

    getPythonGitignore() {
        return `# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
venv/
env/
ENV/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db`;
    }

    getPythonMainTemplate() {
        return '#!/usr/bin/env python3\n"""\nMain entry point for Demon AI Python project\n"""\n\ndef main():\n    print("Hello from Demon AI Python project!")\n\nif __name__ == "__main__":\n    main()';
    }

    getTypeScriptPackageJson() {
        return JSON.stringify({
            name: "demon-typescript-project",
            version: "1.0.0",
            description: "Created with Demon AI Assistant",
            main: "dist/index.js",
            scripts: {
                build: "tsc",
                dev: "ts-node src/index.ts",
                start: "node dist/index.js",
                test: "jest"
            },
            devDependencies: {
                "@types/node": "^22.0.0",
                typescript: "^5.6.0",
                "ts-node": "^10.9.0",
                jest: "^29.7.0",
                "@types/jest": "^29.5.0"
            }
        }, null, 2);
    }

    getTypeScriptTsConfig() {
        return JSON.stringify({
            compilerOptions: {
                target: "ES2022",
                module: "commonjs",
                lib: ["ES2022"],
                outDir: "./dist",
                rootDir: "./src",
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                declaration: true,
                declarationMap: true,
                sourceMap: true
            },
            include: ["src/**/*"],
            exclude: ["node_modules", "dist"]
        }, null, 2);
    }

    getTypeScriptMainTemplate() {
        return 'console.log("Hello from Demon AI TypeScript project!");\n\nexport function greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\nif (require.main === module) {\n  console.log(greet("World"));\n}';
    }
}

export default ProjectManager;
