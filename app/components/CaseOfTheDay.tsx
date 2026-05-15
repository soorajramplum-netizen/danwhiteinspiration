'use client';

import { CASE_STUDIES, CaseStudy } from '@/lib/knowledge-base';

interface Props {
  onAsk: (q: string) => void;
}

function getTodaysCase(): CaseStudy {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return CASE_STUDIES[dayOfYear % CASE_STUDIES.length];
}

const PROMPTS = [
  'What would you steal from this campaign?',
  'How would you apply this principle to a challenger brand?',
  'What would this look like in a digital-first world?',
  'Which industry most needs this lesson right now?',
  'How would you pitch this idea to a sceptical CFO?',
];

function getTodaysPrompt(caseId: number): string {
  return PROMPTS[caseId % PROMPTS.length];
}

export default function CaseOfTheDay({ onAsk }: Props) {
  const cs = getTodaysCase();
  const prompt = getTodaysPrompt(cs.id);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      border: '2px solid #C4437C',
      borderRadius: 16,
      padding: '20px 22px',
      maxWidth: 560,
      width: '100%',
    }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 18 }}>📅</span>
          <span style={{
            color: '#C4437C', fontSize: 11, fontWeight: 700,
            fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Case of the Day
          </span>
        </div>
        <span style={{ color: '#2D6A6A', fontSize: 11, opacity: 0.6 }}>{today}</span>
      </div>

      {/* Case number + brand */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <span style={{
          background: '#C4437C', color: 'white',
          fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700,
          padding: '2px 8px', borderRadius: 10,
        }}>
          #{String(cs.id).padStart(2, '0')}
        </span>
        <h3 style={{ color: '#1A4A4A', fontWeight: 700, fontSize: '1rem', margin: 0 }}>
          {cs.brand}
        </h3>
      </div>

      {/* Title */}
      <p style={{ color: '#2D6A6A', fontSize: 12.5, marginBottom: 10, opacity: 0.8 }}>
        {cs.title}
      </p>

      {/* Principle pill */}
      <div style={{
        display: 'inline-block',
        background: 'rgba(196,67,124,0.1)',
        border: '1px solid rgba(196,67,124,0.3)',
        borderRadius: 20, padding: '3px 10px',
        color: '#9E2E60', fontSize: 11, fontWeight: 600,
        marginBottom: 12,
      }}>
        {cs.principle}
      </div>

      {/* Key lesson */}
      <p style={{ color: '#1A4A4A', fontSize: 13, lineHeight: 1.65, marginBottom: 16 }}>
        {cs.keyLesson}
      </p>

      {/* Metrics */}
      {cs.metrics && (
        <p style={{
          color: '#C4437C', fontSize: 11,
          fontFamily: 'Space Mono, monospace',
          marginBottom: 16, opacity: 0.8,
        }}>
          📊 {cs.metrics}
        </p>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1.5px solid rgba(45,106,106,0.12)', paddingTop: 14 }}>
        <p style={{ color: '#2D6A6A', fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>
          💬 {prompt}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => onAsk(`Tell me more about the ${cs.title} case study (Case #${cs.id}) and what I can steal from it.`)}
            style={{
              background: '#C4437C', color: 'white',
              border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 12.5, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Explore this case →
          </button>
          <button
            onClick={() => onAsk(`${prompt} — apply this to the ${cs.brand} case (Case #${cs.id}) from Dan White's book.`)}
            style={{
              background: 'transparent', color: '#2D6A6A',
              border: '1.5px solid #9DC5C5', borderRadius: 8,
              padding: '8px 16px', fontSize: 12.5, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Answer the prompt
          </button>
        </div>
      </div>
    </div>
  );
}
