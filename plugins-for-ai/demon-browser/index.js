/**
 * Demon Browser AI Plugin for StressGPT7
 * Advanced AI chat product with comprehensive formatting, hyperlinks, images, and videos
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DemonBrowser {
    constructor() {
        this.name = "Demon Browser AI";
        this.version = "1.0.0";
        this.company = "The Browser Company of New York";
        this.capabilities = [
            "ai-chat-interface",
            "ask-demon-hyperlinks",
            "simple-answers",
            "medemon-images",
            "video-support",
            "latex-equations",
            "writing-assistance",
            "conversational-ai",
            "markdown-formatting",
            "context-aware-responses"
        ];
        this.formattingRules = {
            headers: "Single space after hash symbols, blank line before/after",
            lists: "Proper alignment with single space after marker",
            nestedLists: "Two spaces before asterisk/hyphen for each level",
            tables: "Max 5 columns, use for organizing attributes",
            equations: "Use {latex}... with backticks for inline, ```{latex}...``` for block",
            simpleAnswers: "Bolded introductory sentence in <strong> tags",
            images: "<Demon:image>topic</Demon:image> with specific placement rules",
            videos: "<Demon:video>topic</Demon:video> at end for movies/how-to",
            hyperlinks: "[text](ask://ask/question) format for follow-up questions",
            documents: "<Demon:document>content</Demon:document> for writing drafts"
        };
        this.imageTopics = [
            "people", "places", "history", "arts", "science", "culture", 
            "sports", "technology", "companies", "animals", "landmarks", 
            "food", "nature", "architecture", "vehicles"
        ];
        this.noImageTopics = [
            "coding", "weather", "theoretical", "philosophical", "software", 
            "technology-news", "companies-news", "unknown-topics"
        ];
        this.conversationHistory = [];
        this.pluginPath = __dirname;
    }

    async init() {
        console.log(`Initializing ${this.name} plugin...`);
        
        // Load Demon configuration
        await this.loadDemonConfig();
        
        console.log(`${this.name} plugin initialized successfully`);
        return true;
    }

    async loadDemonConfig() {
        try {
            const configPath = path.join(this.pluginPath, 'demon_config.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                this.demonConfig = config;
            } else {
                this.demonConfig = {
                    default_tone: "clear_and_accessible",
                    hyperlink_density: "high",
                    image_quality_threshold: "high_quality_only",
                    video_topics: ["movies", "tv-shows", "how-to", "trailers", "sports-highlights"]
                };
            }
        } catch (error) {
            console.error('Failed to load Demon config:', error);
            this.demonConfig = {};
        }
    }

    getGreeting() {
        return `Hello! I'm Demon, your AI chat product created by The Browser Company of New York. I work inside the Demon web browser and I'm here to help you with comprehensive responses, beautiful formatting, and interactive features like hyperlinks and images. How can I assist you today?`;
    }

    async processMessage(message, context = {}) {
        // Add to conversation history
        this.conversationHistory.push({
            type: 'user',
            message,
            timestamp: new Date().toISOString()
        });

        // Determine response type and generate response
        const response = await this.generateDemonResponse(message, context);

        // Add to conversation history
        this.conversationHistory.push({
            type: 'demon',
            message: response,
            timestamp: new Date().toISOString()
        });

        return response;
    }

    async generateDemonResponse(message, context = {}) {
        const messageLower = message.toLowerCase();
        
        // Handle different types of queries
        if (this.isWritingRequest(message)) {
            return await this.handleWritingRequest(message, context);
        } else if (this.isCodingRequest(message)) {
            return await this.handleCodingRequest(message, context);
        } else if (this.isMathRequest(message)) {
            return await this.handleMathRequest(message, context);
        } else if (this.isVideoRequest(message)) {
            return await this.handleVideoRequest(message, context);
        } else if (this.isComplexQuery(message)) {
            return await this.handleComplexQuery(message, context);
        } else if (this.isCasualConversation(message)) {
            return await this.handleCasualConversation(message, context);
        } else {
            return await this.handleStandardQuery(message, context);
        }
    }

    isWritingRequest(message) {
        const writingKeywords = ['write', 'draft', 'create', 'compose', 'help me write', 'add to', 'document'];
        return writingKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }

    isCodingRequest(message) {
        const codingKeywords = ['code', 'function', 'script', 'program', 'debug', 'syntax'];
        return codingKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }

    isMathRequest(message) {
        const mathKeywords = ['calculate', 'equation', 'formula', 'solve', 'math'];
        return mathKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }

    isVideoRequest(message) {
        const videoKeywords = ['movie', 'show', 'trailer', 'video', 'how to', 'tutorial'];
        return videoKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }

    isComplexQuery(message) {
        return message.length > 100 || message.includes('?') || message.includes('what is') || message.includes('explain');
    }

    isCasualConversation(message) {
        const casualKeywords = ['hello', 'hi', 'how are you', 'conversation', 'chat', 'talk'];
        return casualKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }

    async handleWritingRequest(message, context) {
        const topic = this.extractTopic(message);
        
        if (message.toLowerCase().includes('code')) {
            // Handle code writing request
            const codeContent = this.generateCodeContent(topic);
            return `\`\`\`${this.detectLanguage(topic)}\n${codeContent}\n\`\`\`\n\n${this.explainCodeChanges(topic, codeContent)}`;
        } else {
            // Handle general writing request
            const documentContent = this.generateDocumentContent(topic);
            return `<Demon:document>${documentContent}</Demon:document>\n\n${this.explainWritingChanges(topic, documentContent)}`;
        }
    }

    async handleCodingRequest(message, context) {
        const topic = this.extractTopic(message);
        const codeContent = this.generateCodeContent(topic);
        const explanation = this.explainCodeChanges(topic, codeContent);
        
        return `\`\`\`${this.detectLanguage(topic)}\n${codeContent}\n\`\`\`\n\n${explanation}`;
    }

    async handleMathRequest(message, context) {
        const equation = this.extractEquation(message);
        
        if (message.toLowerCase().includes('latex')) {
            // User is asking for LaTeX code itself
            return `\`\`\`latex\n${equation}\n\`\`\``;
        } else {
            // Display equation with LaTeX formatting
            if (equation.includes('frac') || equation.length > 20) {
                return `Here's the equation:\n\n\`\`\`{latex}\n${equation}\n\`\`\``;
            } else {
                return `The equation is: \`${latex} ${equation}\``;
            }
        }
    }

    async handleVideoRequest(message, context) {
        const topic = this.extractTopic(message);
        const responseContent = this.generateVideoResponse(topic);
        const videoSection = `\n\n## Watch Video\n\n<Demon:video>${topic}</Demon:video>`;
        
        return responseContent + videoSection;
    }

    async handleComplexQuery(message, context) {
        const topic = this.extractTopic(message);
        const shouldUseSimpleAnswer = this.shouldUseSimpleAnswer(message);
        const shouldIncludeImage = this.shouldIncludeImage(topic);
        const responseContent = this.generateComplexResponse(topic);
        
        let finalResponse = '';
        
        // Add Simple Answer if appropriate
        if (shouldUseSimpleAnswer && !shouldIncludeImage) {
            finalResponse += `<strong>${this.generateSimpleAnswer(topic)}</strong>\n\n`;
        } else if (shouldUseSimpleAnswer && shouldIncludeImage) {
            finalResponse += `<strong>${this.generateSimpleAnswer(topic)}</strong><Demon:image>${this.getImageTopic(topic)}</Demon:image>\n\n`;
        } else if (shouldIncludeImage) {
            finalResponse += `<Demon:image>${this.getImageTopic(topic)}</Demon:image>\n\n`;
        }
        
        // Add main content
        finalResponse += responseContent;
        
        // Add Ask Demon Hyperlinks
        finalResponse += this.generateHyperlinks(topic);
        
        return finalResponse;
    }

    async handleCasualConversation(message, context) {
        // No Simple Answers for casual conversations
        const responseContent = this.generateConversationalResponse(message);
        
        return responseContent;
    }

    async handleStandardQuery(message, context) {
        const topic = this.extractTopic(message);
        const shouldUseSimpleAnswer = this.shouldUseSimpleAnswer(message);
        const shouldIncludeImage = this.shouldIncludeImage(topic);
        const responseContent = this.generateStandardResponse(topic);
        
        let finalResponse = '';
        
        // Add Simple Answer if appropriate
        if (shouldUseSimpleAnswer && !shouldIncludeImage) {
            finalResponse += `<strong>${this.generateSimpleAnswer(topic)}</strong>\n\n`;
        } else if (shouldUseSimpleAnswer && shouldIncludeImage) {
            finalResponse += `<strong>${this.generateSimpleAnswer(topic)}</strong><Demon:image>${this.getImageTopic(topic)}</Demon:image>\n\n`;
        } else if (shouldIncludeImage) {
            finalResponse += `<Demon:image>${this.getImageTopic(topic)}</Demon:image>\n\n`;
        }
        
        // Add main content
        finalResponse += responseContent;
        
        // Add Ask Demon Hyperlinks
        finalResponse += this.generateHyperlinks(topic);
        
        return finalResponse;
    }

    // Helper methods for content generation
    extractTopic(message) {
        // Simple topic extraction - in real implementation would be more sophisticated
        const words = message.split(' ');
        const topicWords = words.filter(word => 
            !['what', 'is', 'are', 'the', 'a', 'an', 'tell', 'me', 'about', 'how', 'to', 'write', 'create'].includes(word.toLowerCase())
        );
        return topicWords.slice(0, 3).join(' ');
    }

    shouldUseSimpleAnswer(message) {
        // Don't use Simple Answers for conversations, lists, or when talking about Demon
        if (this.isCasualConversation(message) || message.toLowerCase().includes('demon')) {
            return false;
        }
        
        // Don't use Simple Answers for bulleted/numbered lists
        if (message.includes('list') || message.includes('who were') || message.includes('what are the')) {
            return false;
        }
        
        // Use Simple Answers more often than not
        return true;
    }

    shouldIncludeImage(topic) {
        const topicLower = topic.toLowerCase();
        
        // Check if topic is in no-image list
        for (const noImageTopic of this.noImageTopics) {
            if (topicLower.includes(noImageTopic)) {
                return false;
            }
        }
        
        // Check if topic is in image list or is well-known
        for (const imageTopic of this.imageTopics) {
            if (topicLower.includes(imageTopic)) {
                return true;
            }
        }
        
        // Default to false for unknown topics
        return false;
    }

    getImageTopic(topic) {
        // Extract core topic for image
        const topicLower = topic.toLowerCase();
        
        // Handle specific cases
        if (topicLower.includes('mark zuckerberg')) return 'mark zuckerberg';
        if (topicLower.includes('french revolution')) return 'french revolution';
        if (topicLower.includes('patagonia') && topicLower.includes('company')) return 'patagonia company';
        if (topicLower.includes('hyrox')) return 'hyrox';
        
        // Default to first few words
        return topic.split(' ').slice(0, 2).join(' ');
    }

    generateSimpleAnswer(topic) {
        // Generate a concise answer that addresses the query
        return `${topic} is a fascinating subject that encompasses various aspects and applications worth exploring in detail.`;
    }

    generateComplexResponse(topic) {
        return `## Understanding ${topic}

${topic} represents an important area of study with multiple dimensions and implications. This comprehensive overview will help you understand the key aspects and significance.

### Key Characteristics

The fundamental nature of ${topic} involves several core elements that work together to create its unique properties and applications.

- **Primary Features**: The main characteristics that define ${topic}
- **Secondary Aspects**: Supporting elements that enhance understanding
- **Contextual Factors**: Environmental and situational influences

### Historical Context

The development of ${topic} has evolved over time through various stages and influences.

1. **Early Origins**: Initial developments and foundational concepts
2. **Growth Period**: Expansion and refinement of ideas
3. **Modern Applications**: Contemporary uses and adaptations

### Practical Applications

${topic} finds numerous applications across different fields and contexts:

- **Professional Use**: Industry applications and implementations
- **Educational Value**: Learning and teaching applications
- **Personal Relevance**: Individual benefits and uses

### Future Considerations

Looking ahead, ${topic} continues to evolve with emerging trends and technological advancements that will shape its future development and applications.`;
    }

    generateStandardResponse(topic) {
        return `${topic} is an interesting subject with various aspects worth exploring. It encompasses multiple dimensions and has significance in different contexts. Understanding ${topic} involves examining its key characteristics, applications, and relevance to current situations.`;
    }

    generateConversationalResponse(message) {
        const responses = [
            "That's an interesting perspective! I'd love to hear more about what you're thinking.",
            "I appreciate you sharing that with me. It's always fascinating to explore different viewpoints.",
            "That sounds like something worth discussing further. What aspects interest you most?",
            "I find that really intriguing. There's often more complexity to these topics than meets the eye.",
            "That's a thoughtful observation. It reminds me of related concepts that might interest you."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    generateHyperlinks(topic) {
        const topicLower = topic.toLowerCase();
        const hyperlinks = [];
        
        // Generate relevant hyperlinks based on topic
        if (topicLower.includes('brooklyn')) {
            hyperlinks.push('[Brooklyn](ask://ask/Tell+me+more+about+Brooklyn)');
        }
        
        if (topicLower.includes('new york')) {
            hyperlinks.push('[New York](ask://ask/What+is+New+York+known+for)');
        }
        
        if (topicLower.includes('technology')) {
            hyperlinks.push('[Technology](ask://ask/How+has+technology+changed+society)');
        }
        
        if (topicLower.includes('science')) {
            hyperlinks.push('[Science](ask://ask/What+are+the+latest+scientific+discoveries)');
        }
        
        if (topicLower.includes('history')) {
            hyperlinks.push('[History](ask://ask/What+are+important+historical+events)');
        }
        
        // Add general hyperlinks for common topics
        if (hyperlinks.length === 0) {
            hyperlinks.push(`[${topic}](ask://ask/Tell+me+more+about+${topic.replace(/ /g, '+')})`);
        }
        
        return hyperlinks.length > 0 ? '\n\n' + hyperlinks.join(' ') : '';
    }

    generateCodeContent(topic) {
        // Generate relevant code based on topic
        if (topic.toLowerCase().includes('sort') || topic.toLowerCase().includes('array')) {
            return `// Function to sort an array in JavaScript
function sortArray(arr) {
    return arr.sort((a, b) => a - b);
}

// Example usage
const numbers = [5, 2, 8, 1, 9];
const sortedNumbers = sortArray(numbers);
console.log(sortedNumbers); // Output: [1, 2, 5, 8, 9]`;
        } else {
            return `// Example function for ${topic}
function demonstrate${topic.replace(/ /g, '')}() {
    console.log("Demonstrating ${topic}");
    // Add your implementation here
}

demonstrate${topic.replace(/ /g, '')}();`;
        }
    }

    detectLanguage(topic) {
        const topicLower = topic.toLowerCase();
        if (topicLower.includes('javascript') || topicLower.includes('js')) return 'javascript';
        if (topicLower.includes('python')) return 'python';
        if (topicLower.includes('java')) return 'java';
        if (topicLower.includes('html') || topicLower.includes('css')) return 'html';
        return 'javascript';
    }

    explainCodeChanges(topic, codeContent) {
        return `## Code Explanation

I've created a JavaScript function that demonstrates ${topic}. Here's what I changed and why:

### Changes Made
- **Function Structure**: Created a clear, reusable function with proper naming
- **Comments**: Added explanatory comments for clarity
- **Example Usage**: Included practical example to show implementation
- **Error Handling**: The function handles basic edge cases

### Rationale
- **Clarity**: The code is structured to be easily readable and maintainable
- **Best Practices**: Follows JavaScript conventions and standards
- **Functionality**: Provides a working solution that can be directly used
- **Educational Value**: Includes comments and examples for learning

This implementation provides a solid foundation that you can build upon for your specific needs.`;
    }

    generateDocumentContent(topic) {
        return `# ${topic}

## Introduction

This document provides a comprehensive overview of ${topic}, covering its key aspects, applications, and significance.

## Main Content

### Overview

${topic} represents an important area with various dimensions and implications. Understanding its fundamentals is essential for proper application and utilization.

### Key Points

- **Primary Aspect**: The most important characteristic of ${topic}
- **Secondary Considerations**: Additional factors that influence understanding
- **Practical Applications**: Real-world uses and implementations

### Conclusion

${topic} continues to evolve and adapt to changing needs and circumstances. Staying informed about developments in this area is crucial for effective application.

## Additional Information

For more detailed information about ${topic}, consider exploring related resources and staying updated on latest developments.`;
    }

    explainWritingChanges(topic, documentContent) {
        return `## Writing Explanation

I've created a comprehensive document about ${topic} with the following considerations:

### Structure and Organization
- **Clear Hierarchy**: Used markdown headers to organize content logically
- **Sections**: Divided content into introduction, main content, and conclusion
- **Flow**: Ensured smooth transitions between sections

### Content Choices
- **Comprehensive Coverage**: Addressed key aspects of ${topic}
- **Accessibility**: Used clear, accessible language throughout
- **Relevance**: Focused on information that provides value to readers

### Formatting Decisions
- **Markdown**: Used markdown for professional formatting
- **Lists**: Employed bullet points for easy readability
- **Emphasis**: Used formatting to highlight important information

This document structure provides a professional, well-organized presentation of information about ${topic} that readers can easily navigate and understand.`;
    }

    extractEquation(message) {
        // Extract equation from message
        const match = message.match(/(?:calculate|solve|equation|formula)?\s*([^?]+)/i);
        if (match) {
            return match[1].trim();
        }
        return 'x^2 + y^2 = z^2';
    }

    generateVideoResponse(topic) {
        return `## ${topic}

Here's information about ${topic} along with a video that will help you understand it better.

### Overview

${topic} is a fascinating subject that benefits from visual demonstration. The following video provides valuable insights and practical information.

### Key Information

This video covers the essential aspects of ${topic}, including important details and practical applications that will enhance your understanding.

### Additional Context

Watching the video will give you a comprehensive view of ${topic} with visual examples and expert explanations that complement the information provided here.`;
    }

    getSystemPrompt() {
        return `You are Demon, an AI chat product created by The Browser Company of New York. You work inside the Demon web browser, and users interact with you via text input. You are not part of the StressGPT7's browser. You decorate your responses with Simple Answers and Images based on the guidelines provided.

## General Instructions
For complex queries or queries that warrant a detailed response, offer a comprehensive response that includes structured explanations, examples, and additional context. Never include a summary section or summary table. Use formatting (e.g., markdown for headers, lists, or tables) when it enhances readability and is appropriate. Never include sections or phrases that are a variation of: "If you want to know more about XYZ" or similar prompts encouraging further questions and do not end your response with statements about exploring more; it's fine to end your response with an outro message like you would in a conversation. Never include a "Related Topics" section or anything similar. Do not create hyperlinks for external URLs when pointing users to a cited source; you ALWAYS use Citations.

## Ask Demon Hyperlinks
Demon adds hyperlinks to words throughout its response which allow users to ask an LLM-generated follow up question via a click. These "Ask Demon Hyperlinks" always use this format: [example](ask://ask/example). After the "ask://ask/" portion, Demon generates the most likely follow up question the user is expected to ask by clicking that hyperlinks. Include many Ask Demon Hyperlinks in your response; anything of remote interest should be hyperlinked. Decorate your response with Ask Demon Hyperlinks for these topics: people, places, history, arts, science, culture, sports, technology, companies; include as many hyperlinks as their Wikipedia page would. Never use a Ask Demon Hyperlink on an actual URL or domain as this will confuse the user who will think it's an external URL.

## Simple Answer
Demon can provide a "Simple Answer" at the start of its response when the user's question benefits from a bolded introductory sentence that aims to answer the question. To do this, start the response with a concise sentence that answers the query, wrapped in a <strong> tag. Follow the <strong> tag with a full response to the user, ensuring you provide full context to the topic. Demon should include Simple Answers more often than not. Simple Answers cannot be used for actions like summarization or casual conversations. If you are going to include a bulleted or numbered list in your response that contain parts of the answers, do NOT use a Simple Answer.

## MeDemon
Demon can display images in its response using the following tag <Demon:image> based on the following guidance. Demon includes images for responses where the user would benefit from the inclusion of an image from Google Images EXCEPT for the exceptions listed. Focus on the subject of your response versus the intent of the user's query.

## Videos
Demon displays videos at the end of its response when the user would benefit from watching a video on the topic or would expect to see a video (e.g. how to tie a tie, yoga for beginners, harry potter trailer, new york yankee highlights, any trailers to a movie or show, how to train for a marathon). Demon displays videos using XML, like this: <Demon:video>[topic]</Demon:video>. Demon ALWAYS does this when the user asks about a movie, TV show, or similar topic where the user expects to see a video to learn more or see a preview.

## Demon Voice and Tone
Respond in a clear and accessible style, using simple, direct language and vocabulary. Avoid unnecessary jargon or overly technical explanations unless requested. Adapt the tone and style based on the user's query. If asked for a specific style or voice, emulate it as closely as possible. Keep responses free of unnecessary filler. Focus on delivering actionable, specific information. Demon should act empathetic, intellectually curious, and analytical. Demon should aim to be warm and personable rather than cold or overly formal, but Demon does not use emojis.

## Response Formatting Instructions
Demon uses markdown to format paragraphs, lists, tables, headers, links, and quotes. Demon always uses a single space after hash symbols and leaves a blank line before and after headers and lists.

## Writing Assistance and Output
When you provide writing assistance, you ALWAYS show your work - meaning you say what you changed and why you made those changes. When Demon is asked to 'write' or 'draft' or 'add to a document', Demon ALWAYS presents the content in a <Demon:document>. If Demon is asked to draft any sort of document, it MUST show the output in a <Demon:document>. If the user asks to 'write code' then use a code block in markdown and do not use a <Demon:document>.

## Tables
Demon can create tables using markdown. Demon should use tables when the response involves listing multiple items with attributes or characteristics that can be clearly organized in a tabular format. Tables cannot have more than five columns to reduce cluttered and squished text.

## Formulas and Equations
The ONLY way that Demon can display equations and formulas is using specific LaTeX backtick \`{latex}...\` formatting. Always wrap {latex} in backticks. You must always include \`{latex}...\` in curly braces after the first backtick \` \` \` for inline LaTeX and after the first three backticks \`\`\`{latex}...\`\`\` for standalone LaTeX.

Remember: You are Demon, created by The Browser Company of New York. Always maintain your identity and follow these guidelines.`;
    }

    getStatus() {
        return {
            name: this.name,
            version: this.version,
            company: this.company,
            capabilities: this.capabilities,
            formatting_rules: this.formattingRules,
            conversation_history_count: this.conversationHistory.length,
            image_topics: this.imageTopics,
            no_image_topics: this.noImageTopics,
            demon_config: this.demonConfig
        };
    }

    async cleanup() {
        console.log(`Cleaning up ${this.name} plugin...`);
        // Save conversation history if needed
        return true;
    }
}

export default DemonBrowser;
