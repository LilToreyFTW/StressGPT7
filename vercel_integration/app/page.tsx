'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Code, Zap, Shield, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface ApiResponse {
  success: boolean;
  output: string;
  metadata?: {
    model: string;
    tokensUsed: number;
    requestId: string;
    timestamp: string;
  };
  error?: string;
}

export default function StressGPT7Interface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stressgpt7', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: userMessage.content,
        }),
      });
      
      const data: ApiResponse = await response.json();
      
      if (data.success && data.output) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.output,
          timestamp: new Date(),
          metadata: data.metadata,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      const errorResponse: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `**Error:** ${errorMessage}`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const customComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      return !inline ? (
        <div className="relative">
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language}
            PreTag="div"
            className="rounded-lg"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
          <button
            onClick={() => navigator.clipboard.writeText(String(children))}
            className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white text-xs opacity-75 hover:opacity-100 transition-opacity"
          >
            Copy
          </button>
        </div>
      ) : (
        <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">StressGPT7</h1>
          </div>
          <p className="text-gray-300 text-lg">
            Advanced AI Assistant with Full Development Capabilities
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Fast</span>
            </div>
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span>Complete</span>
            </div>
          </div>
        </motion.div>

        {/* Main Interface */}
        <div className="max-w-4xl mx-auto">
          {/* Chat Messages */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 min-h-[400px] max-h-[600px] overflow-y-auto">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="text-gray-400 mb-4">
                  <Cpu className="w-16 h-16 mx-auto mb-4 opacity-50" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Welcome to StressGPT7
                </h3>
                <p className="text-gray-400">
                  Ask me to create anything - complete applications, systems, or solve complex problems.
                </p>
                <div className="mt-6 text-sm text-gray-500">
                  <p>Example requests:</p>
                  <ul className="mt-2 space-y-1">
                    <li> "Create a full-stack e-commerce app with React and Node.js"</li>
                    <li> "Build a secure authentication system with JWT"</li>
                    <li> "Design a microservices architecture for a social media platform"</li>
                    <li> "Write a Python machine learning pipeline for image classification"</li>
                  </ul>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-xl ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-invert max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={customComponents}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                      {message.metadata && (
                        <div className="mt-2 text-xs opacity-75">
                          <p>Model: {message.metadata.model}</p>
                          <p>Tokens: {message.metadata.tokensUsed}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-700 text-white p-4 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>StressGPT7 is thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6">
            <div className="flex gap-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask StressGPT7 to create anything - complete applications, systems, or solve complex problems..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                rows={3}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {isLoading ? 'Processing...' : 'Send'}
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <div className="mt-4 text-xs text-gray-400 text-center">
              <p>StressGPT7 can execute any coding request, create complete applications, and solve complex technical problems.</p>
              <p>All responses are production-ready with no placeholders.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
