'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CASE_STUDIES } from '@/lib/knowledge-base';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
}

interface ApiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const PROVIDER_COLORS: Record<string, string> = {
  gemini: '#4285F4',
  openrouter: '#9C5FD6',
  groq: '#22C55E',
};

const STARTER_QUESTIONS = [
  "How do I grow market share in a saturated category?",
  "When should I invest in brand-building vs performance marketing?",
  "My product keeps getting copied. How do I protect brand equity?",
  "How do I launch into a new market or occasion?",
  "Our brand feels dated. How do we reinvent ourselves?",
  "How do I create impact with a small marketing budget?",
  "What makes a brand character truly iconic and enduring?",
  "How do I expand into new geographies without losing brand identity?",
];

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    .replace(/^\d+\. (.+)$/gm, '<li class="md-oli">$1</li>')
    .replace(/^[-•] (.+)$/gm, '<li class="md-li">$1</li>')
    .replace(/(<li class="md-oli">[\s\S]*?<\/li>\n?)+/g, m => `<ol class="md-ol">${m}</ol>`)
    .replace(/(<li class="md-li">[\s\S]*?<\/li>\n?)+/g, m => `<ul class="md-ul">${m}</ul>`)
    .replace(/\n\n/g, '</p><p class="md-p">')
    .replace(/\n/g, '<br />')
    .replace(/^(?!<[houpl])(.+)$/, '<p class="md-p">$1</p>')
    .replace(/<p class="md-p"><\/p>/g, '');
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiHistory, setApiHistory] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [activeCase, setActiveCase] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTheme, setFilterTheme] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSubmit = async (question?: string) => {
    const q = question || input.trim();
    if (!q || isLoading) return;
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '52px';
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiHistory, question: q }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        provider: data.provider,
        model: data.model,
      }]);
      setApiHistory(data.updatedHistory);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const allThemes = Array.from(new Set(CASE_STUDIES.flatMap(c => c.theme))).sort();
  const filteredCases = CASE_STUDIES.filter(cs => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || cs.title.toLowerCase().includes(q) || cs.brand.toLowerCase().includes(q) || cs.principle.toLowerCase().includes(q);
    const matchTheme = !filterTheme || cs.theme.includes(filterTheme);
    return matchSearch && matchTheme;
  });

  const hasMessages = messages.length > 0;

  return (
    <>
      <style>{`
        .md-p { margin: 0 0 0.9em; line-height: 1.75; }
        .md-p:last-child { margin-bottom: 0; }
        .md-h1, .md-h2, .md-h3 { font-family: var(--font-display); color: #E8C96A; margin: 1.2em 0 0.5em; font-weight: 600; }
        .md-h1 { font-size: 1.15em; }
        .md-h2 { font-size: 1.05em; }
        .md-h3 { font-size: 0.97em; }
        .md-h1:first-child, .md-h2:first-child, .md-h3:first-child { margin-top: 0; }
        .md-ul, .md-ol { margin: 0.5em 0 0.9em; padding-left: 0; list-style: none; }
        .md-ul .md-li, .md-ol .md-oli { position: relative; padding: 0.25em 0 0.25em 1.5em; line-height: 1.65; }
        .md-ul .md-li::before { content: '▸'; position: absolute; left: 0; color: #C9A84C; font-size: 0.8em; top: 0.35em; }
        .md-ol { counter-reset: item; }
        .md-ol .md-oli { counter-increment: item; }
        .md-ol .md-oli::before { content: counter(item) '.'; position: absolute; left: 0; color: #C9A84C; font-size: 0.85em; font-weight: 600; top: 0.28em; }
        strong { color: #E8C96A; font-weight: 600; }
        em { color: #A8B5C2; font-style: italic; }
        .chat-scroll { overflow-y: auto; scroll-behavior: smooth; }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.15); border-radius: 2px; }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .typing-dot { animation: typingBounce 1.2s infinite ease-in-out; }
        .typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .typing-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes typingBounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; } 40% { transform: scale(1); opacity: 1; } }
      `}</style>

      <div className="h-screen bg-ink flex flex-col overflow-hidden" style={{ fontFamily: 'var(--font-body)' }}>

        {/* Ambient glows */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-gold opacity-[0.025] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold opacity-[0.015] rounded-full blur-3xl" />
        </div>

        {/* ── Header ── */}
        <header className="relative z-20 flex-shrink-0 border-b border-white/5 bg-ink/95 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 flex-shrink-0">
                <div className="absolute inset-0 border border-gold/40 rotate-45" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gold text-[10px] font-mono font-semibold">MO</span>
                </div>
              </div>
              <div>
                <span className="text-cream font-display font-semibold text-base leading-none">Marketing Oracle</span>
                <span className="text-gold/40 text-[11px] font-mono ml-2">100 cases · Dan White</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasMessages && (
                <button
                  onClick={() => { setMessages([]); setApiHistory([]); }}
                  className="text-[11px] text-mist/30 hover:text-mist/60 px-3 py-1.5 border border-white/5 hover:border-white/10 rounded-lg transition-all"
                >
                  New chat
                </button>
              )}
              <button
                onClick={() => setShowExplorer(!showExplorer)}
                className={`text-[11px] px-3 py-1.5 border rounded-lg transition-all ${showExplorer ? 'border-gold/30 bg-gold/10 text-gold' : 'border-white/5 text-mist/40 hover:border-white/10 hover:text-mist/70'}`}
              >
                Browse 100 cases
              </button>
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden relative z-10">

          {/* Case explorer sidebar */}
          <aside className={`${showExplorer ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden flex-shrink-0 border-r border-white/5 bg-ink-light/50`}>
            <div className="w-72 h-full flex flex-col">
              <div className="p-3 border-b border-white/5 space-y-2">
                <p className="text-gold/70 text-xs font-mono uppercase tracking-wider">Dan White's 100 Cases</p>
                <input
                  type="text"
                  placeholder="Search brand or principle..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-ink border border-white/8 rounded-lg px-3 py-2 text-cream text-xs placeholder-mist/20 focus:border-gold/30 transition-colors"
                />
                <select
                  value={filterTheme}
                  onChange={e => setFilterTheme(e.target.value)}
                  className="w-full bg-ink border border-white/8 rounded-lg px-3 py-2 text-cream text-xs focus:border-gold/30 transition-colors"
                >
                  <option value="">All themes</option>
                  {allThemes.map(t => <option key={t} value={t} className="bg-ink">{t}</option>)}
                </select>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {filteredCases.map(cs => (
                  <button
                    key={cs.id}
                    onClick={() => setActiveCase(activeCase === cs.id ? null : cs.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${activeCase === cs.id ? 'bg-gold/8 border border-gold/20' : 'hover:bg-white/3 border border-transparent'}`}
                  >
                    <div className="flex gap-2 items-start">
                      <span className="text-gold/30 font-mono text-[10px] mt-0.5 flex-shrink-0">{String(cs.id).padStart(2,'0')}</span>
                      <div className="min-w-0">
                        <p className="text-cream/80 text-xs font-medium truncate">{cs.brand}</p>
                        <p className="text-mist/35 text-[10px] truncate mt-0.5">{cs.principle}</p>
                        {activeCase === cs.id && (
                          <div className="mt-2 space-y-1.5">
                            <p className="text-mist/55 text-[11px] leading-relaxed">{cs.keyLesson}</p>
                            {cs.metrics && <p className="text-gold/50 text-[10px] font-mono">{cs.metrics}</p>}
                            <button
                              onClick={e => { e.stopPropagation(); handleSubmit(`Tell me more about ${cs.title} by ${cs.brand} and how I can apply Dan White's lesson from it.`); setShowExplorer(false); }}
                              className="text-[10px] text-gold/70 border border-gold/20 rounded px-2 py-0.5 hover:bg-gold/10 transition-colors mt-1"
                            >
                              Ask Oracle →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main chat */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Messages area */}
            <div className="flex-1 chat-scroll" id="chat-area">
              {!hasMessages ? (
                /* ── Hero ── */
                <div className="h-full flex flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="mb-7 relative">
                    <div className="w-16 h-16 border border-gold/25 rotate-45 mx-auto flex items-center justify-center">
                      <div className="w-10 h-10 border border-gold/15 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gold/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-3 leading-tight">
                    What's your<br />
                    <span className="gold-shimmer">marketing challenge?</span>
                  </h2>
                  <p className="text-mist/45 text-sm max-w-md leading-relaxed mb-10">
                    I'm trained on all 100 case studies from Dan White's Marketing Inspiration Book.
                    Bring me your real problem and I'll find the right case to crack it.
                  </p>
                  <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {STARTER_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSubmit(q)}
                        className="group text-left px-4 py-3 border border-white/6 rounded-xl bg-white/2 hover:border-gold/25 hover:bg-gold/4 transition-all duration-200"
                      >
                        <span className="text-mist/50 text-sm group-hover:text-cream/75 transition-colors leading-snug">{q}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* ── Conversation ── */
                <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-5">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                      {msg.role === 'assistant' && (
                        <div className="flex-shrink-0 w-7 h-7 border border-gold/35 rotate-45 flex items-center justify-center mt-0.5">
                          <span className="text-gold/60 text-[8px] font-mono -rotate-45">MO</span>
                        </div>
                      )}

                      <div className={`${msg.role === 'user' ? 'max-w-[78%]' : 'max-w-[88%] flex-1'}`}>
                        {msg.role === 'user' ? (
                          <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tr-md px-4 py-3">
                            <p className="text-cream/90 text-sm leading-relaxed">{msg.content}</p>
                          </div>
                        ) : (
                          <div className="rounded-2xl rounded-tl-md px-5 py-4 bg-ink-light border border-white/6">
                            <div
                              className="text-cream/85 text-sm"
                              dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                            />
                            {msg.provider && (
                              <div className="mt-3 flex items-center gap-1.5">
                                <div
                                  className="w-1.5 h-1.5 rounded-full opacity-60"
                                  style={{ backgroundColor: PROVIDER_COLORS[msg.provider] ?? '#888' }}
                                />
                                <span className="text-mist/25 text-[10px] font-mono">
                                  {msg.provider} · {msg.model}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <div className="flex-shrink-0 w-7 h-7 bg-gold/8 border border-gold/15 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-gold/50 text-[9px] font-mono">U</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isLoading && (
                    <div className="flex gap-3 justify-start fade-in">
                      <div className="flex-shrink-0 w-7 h-7 border border-gold/35 rotate-45 flex items-center justify-center mt-0.5">
                        <span className="text-gold/60 text-[8px] font-mono -rotate-45">MO</span>
                      </div>
                      <div className="bg-ink-light border border-white/6 rounded-2xl rounded-tl-md px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {[0,1,2].map(i => (
                            <div key={i} className="typing-dot w-2 h-2 bg-gold/50 rounded-full" />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* ── Input ── */}
            <div ref={inputAreaRef} className="flex-shrink-0 border-t border-white/5 bg-ink/95 backdrop-blur-xl px-4 md:px-6 pt-3 pb-4">
              <div className="max-w-3xl mx-auto">

                {/* Quick prompts — shown after first message */}
                {hasMessages && (
                  <div className="flex gap-1.5 mb-2.5 overflow-x-auto pb-1 no-scrollbar">
                    {STARTER_QUESTIONS.slice(0, 4).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSubmit(q)}
                        className="flex-shrink-0 text-[11px] text-mist/35 border border-white/6 rounded-full px-3 py-1 hover:text-mist/65 hover:border-white/12 transition-all whitespace-nowrap"
                      >
                        {q.length > 38 ? q.slice(0, 38) + '…' : q}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2.5 items-end">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onInput={e => {
                      const t = e.target as HTMLTextAreaElement;
                      t.style.height = 'auto';
                      t.style.height = Math.min(t.scrollHeight, 160) + 'px';
                    }}
                    placeholder="Ask anything — brand strategy, growth, positioning, campaign ideas..."
                    rows={1}
                    className="flex-1 bg-ink-light border border-white/8 focus:border-gold/30 rounded-xl px-4 py-3 text-cream text-sm placeholder-mist/20 transition-colors resize-none leading-relaxed"
                    style={{ minHeight: '52px', maxHeight: '160px' }}
                  />
                  <button
                    onClick={() => handleSubmit()}
                    disabled={!input.trim() || isLoading}
                    className="flex-shrink-0 w-11 h-11 mb-0.5 border border-gold/25 bg-gold/8 hover:bg-gold/18 disabled:opacity-25 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all group"
                  >
                    {isLoading
                      ? <div className="w-3.5 h-3.5 border border-gold/40 border-t-gold/80 rounded-full animate-spin" />
                      : <svg className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    }
                  </button>
                </div>

                <p className="text-mist/18 text-[10px] mt-1.5 text-center">
                  ↵ send · shift+↵ new line · trained on Dan White's 100 marketing case studies
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}