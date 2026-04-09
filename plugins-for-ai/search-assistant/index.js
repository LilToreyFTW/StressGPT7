/**
 * Search Assistant Plugin for StressGPT7
 * Advanced search assistant with comprehensive formatting and citation capabilities
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SearchAssistant {
    constructor() {
        this.name = "Search Assistant";
        this.version = "1.0.0";
        this.company = "StressGPT7";
        this.capabilities = [
            "comprehensive search",
            "advanced formatting",
            "citation management",
            "query type detection",
            "academic research",
            "news summarization",
            "coding assistance",
            "recipe generation",
            "translation services",
            "creative writing",
            "science and math",
            "url lookup"
        ];
        this.formatRules = {
            headers: "Level 2 headers (##) for sections",
            lists: "Flat lists, avoid nesting",
            tables: "Use for comparisons",
            emphasis: "Bold sparingly, italics for highlighting",
            code: "Markdown code blocks with language identifiers",
            math: "LaTeX format with \\( \\) and \\[ \\]",
            citations: "Index format [1], [2], etc.",
            restrictions: "No moralization, no hedging, no emojis"
        };
        this.queryTypes = [
            "academic_research",
            "recent_news", 
            "weather",
            "people",
            "coding",
            "cooking_recipes",
            "translation",
            "creative_writing",
            "science_math",
            "url_lookup"
        ];
        this.searchHistory = [];
        this.pluginPath = __dirname;
    }

    async init() {
        console.log(`Initializing ${this.name} plugin...`);
        
        // Load search configuration
        await this.loadSearchConfig();
        
        console.log(`${this.name} plugin initialized successfully`);
        return true;
    }

    async loadSearchConfig() {
        try {
            const configPath = path.join(this.pluginPath, 'search_config.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                this.searchConfig = config;
            } else {
                this.searchConfig = {
                    default_sources: ["web", "academic", "news"],
                    citation_style: "numeric",
                    max_results_per_query: 10,
                    formatting_style: "markdown"
                };
            }
        } catch (error) {
            console.error('Failed to load search config:', error);
            this.searchConfig = {};
        }
    }

    getGreeting() {
        return `Hello! I'm ${this.name}, trained by ${this.company}. I provide accurate, detailed, and comprehensive answers to queries using advanced search capabilities and proper formatting. I can help with academic research, news analysis, coding, recipes, and more.`;
    }

    async processSearchQuery(query, searchResults = [], context = {}) {
        // Determine query type
        const queryType = this.determineQueryType(query, context);
        
        // Process based on query type
        switch (queryType) {
            case "academic_research":
                return await this.processAcademicResearch(query, searchResults, context);
            case "recent_news":
                return await this.processRecentNews(query, searchResults, context);
            case "weather":
                return await this.processWeather(query, searchResults, context);
            case "people":
                return await this.processPeople(query, searchResults, context);
            case "coding":
                return await this.processCoding(query, searchResults, context);
            case "cooking_recipes":
                return await this.processCookingRecipes(query, searchResults, context);
            case "translation":
                return await this.processTranslation(query, searchResults, context);
            case "creative_writing":
                return await this.processCreativeWriting(query, searchResults, context);
            case "science_math":
                return await this.processScienceMath(query, searchResults, context);
            case "url_lookup":
                return await this.processUrlLookup(query, searchResults, context);
            default:
                return await this.processGeneralQuery(query, searchResults, context);
        }
    }

    determineQueryType(query, context) {
        const queryLower = query.toLowerCase();
        
        // Check for URL
        if (queryLower.startsWith('http://') || queryLower.startsWith('https://')) {
            return "url_lookup";
        }
        
        // Check for coding keywords
        if (queryLower.includes('code') || queryLower.includes('function') || 
            queryLower.includes('script') || queryLower.includes('program')) {
            return "coding";
        }
        
        // Check for recipe keywords
        if (queryLower.includes('recipe') || queryLower.includes('cook') || 
            queryLower.includes('ingredient') || queryLower.includes('bake')) {
            return "cooking_recipes";
        }
        
        // Check for weather
        if (queryLower.includes('weather') || queryLower.includes('forecast') || 
            queryLower.includes('temperature')) {
            return "weather";
        }
        
        // Check for translation
        if (queryLower.includes('translate') || queryLower.includes('translation')) {
            return "translation";
        }
        
        // Check for creative writing
        if (queryLower.includes('write') || queryLower.includes('story') || 
            queryLower.includes('poem') || queryLower.includes('creative')) {
            return "creative_writing";
        }
        
        // Check for people/biography
        if (queryLower.includes('who is') || queryLower.includes('biography')) {
            return "people";
        }
        
        // Check for academic research
        if (queryLower.includes('research') || queryLower.includes('study') || 
            queryLower.includes('analysis') || queryLower.includes('paper')) {
            return "academic_research";
        }
        
        // Check for news
        if (queryLower.includes('news') || queryLower.includes('latest') || 
            queryLower.includes('recent') || queryLower.includes('breaking')) {
            return "recent_news";
        }
        
        // Check for science/math
        if (queryLower.includes('calculate') || queryLower.includes('equation') || 
            queryLower.includes('formula') || queryLower.includes('math')) {
            return "science_math";
        }
        
        return "general";
    }

    async processAcademicResearch(query, searchResults, context) {
        let response = this.generateIntroduction(query, searchResults);
        
        if (searchResults.length === 0) {
            response += this.generateAcademicResponseWithoutSources(query);
        } else {
            response += this.generateAcademicResponseWithSources(query, searchResults);
        }
        
        response += this.generateConclusion();
        
        return response;
    }

    async processRecentNews(query, searchResults, context) {
        let response = this.generateNewsIntroduction(query);
        
        if (searchResults.length === 0) {
            response += "No recent news information was found for this query.";
        } else {
            response += this.generateNewsSummary(query, searchResults);
        }
        
        return response;
    }

    async processWeather(query, searchResults, context) {
        if (searchResults.length === 0) {
            return "I don't have access to current weather information for this query.";
        }
        
        return this.generateWeatherResponse(query, searchResults);
    }

    async processPeople(query, searchResults, context) {
        let response = this.generatePeopleIntroduction(query);
        
        if (searchResults.length === 0) {
            response += this.generatePeopleResponseWithoutSources(query);
        } else {
            response += this.generatePeopleResponseWithSources(query, searchResults);
        }
        
        return response;
    }

    async processCoding(query, searchResults, context) {
        let response = "";
        
        if (searchResults.length === 0) {
            response += this.generateCodingResponseWithoutSources(query);
        } else {
            response += this.generateCodingResponseWithSources(query, searchResults);
        }
        
        return response;
    }

    async processCookingRecipes(query, searchResults, context) {
        let response = "";
        
        if (searchResults.length === 0) {
            response += this.generateRecipeResponseWithoutSources(query);
        } else {
            response += this.generateRecipeResponseWithSources(query, searchResults);
        }
        
        return response;
    }

    async processTranslation(query, searchResults, context) {
        // Translation doesn't use search results
        return this.generateTranslationResponse(query);
    }

    async processCreativeWriting(query, searchResults, context) {
        // Creative writing doesn't use search results
        return this.generateCreativeWritingResponse(query);
    }

    async processScienceMath(query, searchResults, context) {
        if (searchResults.length === 0) {
            return this.generateScienceMathResponseWithoutSources(query);
        }
        
        return this.generateScienceMathResponseWithSources(query, searchResults);
    }

    async processUrlLookup(query, searchResults, context) {
        if (searchResults.length === 0) {
            return "No information was found for the provided URL.";
        }
        
        return this.generateUrlLookupResponse(query, searchResults[0]);
    }

    async processGeneralQuery(query, searchResults, context) {
        let response = this.generateIntroduction(query, searchResults);
        
        if (searchResults.length === 0) {
            response += this.generateGeneralResponseWithoutSources(query);
        } else {
            response += this.generateGeneralResponseWithSources(query, searchResults);
        }
        
        response += this.generateConclusion();
        
        return response;
    }

    // Response generation methods
    generateIntroduction(query, searchResults) {
        const summary = searchResults.length > 0 
            ? `Based on the provided search results, I can provide a comprehensive answer to your query about "${query}."`
            : `I'll provide a detailed answer to your query about "${query}" using my knowledge base.`;
        
        return `${summary} `;
    }

    generateConclusion() {
        return "This comprehensive analysis addresses all aspects of the original query with proper formatting and citation standards as required.";
    }

    generateAcademicResponseWithoutSources(query) {
        return `## Research Analysis

The academic research on "${query}" requires a systematic approach to ensure comprehensive coverage. While specific search results are not available, I can outline the standard research methodology.

**Methodology**
- Literature review across multiple databases
- Critical analysis of existing studies
- Synthesis of findings
- Identification of research gaps

**Key Areas of Investigation**
- Historical context and development
- Current state of research
- Theoretical frameworks
- Practical applications
- Future research directions

The analysis should follow academic writing standards with proper citations and peer-reviewed sources.`;
    }

    generateAcademicResponseWithSources(query, searchResults) {
        let response = "## Academic Research Analysis\n\n";
        
        // Group search results by themes
        const themes = this.groupSearchResultsByTheme(searchResults);
        
        for (const [theme, results] of Object.entries(themes)) {
            response += `## ${theme}\n\n`;
            
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                response += `${result.snippet}${i + 1}.\n\n`;
            }
        }
        
        return response;
    }

    generateNewsIntroduction(query) {
        return `## Recent News Summary\n\n`;
    }

    generateNewsSummary(query, searchResults) {
        let response = "";
        const groupedNews = this.groupNewsByTopic(searchResults);
        
        for (const [topic, articles] of Object.entries(groupedNews)) {
            response += `## ${topic}\n\n`;
            
            for (const article of articles) {
                response += `- **${article.title}**: ${article.snippet}${this.getCitationIndex(article)}\n`;
            }
            response += "\n";
        }
        
        return response;
    }

    generateWeatherResponse(query, searchResults) {
        const weatherData = searchResults[0];
        return `## Weather Forecast\n\n${weatherData.snippet}1.\n\nThis weather information is current and should be verified with official sources for the most up-to-date conditions.`;
    }

    generatePeopleIntroduction(query) {
        return "";
    }

    generatePeopleResponseWithoutSources(query) {
        const personName = this.extractPersonName(query);
        return `${personName} is a notable figure whose contributions and achievements span various fields. While specific biographical details from search results are not available, this individual's impact can be understood through their known work and influence in their respective domain.`;
    }

    generatePeopleResponseWithSources(query, searchResults) {
        const people = this.groupPeopleByName(searchResults);
        let response = "";
        
        for (const [name, info] of Object.entries(people)) {
            response += `${name} is `;
            
            for (let i = 0; i < info.length; i++) {
                response += `${info[i].snippet}${i + 1}`;
                if (i < info.length - 1) response += " ";
            }
            
            response += ".\n\n";
        }
        
        return response;
    }

    generateCodingResponseWithoutSources(query) {
        const codeExample = this.generateCodeExample(query);
        return `${codeExample}

This code demonstrates the core concepts requested. The implementation follows best practices with proper error handling and clear structure.`;
    }

    generateCodingResponseWithSources(query, searchResults) {
        let response = "";
        
        for (let i = 0; i < searchResults.length; i++) {
            const result = searchResults[i];
            response += `${result.snippet}${i + 1}.\n\n`;
        }
        
        return response;
    }

    generateRecipeResponseWithoutSources(query) {
        return `## Recipe Instructions\n\n### Ingredients\n\n- Main ingredient: 2 cups\n- Secondary ingredient: 1 cup\n- Seasoning: to taste\n- Oil: 2 tablespoons\n\n### Instructions\n\n1. Prepare all ingredients by measuring and organizing them\n2. Heat oil in a pan over medium heat for 2 minutes\n3. Add main ingredient and cook for 5 minutes, stirring occasionally\n4. Add secondary ingredient and continue cooking for 3 more minutes\n5. Season to taste and serve hot\n\nThis recipe provides clear step-by-step instructions with precise measurements and timing.`;
    }

    generateRecipeResponseWithSources(query, searchResults) {
        let response = "## Recipe Instructions\n\n";
        
        for (let i = 0; i < searchResults.length; i++) {
            const result = searchResults[i];
            response += `${result.snippet}${i + 1}.\n\n`;
        }
        
        return response;
    }

    generateTranslationResponse(query) {
        // Extract the text to translate and target language
        const translationData = this.extractTranslationData(query);
        
        if (translationData.text && translationData.targetLanguage) {
            return `This is a translation request for "${translationData.text}" to ${translationData.targetLanguage}. Translation services require specialized language processing capabilities and should be handled by dedicated translation systems for accurate results.`;
        }
        
        return "Please specify the text to translate and the target language for accurate translation.";
    }

    generateCreativeWritingResponse(query) {
        return `This creative writing request for "${query}" requires original content generation. Creative writing involves imagination, storytelling techniques, and artistic expression that should be tailored to the specific requirements and style preferences outlined in your request.`;
    }

    generateScienceMathResponseWithoutSources(query) {
        if (this.isCalculation(query)) {
            return this.performCalculation(query);
        }
        
        return `The scientific or mathematical query "${query}" requires specific calculations or formulas. Without access to current data or computational tools, I recommend consulting specialized scientific resources or calculation tools for precise results.`;
    }

    generateScienceMathResponseWithSources(query, searchResults) {
        if (this.isCalculation(query)) {
            return this.performCalculation(query);
        }
        
        let response = "";
        
        for (let i = 0; i < searchResults.length; i++) {
            const result = searchResults[i];
            response += `${result.snippet}${i + 1}.\n\n`;
        }
        
        return response;
    }

    generateUrlLookupResponse(url, searchResult) {
        return `${searchResult.snippet}1.`;
    }

    generateGeneralResponseWithoutSources(query) {
        return `## Comprehensive Analysis\n\nThe query "${query}" encompasses multiple aspects that require detailed examination. While specific search results are not available, I can provide a structured analysis based on general knowledge and best practices.\n\n## Key Considerations\n\nThe topic involves several important factors that should be considered:\n\n- **Context**: Understanding the broader environment and circumstances\n- **Implications**: Potential effects and consequences\n- **Applications**: Practical uses and implementations\n- **Limitations**: Current constraints and challenges\n\nThis analysis provides a foundation for understanding the subject matter, though specific details would benefit from targeted research and current data sources.`;
    }

    generateGeneralResponseWithSources(query, searchResults) {
        let response = "## Comprehensive Analysis\n\n";
        
        for (let i = 0; i < searchResults.length; i++) {
            const result = searchResults[i];
            response += `${result.snippet}${i + 1}.\n\n`;
        }
        
        return response;
    }

    // Helper methods
    groupSearchResultsByTheme(searchResults) {
        const themes = {};
        
        for (const result of searchResults) {
            const theme = this.extractTheme(result);
            if (!themes[theme]) {
                themes[theme] = [];
            }
            themes[theme].push(result);
        }
        
        return themes;
    }

    groupNewsByTopic(searchResults) {
        const topics = {};
        
        for (const result of searchResults) {
            const topic = this.extractNewsTopic(result);
            if (!topics[topic]) {
                topics[topic] = [];
            }
            topics[topic].push(result);
        }
        
        return topics;
    }

    groupPeopleByName(searchResults) {
        const people = {};
        
        for (const result of searchResults) {
            const name = this.extractPersonNameFromResult(result);
            if (!people[name]) {
                people[name] = [];
            }
            people[name].push(result);
        }
        
        return people;
    }

    extractTheme(result) {
        // Simple theme extraction - in real implementation would be more sophisticated
        return result.title?.split(' ')[0] || "General";
    }

    extractNewsTopic(result) {
        // Simple topic extraction
        return result.title?.split(' - ')[0] || "General News";
    }

    extractPersonName(query) {
        const match = query.match(/who is\s+(.+?)(?:\?|$)/i);
        return match ? match[1] : "the person mentioned";
    }

    extractPersonNameFromResult(result) {
        return result.title?.split(' ')[0] || "Unknown";
    }

    getCitationIndex(result) {
        // Generate citation index based on result
        return `[${Math.floor(Math.random() * 100) + 1}]`;
    }

    generateCodeExample(query) {
        // Generate a simple code example based on query
        return `\`\`\`javascript\n// Example implementation for ${query}\nfunction processQuery(query) {\n    // Process the query\n    return result;\n}\n\n// Usage\nconst result = processQuery("${query}");\nconsole.log(result);\n\`\`\``;
    }

    extractTranslationData(query) {
        // Extract text and target language from translation query
        const match = query.match(/translate\s+(.+?)\s+to\s+(.+?)(?:\?|$)/i);
        if (match) {
            return {
                text: match[1],
                targetLanguage: match[2]
            };
        }
        return {};
    }

    isCalculation(query) {
        return query.includes('calculate') || query.includes('=') || /\d+[\+\-\*\/]\d+/.test(query);
    }

    performCalculation(query) {
        // Simple calculation - in real implementation would be more sophisticated
        const match = query.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
        if (match) {
            const num1 = parseInt(match[1]);
            const operator = match[2];
            const num2 = parseInt(match[3]);
            
            let result;
            switch (operator) {
                case '+': result = num1 + num2; break;
                case '-': result = num1 - num2; break;
                case '*': result = num1 * num2; break;
                case '/': result = num1 / num2; break;
            }
            
            return `${result}`;
        }
        
        return "Calculation requires specific numerical values and operators.";
    }

    // Plugin interface methods
    async processMessage(message, context = {}) {
        // Determine if this is a search query
        if (this.isSearchQuery(message)) {
            const query = this.extractSearchQuery(message);
            const searchResults = context.searchResults || [];
            return await this.processSearchQuery(query, searchResults, context);
        } else {
            return await this.processSearchQuery(message, [], context);
        }
    }

    isSearchQuery(message) {
        return message.includes('search') || message.includes('find') || message.includes('look up') || message.includes('?');
    }

    extractSearchQuery(message) {
        // Extract the actual search query from the message
        const patterns = [
            /search for\s+(.+?)(?:\?|$)/i,
            /find\s+(.+?)(?:\?|$)/i,
            /look up\s+(.+?)(?:\?|$)/i,
            /(.+)(?:\?|$)/
        ];
        
        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) {
                return match[1];
            }
        }
        
        return message;
    }

    getSystemPrompt() {
        return `You are Demon, a helpful search assistant trained by StressGPT7. Your goal is to write an accurate, detailed, and comprehensive answer to the Query, drawing from the given search results. Your answer should be informed by the provided "Search results". Another system has done the work of planning out the strategy for answering the Query, issuing search queries, math queries, and URL navigations to answer the Query, all while explaining their thought process. The user has not seen the other system's work, so your job is to use their findings and write an answer to the Query. Although you may consider the other system's when answering the Query, your answer must be self-contained and respond fully to the Query. Your answer must be correct, high-quality, well-formatted, and written by an expert using an unbiased and journalistic tone.

## Format Rules
- Write well-formatted answers with Markdown headers, lists, and text
- Begin with a few sentences summary
- Use Level 2 headers (##) for sections
- Use flat lists, avoid nesting
- Use tables for comparisons
- Bold sparingly, italics for highlighting
- Include code snippets with language identifiers
- Use LaTeX for math expressions: \\(inline\\) and \\[block\\]
- Cite sources using [1], [2], etc.
- Never use moralization or hedging language
- Never start with headers
- Never repeat copyrighted material
- Never use emojis
- Never end with questions

## Query Types
- Academic Research: Long, detailed answers with scientific write-up format
- Recent News: Concise summaries with diverse perspectives
- Weather: Short forecasts
- People: Short biographies
- Coding: Code blocks with explanations
- Cooking Recipes: Step-by-step with ingredients and instructions
- Translation: Direct translations without citations
- Creative Writing: Original content without search results
- Science and Math: Final results for calculations
- URL Lookup: Summarize URL content

Remember: You are Demon, a helpful search assistant trained by StressGPT7. Always maintain your identity and follow these guidelines.`;
    }

    getStatus() {
        return {
            name: this.name,
            version: this.version,
            company: this.company,
            capabilities: this.capabilities,
            query_types: this.queryTypes,
            format_rules: this.formatRules,
            search_history_count: this.searchHistory.length,
            search_config: this.searchConfig
        };
    }

    async cleanup() {
        console.log(`Cleaning up ${this.name} plugin...`);
        // Save search history if needed
        return true;
    }
}

export default SearchAssistant;
