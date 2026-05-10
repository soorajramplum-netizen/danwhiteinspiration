import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/system-prompt';

export const runtime = 'edge';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ProviderResult {
  text: string;
  provider: string;
  model: string;
}

// ─────────────────────────────────────────────
// TIER 1 — Gemini (6 models, native API)
// Source: ai.google.dev/gemini-api/docs/models (May 2026)
// Note: gemini-3-flash-preview was shut down; gemini-3.1-flash-preview is current.
// ─────────────────────────────────────────────
const GEMINI_MODELS = [
  'gemini-3.1-pro-preview',        // Gemini 3 flagship (newest)
  'gemini-2.5-pro',                // 2.5 stable flagship
  'gemini-3.1-flash-preview',      // Fast Gemini 3 (replaces deprecated 3-flash-preview)
  'gemini-2.5-flash',              // 2.5 stable flash
  'gemini-3.1-flash-lite-preview', // Newest lite model
  'gemini-2.5-flash-lite',         // 2.5 stable lite
];

// ─────────────────────────────────────────────
// TIER 2 — OpenRouter (OpenAI-compatible)
// ─────────────────────────────────────────────
const OPENROUTER_MODELS = [
  'anthropic/claude-sonnet-4',
  'google/gemini-2.5-pro',
  'deepseek/deepseek-v3',
  'meta-llama/llama-4-maverick',
  'qwen/qwen3-235b-a22b',
];

// ─────────────────────────────────────────────
// TIER 3 — Groq (OpenAI-compatible, ultra-fast)
// Source: console.groq.com/docs/models (May 2026)
// ─────────────────────────────────────────────
const GROQ_MODELS = [
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'qwen-qwq-32b',
  'llama-3.1-8b-instant',
];

// ─────────────────────────────────────────────
// Gemini caller (native format)
// ─────────────────────────────────────────────
async function callGemini(
  model: string,
  apiKey: string,
  systemPrompt: string,
  messages: GeminiMessage[]
): Promise<ProviderResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: messages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 3000,
        topP: 0.9,
      },
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini ${model} failed (${res.status}): ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Gemini ${model}: empty response`);

  return { text, provider: 'gemini', model };
}

// ─────────────────────────────────────────────
// OpenRouter caller (OpenAI-compatible)
// ─────────────────────────────────────────────
async function callOpenRouter(
  model: string,
  apiKey: string,
  systemPrompt: string,
  messages: OpenAIMessage[]
): Promise<ProviderResult> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://marketing-oracle.vercel.app',
      'X-Title': 'Marketing Oracle',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 3000,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenRouter ${model} failed (${res.status}): ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`OpenRouter ${model}: empty response`);

  return { text, provider: 'openrouter', model };
}

// ─────────────────────────────────────────────
// Groq caller (OpenAI-compatible)
// ─────────────────────────────────────────────
async function callGroq(
  model: string,
  apiKey: string,
  systemPrompt: string,
  messages: OpenAIMessage[]
): Promise<ProviderResult> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 3000,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Groq ${model} failed (${res.status}): ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Groq ${model}: empty response`);

  return { text, provider: 'groq', model };
}

// ─────────────────────────────────────────────
// Convert Gemini history → OpenAI history
// ─────────────────────────────────────────────
function toOpenAIMessages(geminiMessages: GeminiMessage[]): OpenAIMessage[] {
  return geminiMessages.map((m) => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.parts.map((p) => p.text).join(''),
  }));
}

// ─────────────────────────────────────────────
// Main fallback orchestrator
// ─────────────────────────────────────────────
async function runFallbackChain(
  systemPrompt: string,
  geminiMessages: GeminiMessage[],
  geminiKey: string | undefined,
  openRouterKey: string | undefined,
  groqKey: string | undefined
): Promise<ProviderResult & { attemptLog: string[] }> {
  const attemptLog: string[] = [];
  const openAIMessages = toOpenAIMessages(geminiMessages);

  // ── Tier 1: Gemini ──────────────────────────
  if (geminiKey) {
    for (const model of GEMINI_MODELS) {
      try {
        console.log(`[Oracle] Trying Gemini: ${model}`);
        const result = await callGemini(model, geminiKey, systemPrompt, geminiMessages);
        attemptLog.push(`✓ gemini/${model}`);
        return { ...result, attemptLog };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[Oracle] Gemini ${model} failed:`, msg);
        attemptLog.push(`✗ gemini/${model}: ${msg.slice(0, 80)}`);
      }
    }
  } else {
    attemptLog.push('⚠ GEMINI_API_KEY not set — skipping Tier 1');
  }

  // ── Tier 2: OpenRouter ──────────────────────
  if (openRouterKey) {
    for (const model of OPENROUTER_MODELS) {
      try {
        console.log(`[Oracle] Trying OpenRouter: ${model}`);
        const result = await callOpenRouter(model, openRouterKey, systemPrompt, openAIMessages);
        attemptLog.push(`✓ openrouter/${model}`);
        return { ...result, attemptLog };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[Oracle] OpenRouter ${model} failed:`, msg);
        attemptLog.push(`✗ openrouter/${model}: ${msg.slice(0, 80)}`);
      }
    }
  } else {
    attemptLog.push('⚠ OPENROUTER_API_KEY not set — skipping Tier 2');
  }

  // ── Tier 3: Groq ────────────────────────────
  if (groqKey) {
    for (const model of GROQ_MODELS) {
      try {
        console.log(`[Oracle] Trying Groq: ${model}`);
        const result = await callGroq(model, groqKey, systemPrompt, openAIMessages);
        attemptLog.push(`✓ groq/${model}`);
        return { ...result, attemptLog };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[Oracle] Groq ${model} failed:`, msg);
        attemptLog.push(`✗ groq/${model}: ${msg.slice(0, 80)}`);
      }
    }
  } else {
    attemptLog.push('⚠ GROQ_API_KEY not set — skipping Tier 3');
  }

  // ── All tiers exhausted ─────────────────────
  throw new Error(
    `All providers exhausted.\n\nAttempt log:\n${attemptLog.join('\n')}`
  );
}

// ─────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { messages, question } = await request.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!geminiKey && !openRouterKey && !groqKey) {
      return NextResponse.json(
        {
          error:
            'No API keys configured. Set GEMINI_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY in your Vercel environment variables.',
        },
        { status: 500 }
      );
    }

    const systemPrompt = buildSystemPrompt();

    // Canonical history format is Gemini-style; we convert for OpenAI-compatible callers
    const conversationHistory: GeminiMessage[] = messages || [];
    const allMessages: GeminiMessage[] = [
      ...conversationHistory,
      { role: 'user', parts: [{ text: question }] },
    ];

    const result = await runFallbackChain(
      systemPrompt,
      allMessages,
      geminiKey,
      openRouterKey,
      groqKey
    );

    // Append assistant reply to history in Gemini format
    const updatedHistory: GeminiMessage[] = [
      ...allMessages,
      { role: 'model', parts: [{ text: result.text }] },
    ];

    return NextResponse.json({
      response: result.text,
      provider: result.provider,
      model: result.model,
      updatedHistory,
      // Expose attempt log only in development
      ...(process.env.NODE_ENV === 'development' && { attemptLog: result.attemptLog }),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Oracle] Fatal error:', msg);
    return NextResponse.json(
      {
        error: 'All AI providers failed. Please try again shortly.',
        detail: msg,
      },
      { status: 503 }
    );
  }
}
