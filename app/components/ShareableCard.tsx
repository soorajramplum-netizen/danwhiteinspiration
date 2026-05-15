'use client';

import { useState, useRef } from 'react';

interface Props {
  content: string;
  caseNumbers?: number[];
  onClose: () => void;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,3} .+$/gm, '')
    .replace(/^[-•] /gm, '• ')
    .replace(/^\d+\. /gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function truncate(text: string, maxLen = 320): string {
  const clean = stripMarkdown(text);
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

const CARD_THEMES = [
  {
    name: 'Mint',
    bg: '#B8D8D8',
    accent: '#C4437C',
    text: '#1A4A4A',
    sub: '#2D6A6A',
    border: '#9DC5C5',
  },
  {
    name: 'Magenta',
    bg: '#C4437C',
    accent: '#fff',
    text: '#ffffff',
    sub: 'rgba(255,255,255,0.75)',
    border: '#9E2E60',
  },
  {
    name: 'Teal',
    bg: '#1A4A4A',
    accent: '#C4437C',
    text: '#D4E9E9',
    sub: 'rgba(212,233,233,0.7)',
    border: '#2D6A6A',
  },
];

export default function ShareableCard({ content, caseNumbers = [], onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [themeIdx, setThemeIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const theme = CARD_THEMES[themeIdx];
  const displayText = truncate(content, 300);
  const caseLabel = caseNumbers.length > 0
    ? `Case${caseNumbers.length > 1 ? 's' : ''} #${caseNumbers.slice(0, 3).join(', #')}`
    : null;

  const downloadPNG = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // Dynamically import html2canvas only when needed
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: theme.bg,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `marketing-insight-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      setDownloading(false);
    }
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(stripMarkdown(content) + '\n\n— Marketing Inspiration · Inspired by Dan White');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(26,74,74,0.6)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#D4E9E9',
        borderRadius: 20,
        padding: 24,
        maxWidth: 560,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(26,74,74,0.3)',
      }}>
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ color: '#1A4A4A', fontWeight: 700, fontSize: 15, margin: 0 }}>
              ✨ Share this Insight
            </h3>
            <p style={{ color: '#2D6A6A', fontSize: 11.5, marginTop: 3 }}>
              Download as image or copy text
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(45,106,106,0.1)', border: 'none',
              borderRadius: '50%', width: 32, height: 32,
              fontSize: 16, cursor: 'pointer', color: '#1A4A4A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Theme picker */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <span style={{ color: '#2D6A6A', fontSize: 11.5, fontWeight: 600, alignSelf: 'center', marginRight: 4 }}>Theme:</span>
          {CARD_THEMES.map((t, i) => (
            <button
              key={i}
              onClick={() => setThemeIdx(i)}
              style={{
                width: 26, height: 26, borderRadius: '50%',
                background: t.bg, border: `3px solid ${i === themeIdx ? '#C4437C' : t.border}`,
                cursor: 'pointer', transition: 'border .15s',
              }}
              title={t.name}
            />
          ))}
        </div>

        {/* ── Card preview (this is what gets exported) ── */}
        <div
          ref={cardRef}
          style={{
            background: theme.bg,
            border: `2px solid ${theme.border}`,
            borderRadius: 16,
            padding: '28px 28px 22px',
            marginBottom: 16,
            fontFamily: 'Space Grotesk, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative corner */}
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 80, height: 80, borderRadius: '50%',
            background: theme.accent, opacity: 0.12,
          }} />
          <div style={{
            position: 'absolute', bottom: -30, left: -20,
            width: 100, height: 100, borderRadius: '50%',
            background: theme.accent, opacity: 0.08,
          }} />

          {/* Top label */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {/* Mini avatar */}
              <svg width="28" height="28" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="38" fill="#C4437C" />
                <circle cx="40" cy="40" r="34" fill="#D4E9E9" />
                <circle cx="40" cy="35" r="16" fill="#F4C5A0" />
                <ellipse cx="40" cy="21" rx="13" ry="7" fill="#5C3A1E" />
                <ellipse cx="29" cy="27" rx="5" ry="8" fill="#5C3A1E" />
                <ellipse cx="51" cy="27" rx="5" ry="8" fill="#5C3A1E" />
                <circle cx="34" cy="34" r="2.5" fill="#2D1B0E" />
                <circle cx="46" cy="34" r="2.5" fill="#2D1B0E" />
                <path d="M33 40 Q40 46 47 40" stroke="#2D1B0E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <ellipse cx="40" cy="62" rx="16" ry="10" fill="#2D6A6A" />
                <path d="M34 52 L40 58 L46 52" fill="white" />
              </svg>
              <div>
                <p style={{ color: theme.text, fontSize: 11, fontWeight: 700, margin: 0, lineHeight: 1 }}>
                  Marketing Inspiration
                </p>
                <p style={{ color: theme.accent, fontSize: 9.5, margin: 0, lineHeight: 1.3 }}>
                  Inspired by Dan White
                </p>
              </div>
            </div>
            {caseLabel && (
              <span style={{
                background: theme.accent, color: theme.bg,
                fontFamily: 'Space Mono, monospace',
                fontSize: 9, fontWeight: 700,
                padding: '3px 8px', borderRadius: 10,
              }}>
                {caseLabel}
              </span>
            )}
          </div>

          {/* Quote mark */}
          <div style={{
            color: theme.accent, fontSize: 48, lineHeight: 0.8,
            opacity: 0.25, marginBottom: 8, fontFamily: 'Georgia, serif',
          }}>
            "
          </div>

          {/* Insight text */}
          <p style={{
            color: theme.text, fontSize: 14, lineHeight: 1.72,
            fontWeight: 500, margin: 0, marginBottom: 20,
            position: 'relative', zIndex: 1,
          }}>
            {displayText}
          </p>

          {/* Footer */}
          <div style={{
            borderTop: `1px solid ${theme.border}`,
            paddingTop: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <p style={{ color: theme.sub, fontSize: 10, margin: 0, fontFamily: 'Space Mono, monospace' }}>
              smartmarketing.me · Dan White
            </p>
            <p style={{ color: theme.sub, fontSize: 10, margin: 0 }}>
              100 Case Studies
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={downloadPNG}
            disabled={downloading}
            style={{
              flex: 1, background: '#C4437C', color: 'white',
              border: 'none', borderRadius: 10,
              padding: '10px 16px', fontSize: 13, fontWeight: 700,
              cursor: downloading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {downloading ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Rendering…
              </>
            ) : (
              <>⬇ Download PNG</>
            )}
          </button>
          <button
            onClick={copyText}
            style={{
              flex: 1, background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.6)',
              color: copied ? '#166534' : '#1A4A4A',
              border: `1.5px solid ${copied ? '#22C55E' : '#9DC5C5'}`,
              borderRadius: 10, padding: '10px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {copied ? '✓ Copied!' : '📋 Copy Text'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
