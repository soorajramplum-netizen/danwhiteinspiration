'use client';

import { useState, useEffect } from 'react';
import { CASE_STUDIES, CaseStudy } from '@/lib/knowledge-base';

interface Props {
  onExit: () => void;
}

type ChallengePhase = 'intro' | 'guessing' | 'reveal' | 'score';

const WRONG_OPTIONS_POOL = [
  'Blue Ocean Strategy',
  'Occasion-Based Expansion',
  'Celebrity Endorsement',
  'User-Generated Content',
  'Operational Excellence',
  'Physical Availability',
  'Brand Architecture',
  'Cultural Adaptation',
  'Scarcity & Collectability',
  'Referral Marketing',
  'Premiumisation',
  'Category Creation',
  'Founder-Led Brand',
  'Viral Amplification',
  'Repositioning',
  'Jingles & Mnemonics',
  'Long-Running Slogan',
  'Personalization at Scale',
  'Product Leadership',
  'Purpose-Led Strategy',
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildOptions(correct: string): string[] {
  const wrong = shuffle(WRONG_OPTIONS_POOL.filter(p => p !== correct)).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

function pickChallenges(count = 5): CaseStudy[] {
  return shuffle(CASE_STUDIES).slice(0, count);
}

// Scenario prompts — disguise the brand name
function buildScenario(cs: CaseStudy): string {
  const scenarios: Record<number, string> = {
    2:  'An online marketplace paused all paid search during a crisis. Traffic barely dropped. They realised they\'d been massively overspending on performance and rebuilt their strategy around brand investment.',
    3:  'A discount retailer limited its range to a fraction of competitors\', used display-ready packaging, eliminated in-store music, and designed coin-deposit trolleys. Its cost structure became almost impossible to match.',
    13: 'A property developer kept losing sales despite upgrading units. Deep interviews revealed the real barrier wasn\'t the price or the kitchen — it was a dining table customers couldn\'t bear to leave behind.',
    20: 'A soft drink brand replaced its iconic logo with 150 popular first names. Sales lifted 7%. Half the uplift came from lapsed buyers who suddenly felt personally connected.',
    23: 'A price comparison site introduced an aristocratic Russian meerkat to clear up confusion with a similarly named rival. Quote requests rose 83% in 9 weeks.',
    25: 'A diamond company didn\'t just advertise jewellery — it created a cultural expectation that no engagement was complete without one. Diamond ring adoption went from 10% to 80% of brides in 50 years.',
    40: 'A dark, heavy beer brand known for winter pubs and older drinkers ran bold summer outdoor campaigns. By the following year it had become the nation\'s best-selling draught.',
    52: 'A fast food chain spotted that foreign residents were buying fried chicken as a Christmas substitute. They leaned in hard, created a special bundle, and it became a national festive institution.',
    55: 'A chocolate brand noticed that its name sounded like a local phrase meaning "you will surely succeed." They embraced this by partnering with postal services to create an encouragement gift tradition.',
    73: 'A games company stopped competing with the market leaders for teenage boys. Instead it targeted women, older adults, and families with motion controls and cheerful packaging, at a lower price point.',
    78: 'A clothing brand published a full-page newspaper ad urging people not to buy their jacket. Sales rose 30% the following year.',
    82: 'An energy drink brand sent a man to the edge of space and broadcast it live in 50 countries. Cost: €30M. Return: measurable sales uplift plus years of cultural talkability.',
    98: 'A tea brand stuck religiously to one advertising theme for 7 years, maintained its premium price, and used dry regional humour throughout. It went from third to first in the UK market.',
  };

  if (scenarios[cs.id]) return scenarios[cs.id];

  // Generic fallback scenario from summary
  const sentences = cs.summary.split('. ');
  const anonymised = sentences
    .slice(0, 2)
    .join('. ')
    .replace(new RegExp(cs.brand, 'gi'), 'This brand')
    .replace(/\b(their|its)\b/gi, 'their');
  return anonymised + '.';
}

export default function ChallengeMode({ onExit }: Props) {
  const [phase, setPhase] = useState<ChallengePhase>('intro');
  const [challenges, setChallenges] = useState<CaseStudy[]>([]);
  const [current, setCurrent] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<{ correct: boolean; case: CaseStudy }[]>([]);

  const TOTAL = 5;

  useEffect(() => {
    const picked = pickChallenges(TOTAL);
    setChallenges(picked);
  }, []);

  useEffect(() => {
    if (challenges[current]) {
      setOptions(buildOptions(challenges[current].principle));
    }
  }, [challenges, current]);

  const handleGuess = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === challenges[current].principle;
    if (correct) setScore(s => s + 1);
    setResults(r => [...r, { correct, case: challenges[current] }]);
    setPhase('reveal');
  };

  const handleNext = () => {
    if (current + 1 >= TOTAL) {
      setPhase('score');
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setPhase('guessing');
    }
  };

  const handleRestart = () => {
    const picked = pickChallenges(TOTAL);
    setChallenges(picked);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setResults([]);
    setPhase('intro');
  };

  const cs = challenges[current];

  const scoreLabel = () => {
    if (score === TOTAL) return { emoji: '🏆', text: 'Perfect score! Dan White would be proud.' };
    if (score >= 3) return { emoji: '🎯', text: 'Strong marketing instincts. Keep sharpening.' };
    if (score >= 2) return { emoji: '📚', text: 'Good effort — revisit the cases you missed.' };
    return { emoji: '💪', text: 'Every expert started somewhere. Try again!' };
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header bar */}
      <div style={{
        background: 'rgba(196,67,124,0.08)',
        borderBottom: '1.5px solid rgba(196,67,124,0.2)',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🎮</span>
          <span style={{ color: '#1A4A4A', fontWeight: 700, fontSize: 14 }}>Challenge Mode</span>
          {phase === 'guessing' || phase === 'reveal' ? (
            <span style={{
              background: '#C4437C', color: 'white',
              fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 10, marginLeft: 4,
            }}>
              {current + 1} / {TOTAL}
            </span>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {(phase === 'guessing' || phase === 'reveal') && (
            <span style={{ color: '#C4437C', fontWeight: 700, fontSize: 13 }}>
              Score: {score}
            </span>
          )}
          <button
            onClick={onExit}
            style={{
              color: '#2D6A6A', background: 'transparent',
              border: '1.5px solid #9DC5C5', borderRadius: 8,
              padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500,
            }}
          >
            ← Back to chat
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="chat-scroll" style={{ flex: 1, padding: '24px 20px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* ── Intro ── */}
          {phase === 'intro' && (
            <div className="fade-in" style={{ textAlign: 'center', paddingTop: 40 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎮</div>
              <h2 style={{ color: '#1A4A4A', fontWeight: 700, fontSize: '1.5rem', marginBottom: 12 }}>
                Can you spot the principle?
              </h2>
              <p style={{ color: '#2D6A6A', fontSize: 14, lineHeight: 1.7, maxWidth: 440, margin: '0 auto 28px' }}>
                I'll describe a real marketing scenario from Dan White's book without naming the brand.
                Your job: identify the marketing principle at work. {TOTAL} rounds, 4 options each.
              </p>
              <div style={{
                display: 'flex', gap: 16, justifyContent: 'center',
                flexWrap: 'wrap', marginBottom: 32,
              }}>
                {[
                  { emoji: '📖', text: '5 real scenarios' },
                  { emoji: '🎯', text: '4 options each' },
                  { emoji: '🏆', text: 'Instant reveal' },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.6)',
                    border: '1.5px solid rgba(45,106,106,0.15)',
                    borderRadius: 12, padding: '12px 18px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{item.emoji}</div>
                    <div style={{ color: '#1A4A4A', fontSize: 12, fontWeight: 600 }}>{item.text}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setPhase('guessing')}
                style={{
                  background: '#C4437C', color: 'white',
                  border: 'none', borderRadius: 10,
                  padding: '12px 32px', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Start Challenge →
              </button>
            </div>
          )}

          {/* ── Guessing ── */}
          {(phase === 'guessing' || phase === 'reveal') && cs && (
            <div className="fade-in">
              {/* Progress bar */}
              <div style={{ background: 'rgba(45,106,106,0.1)', borderRadius: 4, height: 6, marginBottom: 24 }}>
                <div style={{
                  background: '#C4437C', height: '100%', borderRadius: 4,
                  width: `${((current + (phase === 'reveal' ? 1 : 0)) / TOTAL) * 100}%`,
                  transition: 'width .4s ease',
                }} />
              </div>

              {/* Scenario card */}
              <div style={{
                background: 'rgba(255,255,255,0.7)',
                border: '2px solid rgba(45,106,106,0.15)',
                borderRadius: 16, padding: '20px 22px', marginBottom: 20,
              }}>
                <p style={{
                  color: '#C4437C', fontSize: 11, fontWeight: 700,
                  fontFamily: 'Space Mono, monospace', textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: 10,
                }}>
                  📋 The Scenario
                </p>
                <p style={{ color: '#1A4A4A', fontSize: 14.5, lineHeight: 1.75 }}>
                  {buildScenario(cs)}
                </p>
              </div>

              {/* Question */}
              <p style={{ color: '#2D6A6A', fontWeight: 600, fontSize: 13.5, marginBottom: 14 }}>
                Which marketing principle best describes what's happening here?
              </p>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {options.map((opt, i) => {
                  const isCorrect = opt === cs.principle;
                  const isSelected = opt === selected;
                  let bg = 'rgba(255,255,255,0.6)';
                  let border = '1.5px solid rgba(45,106,106,0.15)';
                  let color = '#1A4A4A';
                  if (phase === 'reveal') {
                    if (isCorrect) { bg = 'rgba(34,197,94,0.15)'; border = '2px solid #22C55E'; color = '#166534'; }
                    else if (isSelected) { bg = 'rgba(239,68,68,0.1)'; border = '2px solid #EF4444'; color = '#991B1B'; }
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleGuess(opt)}
                      disabled={phase === 'reveal'}
                      style={{
                        background: bg, border, borderRadius: 10,
                        padding: '12px 16px', textAlign: 'left',
                        color, fontSize: 13.5, fontWeight: isCorrect && phase === 'reveal' ? 700 : 500,
                        cursor: phase === 'reveal' ? 'default' : 'pointer',
                        transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 10,
                      }}
                    >
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: phase === 'reveal' && isCorrect ? '#22C55E' : phase === 'reveal' && isSelected ? '#EF4444' : 'rgba(45,106,106,0.1)',
                        color: phase === 'reveal' && (isCorrect || isSelected) ? 'white' : '#2D6A6A',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                        fontFamily: 'Space Mono, monospace',
                      }}>
                        {phase === 'reveal' && isCorrect ? '✓' : phase === 'reveal' && isSelected && !isCorrect ? '✗' : String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Reveal panel */}
              {phase === 'reveal' && (
                <div className="fade-in" style={{
                  background: selected === cs.principle ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.06)',
                  border: `2px solid ${selected === cs.principle ? '#22C55E' : '#EF4444'}`,
                  borderRadius: 14, padding: '16px 18px', marginBottom: 20,
                }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#1A4A4A', marginBottom: 6 }}>
                    {selected === cs.principle ? '🎉 Correct!' : `❌ The answer was: ${cs.principle}`}
                  </p>
                  <p style={{ color: '#2D6A6A', fontSize: 13, lineHeight: 1.65, marginBottom: 8 }}>
                    <strong style={{ color: '#1A4A4A' }}>Case #{cs.id} — {cs.brand}:</strong> {cs.keyLesson}
                  </p>
                  {cs.metrics && (
                    <p style={{ color: '#C4437C', fontSize: 11, fontFamily: 'Space Mono, monospace' }}>
                      📊 {cs.metrics}
                    </p>
                  )}
                </div>
              )}

              {phase === 'reveal' && (
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={handleNext}
                    style={{
                      background: '#C4437C', color: 'white',
                      border: 'none', borderRadius: 10,
                      padding: '10px 24px', fontSize: 13.5, fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {current + 1 >= TOTAL ? 'See Results →' : 'Next Round →'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Score ── */}
          {phase === 'score' && (
            <div className="fade-in" style={{ textAlign: 'center', paddingTop: 32 }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>{scoreLabel().emoji}</div>
              <h2 style={{ color: '#1A4A4A', fontWeight: 700, fontSize: '1.6rem', marginBottom: 8 }}>
                {score} / {TOTAL}
              </h2>
              <p style={{ color: '#2D6A6A', fontSize: 14, marginBottom: 28 }}>
                {scoreLabel().text}
              </p>

              {/* Results summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, textAlign: 'left' }}>
                {results.map((r, i) => (
                  <div key={i} style={{
                    background: r.correct ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.06)',
                    border: `1.5px solid ${r.correct ? '#22C55E' : '#EF4444'}`,
                    borderRadius: 10, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 16 }}>{r.correct ? '✅' : '❌'}</span>
                    <div>
                      <p style={{ color: '#1A4A4A', fontSize: 12.5, fontWeight: 600 }}>
                        Case #{r.case.id} — {r.case.brand}
                      </p>
                      <p style={{ color: '#2D6A6A', fontSize: 11.5 }}>{r.case.principle}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleRestart}
                  style={{
                    background: '#C4437C', color: 'white',
                    border: 'none', borderRadius: 10,
                    padding: '11px 24px', fontSize: 13.5, fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Play Again
                </button>
                <button
                  onClick={onExit}
                  style={{
                    background: 'transparent', color: '#2D6A6A',
                    border: '1.5px solid #9DC5C5', borderRadius: 10,
                    padding: '11px 24px', fontSize: 13.5, fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Back to Chat
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
