'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CASE_STUDIES } from '@/lib/knowledge-base';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
}

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  gemini:      { label: 'Gemini',      color: 'text-blue-400/70'  },
  openrouter:  { label: 'OpenRouter',  color: 'text-purple-400/70' },
  groq:        { label: 'Groq',        color: 'text-green-400/70'  },
};

interface ApiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const STARTER_QUESTIONS = [
  "How do I grow market share in a saturated category?",
  "When should I invest in brand-building vs performance marketing?",
  "My product keeps getting copied. How do I protect brand equity?",
  "How do I launch into a new market or occasion?",
  "Our brand feels dated. How do other brands successfully reinvent themselves?",
  "How do I create a marketing campaign with a small budget?",
  "What makes a brand character truly iconic and enduring?",
  "How do I expand into new geographies without losing brand identity?",
];

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^(.+)$/, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<[hul])/g, '$1')
    .replace(/(<\/[hul][^>]*>)<\/p>/g, '$1');
}

const RANDOM_STATS = [
  { number: "100", label: "Case Studies" },
  { number: "3,500", label: "Years of Marketing" },
  { number: "35", label: "Year Career Distilled" },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiHistory, setApiHistory] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCase, setActiveCase] = useState<number | null>(null);
  const [showCaseExplorer, setShowCaseExplorer] = useState(false);
  const [filterTheme, setFilterTheme] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (question?: string) => {
    const q = question || input.trim();
    if (!q || isLoading) return;

    const userMessage: Message = { role: 'user', content: q };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiHistory,
          question: q,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, provider: data.provider, model: data.model }]);
      setApiHistory(data.updatedHistory);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I encountered an error. Please check that GEMINI_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY is set in your environment variables.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const filteredCases = CASE_STUDIES.filter(cs => {
    const matchesSearch = searchQuery === '' || 
      cs.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cs.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cs.principle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTheme = filterTheme === '' || cs.theme.includes(filterTheme);
    return matchesSearch && matchesTheme;
  });

  const allThemes = Array.from(new Set(CASE_STUDIES.flatMap(cs => cs.theme))).sort();

  return (
    <div className="min-h-screen bg-ink flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>
      
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold opacity-[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-scarlet opacity-[0.02] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-dim opacity-[0.02] rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gold/10 bg-ink/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo mark */}
              <div className="relative w-10 h-10 flex-shrink-0">
                <div className="absolute inset-0 border border-gold/30 rotate-45 transform" />
                <div className="absolute inset-[3px] border border-gold/20 rotate-[22.5deg] transform" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gold text-xs font-mono font-medium">MO</span>
                </div>
              </div>
              <div>
                <h1 className="text-cream font-display font-semibold text-lg leading-none">
                  Marketing Oracle
                </h1>
                <p className="text-gold/60 text-xs mt-0.5 font-mono tracking-wider uppercase">
                  100 Lessons · Dan White
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Stats */}
              <div className="hidden md:flex items-center gap-6 mr-4">
                {RANDOM_STATS.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-gold font-display font-semibold text-base leading-none">{stat.number}</div>
                    <div className="text-mist/50 text-[10px] mt-0.5 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => setShowCaseExplorer(!showCaseExplorer)}
                className={`flex items-center gap-2 px-4 py-2 text-sm border rounded transition-all duration-200 ${
                  showCaseExplorer 
                    ? 'border-gold/40 bg-gold/10 text-gold' 
                    : 'border-gold/20 text-mist hover:border-gold/40 hover:text-gold'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h8M4 18h8" />
                </svg>
                <span className="hidden sm:inline">Case Studies</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative z-10 overflow-hidden" style={{ height: 'calc(100vh - 73px)' }}>
        
        {/* Case Studies Sidebar */}
        <div className={`${showCaseExplorer ? 'w-80 xl:w-96' : 'w-0'} transition-all duration-300 overflow-hidden flex-shrink-0 border-r border-gold/10 bg-ink-light`}>
          <div className="w-80 xl:w-96 h-full flex flex-col">
            <div className="p-4 border-b border-gold/10">
              <p className="text-gold font-display text-sm mb-3">Explore the 100 Cases</p>
              <input
                type="text"
                placeholder="Search cases..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-ink border border-gold/20 rounded px-3 py-2 text-cream text-sm placeholder-mist/30 focus:border-gold/40 transition-colors"
              />
              <select
                value={filterTheme}
                onChange={e => setFilterTheme(e.target.value)}
                className="w-full mt-2 bg-ink border border-gold/20 rounded px-3 py-2 text-cream text-sm focus:border-gold/40 transition-colors"
              >
                <option value="">All Themes</option>
                {allThemes.map(theme => (
                  <option key={theme} value={theme} className="bg-ink">{theme}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {filteredCases.map(cs => (
                <button
                  key={cs.id}
                  onClick={() => setActiveCase(activeCase === cs.id ? null : cs.id)}
                  className={`w-full text-left p-3 rounded border transition-all duration-150 group ${
                    activeCase === cs.id 
                      ? 'border-gold/40 bg-gold/5' 
                      : 'border-transparent hover:border-gold/10 hover:bg-white/2'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-gold/40 font-mono text-[10px] mt-0.5 flex-shrink-0">
                      {String(cs.id).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <div className="text-cream-dark text-xs font-medium leading-tight group-hover:text-cream transition-colors truncate">
                        {cs.brand}
                      </div>
                      <div className="text-mist/50 text-[10px] mt-0.5 truncate">{cs.principle}</div>
                      
                      {activeCase === cs.id && (
                        <div className="mt-2 pt-2 border-t border-gold/10">
                          <p className="text-mist/70 text-[11px] leading-relaxed mb-2">{cs.keyLesson}</p>
                          {cs.metrics && (
                            <div className="text-gold/60 text-[10px] font-mono">{cs.metrics}</div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubmit(`Tell me more about ${cs.title} and how I can apply the lessons from it.`);
                              setShowCaseExplorer(false);
                            }}
                            className="mt-2 text-[10px] text-gold border border-gold/30 rounded px-2 py-1 hover:bg-gold/10 transition-colors"
                          >
                            Ask Oracle about this →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Messages / Hero */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              /* Hero State */
              <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col items-center text-center">
                
                {/* Ornament */}
                <div className="relative mb-8">
                  <div className="w-20 h-20 border border-gold/20 rotate-45 mx-auto flex items-center justify-center">
                    <div className="w-14 h-14 border border-gold/15 rotate-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <h2 className="font-display text-4xl md:text-5xl font-semibold text-cream mb-4 leading-tight">
                  What marketing challenge<br />
                  <span className="gold-shimmer">can I help you solve?</span>
                </h2>
                
                <p className="text-mist/60 text-base max-w-xl leading-relaxed mb-10">
                  I've absorbed all 100 case studies from Dan White's Marketing Inspiration Book — 
                  from Ancient Egypt to Zoom. Ask me anything about brand strategy, growth, 
                  advertising, or marketing excellence.
                </p>

                {/* Divider */}
                <div className="flex items-center gap-4 w-full max-w-lg mb-8">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gold/20" />
                  <span className="text-gold/30 text-xs font-mono uppercase tracking-widest">Start here</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gold/20" />
                </div>

                {/* Starter Questions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                  {STARTER_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmit(q)}
                      className="group text-left px-4 py-3 border border-gold/15 rounded bg-ink-light hover:border-gold/35 hover:bg-gold/5 transition-all duration-200"
                    >
                      <span className="text-mist/60 text-sm group-hover:text-cream/80 transition-colors leading-snug">
                        {q}
                      </span>
                    </button>
                  ))}
                </div>

              </div>
            ) : (
              /* Messages */
              <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 border border-gold/30 rotate-45 flex items-center justify-center mt-1">
                        <span className="text-gold/70 text-[9px] font-mono -rotate-45">MO</span>
                      </div>
                    )}
                    
                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                      {msg.role === 'user' ? (
                        <div className="bg-ink-light border border-gold/15 rounded-2xl rounded-tr-sm px-4 py-3">
                          <p className="text-cream text-sm leading-relaxed">{msg.content}</p>
                        </div>
                      ) : (
                        <div className="bg-ink-light/50 border border-gold/10 rounded-2xl rounded-tl-sm px-5 py-4">
                          <div 
                            className="prose-oracle text-sm"
                            dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                          />
                          {msg.provider && (
                            <div className="mt-3 pt-2 border-t border-gold/5 flex items-center gap-1.5">
                              <span className="text-mist/20 text-[10px] font-mono">via</span>
                              <span className={`text-[10px] font-mono ${PROVIDER_LABELS[msg.provider]?.color ?? 'text-mist/30'}`}>
                                {PROVIDER_LABELS[msg.provider]?.label ?? msg.provider}
                              </span>
                              {msg.model && (
                                <span className="text-mist/15 text-[10px] font-mono truncate max-w-[160px]">
                                  · {msg.model}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mt-1">
                        <span className="text-gold/60 text-[10px] font-mono">YOU</span>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 border border-gold/30 rotate-45 flex items-center justify-center mt-1">
                      <span className="text-gold/70 text-[9px] font-mono -rotate-45">MO</span>
                    </div>
                    <div className="bg-ink-light/50 border border-gold/10 rounded-2xl rounded-tl-sm px-5 py-4">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 bg-gold/40 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gold/10 bg-ink/90 backdrop-blur-md p-4">
            <div className="max-w-3xl mx-auto">
              {messages.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                  {STARTER_QUESTIONS.slice(0, 3).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmit(q)}
                      className="flex-shrink-0 text-xs text-mist/40 border border-gold/10 rounded-full px-3 py-1 hover:text-mist/70 hover:border-gold/25 transition-all"
                    >
                      {q.length > 40 ? q.substring(0, 40) + '...' : q}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about brand strategy, growth, advertising, or any marketing challenge..."
                    rows={1}
                    className="w-full bg-ink-light border border-gold/20 rounded-xl px-4 py-3 text-cream text-sm placeholder-mist/25 focus:border-gold/40 transition-colors resize-none leading-relaxed"
                    style={{
                      minHeight: '48px',
                      maxHeight: '160px',
                      overflow: 'auto',
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 160) + 'px';
                    }}
                  />
                </div>
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || isLoading}
                  className="flex-shrink-0 w-12 h-12 border border-gold/30 bg-gold/10 hover:bg-gold/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all duration-200 group"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border border-gold/50 border-t-gold rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 text-gold group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <p className="text-mist/25 text-[11px]">
                  ↵ Send · Shift+↵ New line
                </p>
                <p className="text-mist/20 text-[11px] font-mono">
                  Powered by Gemini · {CASE_STUDIES.length} case studies
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
