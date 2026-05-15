'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CASE_STUDIES } from '@/lib/knowledge-base';
import CaseOfTheDay from './components/CaseOfTheDay';
import ChallengeMode from './components/ChallengeMode';
import ShareableCard from './components/ShareableCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  caseNumbers?: number[];
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
  { emoji: '✨', text: 'Our brand feels dated. How do we successfully reinvent ourselves?' },
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

function extractCaseNumbers(text: string): number[] {
  return Array.from(text.matchAll(/Case #(\d+)/gi))
    .map(m => parseInt(m[1]))
    .filter(n => n >= 1 && n <= 100);
}

function DanWhiteAvatar({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="38" fill="#C4437C" />
      <circle cx="40" cy="40" r="34" fill="#D4E9E9" />
      <circle cx="40" cy="35" r="16" fill="#F4C5A0" />
      <ellipse cx="40" cy="21" rx="13" ry="7" fill="#5C3A1E" />
      <ellipse cx="29" cy="27" rx="5" ry="8" fill="#5C3A1E" />
      <ellipse cx="51" cy="27" rx="5" ry="8" fill="#5C3A1E" />
      <circle cx="34" cy="34" r="2.5" fill="#2D1B0E" />
      <circle cx="46" cy="34" r="2.5" fill="#2D1B0E" />
      <circle cx="35" cy="33" r="0.8" fill="white" />
      <circle cx="47" cy="33" r="0.8" fill="white" />
      <path d="M33 40 Q40 46 47 40" stroke="#2D1B0E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="40" cy="62" rx="16" ry="10" fill="#2D6A6A" />
      <path d="M34 52 L40 58 L46 52" fill="white" />
      <text x="12" y="22" fontSize="6" fill="#C4437C">★</text>
      <text x="60" y="22" fontSize="6" fill="#C4437C">★</text>
      <text x="12" y="62" fontSize="6" fill="#C4437C">★</text>
      <text x="60" y="62" fontSize="6" fill="#C4437C">★</text>
    </svg>
  );
}

type AppView = 'chat' | 'challenge';

export default function Home() {
  const [view, setView] = useState<AppView>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiHistory, setApiHistory] = useState<ApiMessage[]>([]);
  const [usedCaseIds, setUsedCaseIds] = useState<number[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [activeCase, setActiveCase] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTheme, setFilterTheme] = useState('');
  const [shareMsg, setShareMsg] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSubmit = async (question?: string) => {
    const q = question || input.trim();
    if (!q || isLoading) return;
    if (view !== 'chat') setView('chat');
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
      const caseNums = extractCaseNumbers(data.response);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        provider: data.provider,
        model: data.model,
        caseNumbers: caseNums,
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
        body { background: #B8D8D8; margin: 0; }
        .md-body p { margin: 0 0 0.85em; color: #1A4A4A; line-height: 1.75; }
        .md-body p:last-child { margin-bottom: 0; }
        .md-body strong { color: #1A4A4A; font-weight: 700; }
        .md-body em { color: #9E2E60; font-style: italic; }
        .md-body h1,.md-body h2,.md-body h3 { color: #1A4A4A; font-weight: 700; margin: 1.1em 0 0.45em; }
        .md-body h1 { font-size: 1.08em; }
        .md-body h2 { font-size: 1.01em; }
        .md-body h3 { font-size: 0.96em; }
        .md-body h1:first-child,.md-body h2:first-child,.md-body h3:first-child { margin-top: 0; }
        .md-body ul,.md-body ol { margin: 0.4em 0 0.85em; padding: 0; list-style: none; }
        .md-body li { position: relative; padding: 0.2em 0 0.2em 1.4em; line-height: 1.65; color: #1A4A4A; }
        .md-body ul .uli::before { content: '▸'; position: absolute; left: 0; color: #C4437C; font-size: 0.8em; top: 0.35em; }
        .md-body ol { counter-reset: item; }
        .md-body ol .oli { counter-increment: item; }
        .md-body ol .oli::before { content: counter(item) '.'; position: absolute; left: 0; color: #C4437C; font-weight: 700; font-size: 0.82em; top: 0.3em; }
        .fade-in { animation: fi .3s ease forwards; }
        @keyframes fi { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
        .typing-dot { animation: tb 1.2s infinite ease-in-out; }
        .typing-dot:nth-child(2){animation-delay:.15s}
        .typing-dot:nth-child(3){animation-delay:.3s}
        @keyframes tb{0%,80%,100%{transform:scale(.6);opacity:.3}40%{transform:scale(1);opacity:1}}
        .chat-scroll{overflow-y:auto;scroll-behavior:smooth}
        .chat-scroll::-webkit-scrollbar{width:4px}
        .chat-scroll::-webkit-scrollbar-thumb{background:rgba(196,67,124,.25);border-radius:2px}
        .no-scrollbar::-webkit-scrollbar{display:none}
        .pill-btn{transition:all .15s ease}
        .pill-btn:hover{background:rgba(196,67,124,.12)!important;border-color:#C4437C!important;color:#C4437C!important}
        .starter-card{transition:all .2s ease}
        .starter-card:hover{background:rgba(255,255,255,.75)!important;border-color:#C4437C!important;transform:translateY(-1px)}
        .nav-btn{transition:all .15s ease}
        .nav-btn:hover{opacity:.85}
        .share-btn{transition:all .15s ease;opacity:0}
        .msg-wrap:hover .share-btn{opacity:1}
        input,textarea,select{font-family:'Space Grotesk',sans-serif}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#B8D8D8', fontFamily: 'Space Grotesk, sans-serif' }}>

        {/* ── Header ── */}
        <header style={{ background: 'rgba(184,216,216,0.95)', borderBottom: '2px solid #9DC5C5', backdropFilter: 'blur(12px)', flexShrink: 0, position: 'relative', zIndex: 20 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <DanWhiteAvatar size={40} />
              <div>
                <h1 style={{ color: '#1A4A4A', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.1, margin: 0 }}>
                  Marketing Inspiration
                </h1>
                <p style={{ color: '#C4437C', fontSize: '0.68rem', fontWeight: 600, margin: 0, marginTop: 1 }}>
                  Inspired by Dan White · 100 Case Studies
                </p>
              </div>
            </div>

            {/* Nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                className="nav-btn"
                onClick={() => setView('chat')}
                style={{
                  color: view === 'chat' ? '#fff' : '#2D6A6A',
                  background: view === 'chat' ? '#C4437C' : 'transparent',
                  border: `1.5px solid ${view === 'chat' ? '#C4437C' : '#9DC5C5'}`,
                  borderRadius: 8, fontSize: 12, padding: '6px 12px',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                💬 Chat
              </button>
              <button
                className="nav-btn"
                onClick={() => setView('challenge')}
                style={{
                  color: view === 'challenge' ? '#fff' : '#2D6A6A',
                  background: view === 'challenge' ? '#C4437C' : 'transparent',
                  border: `1.5px solid ${view === 'challenge' ? '#C4437C' : '#9DC5C5'}`,
                  borderRadius: 8, fontSize: 12, padding: '6px 12px',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                🎮 Challenge
              </button>
              <button
                className="nav-btn"
                onClick={() => setShowExplorer(!showExplorer)}
                style={{
                  color: showExplorer ? '#fff' : '#2D6A6A',
                  background: showExplorer ? '#C4437C' : 'transparent',
                  border: `1.5px solid ${showExplorer ? '#C4437C' : '#9DC5C5'}`,
                  borderRadius: 8, fontSize: 12, padding: '6px 12px',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                📖 100 Cases
              </button>
              {hasMessages && view === 'chat' && (
                <button
                  className="pill-btn"
                  onClick={() => { setMessages([]); setApiHistory([]); setUsedCaseIds([]); }}
                  style={{ color: '#2D6A6A', border: '1.5px solid #9DC5C5', borderRadius: 8, fontSize: 12, padding: '6px 11px', background: 'transparent', cursor: 'pointer' }}
                >
                  New chat
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 10 }}>

          {/* Case explorer sidebar */}
          <aside style={{
            width: showExplorer ? 280 : 0,
            transition: 'width .3s ease',
            overflow: 'hidden', flexShrink: 0,
            borderRight: '2px solid #9DC5C5',
            background: 'rgba(255,255,255,0.4)',
          }}>
            <div style={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: 12, borderBottom: '1.5px solid #9DC5C5', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ color: '#C4437C', fontSize: 10.5, fontWeight: 700, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  Dan White's 100 Cases
                </p>
                <input type="text" placeholder="Search brand or principle..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ background: 'rgba(255,255,255,.75)', border: '1.5px solid #9DC5C5', borderRadius: 8, padding: '7px 10px', color: '#1A4A4A', fontSize: 12, width: '100%' }} />
                <select value={filterTheme} onChange={e => setFilterTheme(e.target.value)}
                  style={{ background: 'rgba(255,255,255,.75)', border: '1.5px solid #9DC5C5', borderRadius: 8, padding: '7px 10px', color: '#1A4A4A', fontSize: 12, cursor: 'pointer', width: '100%' }}>
                  <option value="">All themes</option>
                  {allThemes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="chat-scroll" style={{ flex: 1, padding: 8 }}>
                {filteredCases.map(cs => (
                  <button key={cs.id} onClick={() => setActiveCase(activeCase === cs.id ? null : cs.id)}
                    style={{ width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 10, marginBottom: 2,
                      background: activeCase === cs.id ? 'rgba(196,67,124,.1)' : 'transparent',
                      border: `1.5px solid ${activeCase === cs.id ? '#C4437C' : 'transparent'}`,
                      cursor: 'pointer', transition: 'all .15s' }}>
                    <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                      <span style={{ color: '#C4437C', fontFamily: 'Space Mono, monospace', fontSize: 9.5, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                        {String(cs.id).padStart(2,'0')}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: '#1A4A4A', fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cs.brand}</p>
                        <p style={{ color: '#2D6A6A', fontSize: 10.5, margin: '2px 0 0', opacity: .7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cs.principle}</p>
                        {activeCase === cs.id && (
                          <div style={{ marginTop: 8 }}>
                            <p style={{ color: '#2D6A6A', fontSize: 11, lineHeight: 1.6, marginBottom: 8 }}>{cs.keyLesson}</p>
                            {cs.metrics && <p style={{ color: '#C4437C', fontSize: 10, fontFamily: 'Space Mono, monospace', marginBottom: 8 }}>{cs.metrics}</p>}
                            <button onClick={e => { e.stopPropagation(); handleSubmit(`Tell me about Case #${cs.id} — ${cs.title} by ${cs.brand} and how to apply Dan White's lesson.`); setShowExplorer(false); }}
                              style={{ fontSize: 11, color: '#fff', background: '#C4437C', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
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

          {/* ── Main area ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Challenge view */}
            {view === 'challenge' && (
              <ChallengeMode onExit={() => setView('chat')} />
            )}

            {/* Chat view */}
            {view === 'chat' && (
              <>
                <div className="chat-scroll" style={{ flex: 1 }}>
                  {!hasMessages ? (
                    /* ── Hero ── */
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 20px', minHeight: '100%' }}>
                      <div style={{ maxWidth: 600, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                        {/* Heading */}
                        <DanWhiteAvatar size={64} />
                        <h2 style={{ color: '#1A4A4A', fontWeight: 700, fontSize: '1.6rem', textAlign: 'center', margin: '14px 0 6px', lineHeight: 1.25 }}>
                          What's your marketing challenge?
                        </h2>
                        <p style={{ color: '#2D6A6A', fontSize: 13, textAlign: 'center', maxWidth: 380, lineHeight: 1.65, marginBottom: 28, opacity: .8 }}>
                          I've studied all 100 of Dan White's case studies. Bring me your real problem — I'll find the right lesson.
                        </p>

                        {/* Case of the Day */}
                        <div style={{ marginBottom: 28, width: '100%', display: 'flex', justifyContent: 'center' }}>
                          <CaseOfTheDay onAsk={handleSubmit} />
                        </div>

                        {/* Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', marginBottom: 16 }}>
                          <div style={{ flex: 1, height: 1, background: 'rgba(45,106,106,0.15)' }} />
                          <span style={{ color: '#2D6A6A', fontSize: 11, fontWeight: 600, opacity: .6 }}>OR ASK YOUR OWN QUESTION</span>
                          <div style={{ flex: 1, height: 1, background: 'rgba(45,106,106,0.15)' }} />
                        </div>

                        {/* Starter questions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
                          {STARTER_QUESTIONS.map((q, i) => (
                            <button key={i} onClick={() => handleSubmit(q.text)} className="starter-card"
                              style={{ textAlign: 'left', padding: '11px 14px', background: 'rgba(255,255,255,.45)', border: '1.5px solid rgba(45,106,106,.18)', borderRadius: 12, cursor: 'pointer' }}>
                              <span style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>{q.emoji}</span>
                              <span style={{ color: '#1A4A4A', fontSize: 12.5, lineHeight: 1.5, fontWeight: 500 }}>{q.text}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── Conversation ── */
                    <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {messages.map((msg, i) => (
                        <div key={i} className={`fade-in msg-wrap`}
                          style={{ display: 'flex', gap: 10, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', position: 'relative' }}>

                          {msg.role === 'assistant' && (
                            <div style={{ flexShrink: 0, marginTop: 2 }}>
                              <DanWhiteAvatar size={30} />
                            </div>
                          )}

                          <div style={{ maxWidth: msg.role === 'user' ? '74%' : '87%' }}>
                            {msg.role === 'user' ? (
                              <div style={{ background: '#C4437C', color: 'white', borderRadius: '18px 18px 4px 18px', padding: '10px 15px', fontSize: 14, lineHeight: 1.6 }}>
                                {msg.content}
                              </div>
                            ) : (
                              <div style={{ background: 'rgba(255,255,255,.78)', border: '1.5px solid rgba(45,106,106,.13)', borderRadius: '4px 18px 18px 18px', padding: '13px 17px' }}>
                                <div className="md-body" style={{ fontSize: 14 }}
                                  dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />

                                {/* Footer: case pills + share + provider */}
                                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(45,106,106,.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                                    {msg.caseNumbers && msg.caseNumbers.slice(0, 4).map(n => (
                                      <span key={n} style={{ background: 'rgba(196,67,124,.12)', color: '#9E2E60', fontFamily: 'Space Mono, monospace', fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
                                        #{n}
                                      </span>
                                    ))}
                                    {msg.provider && (
                                      <span style={{ color: '#2D6A6A', fontSize: 9.5, fontFamily: 'Space Mono, monospace', opacity: .4, marginLeft: 2 }}>
                                        via {msg.provider}
                                      </span>
                                    )}
                                  </div>
                                  {/* Share button */}
                                  <button
                                    className="share-btn"
                                    onClick={() => setShareMsg(msg)}
                                    style={{
                                      background: 'rgba(196,67,124,.1)', color: '#C4437C',
                                      border: '1px solid rgba(196,67,124,.25)', borderRadius: 8,
                                      padding: '3px 9px', fontSize: 11, fontWeight: 600,
                                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                    }}
                                  >
                                    ✨ Share
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {msg.role === 'user' && (
                            <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: '#9E2E60', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                              <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>You</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {isLoading && (
                        <div className="fade-in" style={{ display: 'flex', gap: 10 }}>
                          <div style={{ flexShrink: 0, marginTop: 2 }}><DanWhiteAvatar size={30} /></div>
                          <div style={{ background: 'rgba(255,255,255,.78)', border: '1.5px solid rgba(45,106,106,.13)', borderRadius: '4px 18px 18px 18px', padding: '15px 20px', display: 'flex', gap: 5, alignItems: 'center' }}>
                            {[0,1,2].map(i => <div key={i} className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#C4437C' }} />)}
                          </div>
                        </div>
                      )}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                {/* ── Input ── */}
                <div style={{ background: 'rgba(184,216,216,.95)', borderTop: '2px solid #9DC5C5', backdropFilter: 'blur(12px)', padding: '11px 20px 14px', flexShrink: 0 }}>
                  <div style={{ maxWidth: 760, margin: '0 auto' }}>
                    {hasMessages && (
                      <div className="no-scrollbar" style={{ display: 'flex', gap: 6, marginBottom: 9, overflowX: 'auto', paddingBottom: 2 }}>
                        {STARTER_QUESTIONS.slice(0, 4).map((q, i) => (
                          <button key={i} onClick={() => handleSubmit(q.text)} className="pill-btn"
                            style={{ flexShrink: 0, fontSize: 11.5, color: '#2D6A6A', border: '1.5px solid #9DC5C5', borderRadius: 20, padding: '4px 11px', background: 'rgba(255,255,255,.4)', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500 }}>
                            {q.emoji} {q.text.length > 34 ? q.text.slice(0, 34) + '…' : q.text}
                          </button>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-end' }}>
                      <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                        onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 160) + 'px'; }}
                        placeholder="Ask about brand strategy, growth, positioning, creative ideas..."
                        rows={1}
                        style={{ flex: 1, background: 'rgba(255,255,255,.82)', border: '1.5px solid #9DC5C5', borderRadius: 14, padding: '12px 15px', color: '#1A4A4A', fontSize: 14, resize: 'none', minHeight: 50, maxHeight: 160, lineHeight: 1.5, transition: 'border-color .15s' }}
                        onFocus={e => e.target.style.borderColor = '#C4437C'}
                        onBlur={e => e.target.style.borderColor = '#9DC5C5'}
                      />
                      <button onClick={() => handleSubmit()} disabled={!input.trim() || isLoading}
                        style={{ flexShrink: 0, width: 46, height: 46, background: input.trim() && !isLoading ? '#C4437C' : '#9DC5C5', border: 'none', borderRadius: 12, cursor: input.trim() && !isLoading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', marginBottom: 2 }}>
                        {isLoading
                          ? <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                          : <svg width="17" height="17" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                        }
                      </button>
                    </div>
                    <p style={{ color: '#2D6A6A', fontSize: 10, textAlign: 'center', marginTop: 7, opacity: .45 }}>
                      ↵ send · shift+↵ new line · grounded in Dan White's 100 marketing case studies
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Shareable card modal */}
      {shareMsg && (
        <ShareableCard
          content={shareMsg.content}
          caseNumbers={shareMsg.caseNumbers}
          onClose={() => setShareMsg(null)}
        />
      )}
    </>
  );
}
