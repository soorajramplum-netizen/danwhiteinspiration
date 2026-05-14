
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
  gemini:     '#4285F4',
  openrouter: '#9C5FD6',
  groq:       '#22C55E',
};

const STARTER_QUESTIONS = [
  { emoji: '📈', text: 'How do I grow market share in a saturated category?' },
  { emoji: '🎯', text: 'When should I invest in brand-building vs performance marketing?' },
  { emoji: '🛡️', text: 'My product keeps getting copied. How do I protect brand equity?' },
  { emoji: '🌍', text: 'How do I launch into a new market or occasion?' },
  { emoji: '✨', text: 'Our brand feels dated. How do other brands successfully reinvent themselves?' },
  { emoji: '💡', text: 'How do I create marketing impact with a small budget?' },
  { emoji: '🦁', text: 'What makes a brand character truly iconic and enduring?' },
  { emoji: '🔄', text: 'How do I expand geographies without losing brand identity?' },
];

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^\d+\. (.+)$/gm, '<li class="oli">$1</li>')
    .replace(/^[-•] (.+)$/gm, '<li class="uli">$1</li>')
    .replace(/(<li class="oli">[\s\S]*?<\/li>\n?)+/g, m => `<ol>${m}</ol>`)
    .replace(/(<li class="uli">[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^(?!<[houpl])(.+)$/, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

// Dan White avatar as SVG illustration (mint/magenta palette)
function DanWhiteAvatar({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Badge ring */}
      <circle cx="40" cy="40" r="38" fill="#C4437C" />
      <circle cx="40" cy="40" r="34" fill="#D4E9E9" />
      {/* Face */}
      <circle cx="40" cy="35" r="16" fill="#F4C5A0" />
      {/* Hair */}
      <ellipse cx="40" cy="21" rx="13" ry="7" fill="#5C3A1E" />
      <ellipse cx="29" cy="27" rx="5" ry="8" fill="#5C3A1E" />
      <ellipse cx="51" cy="27" rx="5" ry="8" fill="#5C3A1E" />
      {/* Eyes */}
      <circle cx="34" cy="34" r="2.5" fill="#2D1B0E" />
      <circle cx="46" cy="34" r="2.5" fill="#2D1B0E" />
      <circle cx="35" cy="33" r="0.8" fill="white" />
      <circle cx="47" cy="33" r="0.8" fill="white" />
      {/* Smile */}
      <path d="M33 40 Q40 46 47 40" stroke="#2D1B0E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Body / collar */}
      <ellipse cx="40" cy="62" rx="16" ry="10" fill="#2D6A6A" />
      <path d="M34 52 L40 58 L46 52" fill="white" />
      {/* Stars on badge */}
      <text x="12" y="22" fontSize="6" fill="#C4437C">★</text>
      <text x="60" y="22" fontSize="6" fill="#C4437C">★</text>
      <text x="12" y="62" fontSize="6" fill="#C4437C">★</text>
      <text x="60" y="62" fontSize="6" fill="#C4437C">★</text>
    </svg>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiHistory, setApiHistory] = useState<ApiMessage[]>([]);
  const [usedCaseIds, setUsedCaseIds] = useState<number[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [activeCase, setActiveCase] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTheme, setFilterTheme] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSubmit = async (question?: string) => {
    const q = question || input.trim();
    if (!q || isLoading) return;
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '52px';
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiHistory, question: q, usedCaseIds }),
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
      if (data.usedCaseIds) setUsedCaseIds(data.usedCaseIds);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong reaching the Oracle. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const allThemes = Array.from(new Set(CASE_STUDIES.flatMap(c => c.theme))).sort();
  const filteredCases = CASE_STUDIES.filter(cs => {
    const q = searchQuery.toLowerCase();
    return (!q || cs.title.toLowerCase().includes(q) || cs.brand.toLowerCase().includes(q) || cs.principle.toLowerCase().includes(q))
      && (!filterTheme || cs.theme.includes(filterTheme));
  });

  const hasMessages = messages.length > 0;

  return (
    <>
      <style>{`
        body { background: #B8D8D8; }
        .md-body p { margin: 0 0 0.85em; color: #1A4A4A; line-height: 1.75; }
        .md-body p:last-child { margin-bottom: 0; }
        .md-body strong { color: #1A4A4A; font-weight: 700; }
        .md-body em { color: #9E2E60; font-style: italic; }
        .md-body h1, .md-body h2, .md-body h3 { color: #1A4A4A; font-weight: 700; margin: 1.1em 0 0.45em; }
        .md-body h1 { font-size: 1.08em; }
        .md-body h2 { font-size: 1.01em; }
        .md-body h3 { font-size: 0.96em; }
        .md-body h1:first-child, .md-body h2:first-child, .md-body h3:first-child { margin-top: 0; }
        .md-body ul, .md-body ol { margin: 0.4em 0 0.85em; padding: 0; list-style: none; }
        .md-body li { position: relative; padding: 0.2em 0 0.2em 1.4em; line-height: 1.65; color: #1A4A4A; }
        .md-body ul .uli::before { content: '▸'; position: absolute; left: 0; color: #C4437C; font-size: 0.8em; top: 0.35em; }
        .md-body ol { counter-reset: item; }
        .md-body ol .oli { counter-increment: item; }
        .md-body ol .oli::before { content: counter(item) '.'; position: absolute; left: 0; color: #C4437C; font-weight: 700; font-size: 0.82em; top: 0.3em; }
        .fade-in { animation: fi 0.3s ease forwards; }
        @keyframes fi { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .typing-dot { animation: tb 1.2s infinite ease-in-out; }
        .typing-dot:nth-child(2) { animation-delay: .15s; }
        .typing-dot:nth-child(3) { animation-delay: .3s; }
        @keyframes tb { 0%,80%,100% { transform:scale(.6); opacity:.3; } 40% { transform:scale(1); opacity:1; } }
        .chat-scroll { overflow-y:auto; scroll-behavior:smooth; }
        .chat-scroll::-webkit-scrollbar { width:4px; }
        .chat-scroll::-webkit-scrollbar-thumb { background:rgba(196,67,124,.25); border-radius:2px; }
        .no-scrollbar::-webkit-scrollbar { display:none; }
        .pill-btn { transition: all .15s ease; }
        .pill-btn:hover { background: rgba(196,67,124,0.12); border-color: #C4437C; color: #C4437C; }
        .starter-card:hover { background: rgba(255,255,255,0.7); border-color: #C4437C; transform: translateY(-1px); }
        .starter-card { transition: all .2s ease; }
        input, textarea, select { font-family: 'Space Grotesk', sans-serif; }
      `}</style>

      <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#B8D8D8', fontFamily: 'Space Grotesk, sans-serif' }}>

        {/* ── Header ── */}
        <header style={{ background: 'rgba(184,216,216,0.92)', borderBottom: '2px solid #9DC5C5', backdropFilter: 'blur(12px)' }} className="flex-shrink-0 relative z-20">
          <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 drop-shadow-sm">
                <DanWhiteAvatar size={44} />
              </div>
              <div>
                <h1 style={{ color: '#1A4A4A', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.1 }}>
                  Marketing Inspiration
                </h1>
                <p style={{ color: '#C4437C', fontSize: '0.7rem', fontWeight: 500, marginTop: 2 }}>
                  Inspired by Dan White · 100 Case Studies
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {hasMessages && (
                <button
                  onClick={() => { setMessages([]); setApiHistory([]); setUsedCaseIds([]); }}
                  style={{ color: '#2D6A6A', border: '1.5px solid #9DC5C5', borderRadius: 8, fontSize: 12, padding: '6px 12px', background: 'transparent', cursor: 'pointer' }}
                  className="pill-btn"
                >
                  New chat
                </button>
              )}
              <button
                onClick={() => setShowExplorer(!showExplorer)}
                style={{
                  color: showExplorer ? '#fff' : '#2D6A6A',
                  background: showExplorer ? '#C4437C' : 'transparent',
                  border: `1.5px solid ${showExplorer ? '#C4437C' : '#9DC5C5'}`,
                  borderRadius: 8, fontSize: 12, padding: '6px 14px', cursor: 'pointer', fontWeight: 600,
                }}
              >
                📖 All 100 Cases
              </button>
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden relative z-10">

          {/* ── Case explorer sidebar ── */}
          <aside
            style={{
              width: showExplorer ? 288 : 0,
              transition: 'width .3s ease',
              overflow: 'hidden',
              flexShrink: 0,
              borderRight: '2px solid #9DC5C5',
              background: 'rgba(255,255,255,0.45)',
            }}
          >
            <div style={{ width: 288 }} className="h-full flex flex-col">
              <div style={{ padding: '12px', borderBottom: '1.5px solid #9DC5C5' }} className="space-y-2">
                <p style={{ color: '#C4437C', fontSize: 11, fontWeight: 700, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Dan White's 100 Cases
                </p>
                <input
                  type="text"
                  placeholder="Search brand or principle..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.7)', border: '1.5px solid #9DC5C5', borderRadius: 8, padding: '7px 10px', color: '#1A4A4A', fontSize: 12 }}
                />
                <select
                  value={filterTheme}
                  onChange={e => setFilterTheme(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.7)', border: '1.5px solid #9DC5C5', borderRadius: 8, padding: '7px 10px', color: '#1A4A4A', fontSize: 12, cursor: 'pointer' }}
                >
                  <option value="">All themes</option>
                  {allThemes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex-1 chat-scroll" style={{ padding: '8px' }}>
                {filteredCases.map(cs => (
                  <button
                    key={cs.id}
                    onClick={() => setActiveCase(activeCase === cs.id ? null : cs.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 10px',
                      borderRadius: 10, marginBottom: 2,
                      background: activeCase === cs.id ? 'rgba(196,67,124,0.1)' : 'transparent',
                      border: `1.5px solid ${activeCase === cs.id ? '#C4437C' : 'transparent'}`,
                      cursor: 'pointer', transition: 'all .15s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: '#C4437C', fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                        {String(cs.id).padStart(2, '0')}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: '#1A4A4A', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cs.brand}</p>
                        <p style={{ color: '#2D6A6A', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2, opacity: 0.7 }}>{cs.principle}</p>
                        {activeCase === cs.id && (
                          <div style={{ marginTop: 8 }}>
                            <p style={{ color: '#2D6A6A', fontSize: 11, lineHeight: 1.6, marginBottom: 8 }}>{cs.keyLesson}</p>
                            {cs.metrics && <p style={{ color: '#C4437C', fontSize: 10, fontFamily: 'Space Mono, monospace', marginBottom: 8 }}>{cs.metrics}</p>}
                            <button
                              onClick={e => { e.stopPropagation(); handleSubmit(`Tell me more about the ${cs.title} case study (Case #${cs.id}) and how I can apply Dan White's lesson.`); setShowExplorer(false); }}
                              style={{ fontSize: 11, color: '#fff', background: '#C4437C', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}
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

          {/* ── Main chat ── */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Messages */}
            <div className="flex-1 chat-scroll" id="chat-area">
              {!hasMessages ? (
                /* ── Hero ── */
                <div className="h-full flex flex-col items-center justify-center px-6 py-10 text-center">
                  <div style={{ marginBottom: 24 }}>
                    <DanWhiteAvatar size={72} />
                  </div>
                  <h2 style={{ color: '#1A4A4A', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.25, marginBottom: 10 }}>
                    What's your marketing challenge?
                  </h2>
                  <p style={{ color: '#2D6A6A', fontSize: '0.9rem', maxWidth: 420, lineHeight: 1.65, marginBottom: 8, opacity: 0.8 }}>
                    I've studied all 100 of Dan White's marketing case studies — from Ancient Egypt to Zoom.
                  </p>
                  <p style={{ color: '#C4437C', fontSize: '0.82rem', fontWeight: 600, marginBottom: 32 }}>
                    Bring me your real challenge. I'll find the right case to crack it.
                  </p>

                  <div style={{ width: '100%', maxWidth: 560, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {STARTER_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSubmit(q.text)}
                        className="starter-card"
                        style={{
                          textAlign: 'left', padding: '12px 14px',
                          background: 'rgba(255,255,255,0.5)',
                          border: '1.5px solid rgba(45,106,106,0.2)',
                          borderRadius: 12, cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: 16, display: 'block', marginBottom: 4 }}>{q.emoji}</span>
                        <span style={{ color: '#1A4A4A', fontSize: 12.5, lineHeight: 1.5, fontWeight: 500 }}>{q.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* ── Conversation ── */
                <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {messages.map((msg, i) => (
                    <div key={i} className="fade-in" style={{ display: 'flex', gap: 10, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>

                      {/* Oracle avatar */}
                      {msg.role === 'assistant' && (
                        <div style={{ flexShrink: 0, marginTop: 2 }}>
                          <DanWhiteAvatar size={32} />
                        </div>
                      )}

                      <div style={{ maxWidth: msg.role === 'user' ? '75%' : '88%' }}>
                        {msg.role === 'user' ? (
                          <div style={{
                            background: '#C4437C', color: 'white',
                            borderRadius: '18px 18px 4px 18px',
                            padding: '10px 16px', fontSize: 14, lineHeight: 1.6,
                          }}>
                            {msg.content}
                          </div>
                        ) : (
                          <div style={{
                            background: 'rgba(255,255,255,0.75)',
                            border: '1.5px solid rgba(45,106,106,0.15)',
                            borderRadius: '4px 18px 18px 18px',
                            padding: '14px 18px',
                          }}>
                            <div
                              className="md-body"
                              style={{ fontSize: 14 }}
                              dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                            />
                            {msg.provider && (
                              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(45,106,106,0.1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: PROVIDER_COLORS[msg.provider] ?? '#888', display: 'inline-block' }} />
                                <span style={{ color: '#2D6A6A', fontSize: 10, fontFamily: 'Space Mono, monospace', opacity: 0.5 }}>
                                  {msg.provider} · {msg.model}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* User avatar */}
                      {msg.role === 'user' && (
                        <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: '#9E2E60', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                          <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>You</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing */}
                  {isLoading && (
                    <div className="fade-in" style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flexShrink: 0, marginTop: 2 }}>
                        <DanWhiteAvatar size={32} />
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(45,106,106,0.15)', borderRadius: '4px 18px 18px 18px', padding: '16px 20px', display: 'flex', gap: 5, alignItems: 'center' }}>
                        {[0,1,2].map(i => (
                          <div key={i} className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#C4437C' }} />
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* ── Input ── */}
            <div style={{ background: 'rgba(184,216,216,0.92)', borderTop: '2px solid #9DC5C5', backdropFilter: 'blur(12px)', padding: '12px 20px 16px', flexShrink: 0 }}>
              <div style={{ maxWidth: 760, margin: '0 auto' }}>

                {/* Quick prompts after first message */}
                {hasMessages && (
                  <div className="no-scrollbar" style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }}>
                    {STARTER_QUESTIONS.slice(0, 4).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSubmit(q.text)}
                        className="pill-btn"
                        style={{
                          flexShrink: 0, fontSize: 11.5, color: '#2D6A6A',
                          border: '1.5px solid #9DC5C5', borderRadius: 20,
                          padding: '5px 12px', background: 'rgba(255,255,255,0.4)',
                          cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500,
                        }}
                      >
                        {q.emoji} {q.text.length > 36 ? q.text.slice(0, 36) + '…' : q.text}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
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
                    placeholder="Ask about brand strategy, growth, positioning, creative ideas..."
                    rows={1}
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.8)',
                      border: '1.5px solid #9DC5C5', borderRadius: 14,
                      padding: '13px 16px', color: '#1A4A4A', fontSize: 14,
                      resize: 'none', minHeight: 52, maxHeight: 160,
                      lineHeight: 1.5, fontFamily: 'Space Grotesk, sans-serif',
                      transition: 'border-color .15s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#C4437C'}
                    onBlur={e => e.target.style.borderColor = '#9DC5C5'}
                  />
                  <button
                    onClick={() => handleSubmit()}
                    disabled={!input.trim() || isLoading}
                    style={{
                      flexShrink: 0, width: 48, height: 48,
                      background: input.trim() && !isLoading ? '#C4437C' : '#9DC5C5',
                      border: 'none', borderRadius: 12, cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .2s', marginBottom: 2,
                    }}
                  >
                    {isLoading
                      ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      : <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    }
                  </button>
                </div>

                <p style={{ color: '#2D6A6A', fontSize: 10.5, textAlign: 'center', marginTop: 8, opacity: 0.5 }}>
                  ↵ send · shift+↵ new line · grounded in Dan White's 100 marketing case studies
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}