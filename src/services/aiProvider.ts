import type { AIQuestionPromptParams, Question } from '../types/quiz.ts';
import { getSystemPrompt, buildUserPrompt } from '../ai/prompts.ts';
import { validateAndParseAIResponse } from '../ai/validators.ts';
import { STATIC_QUESTION_BANK } from '../data/questions.ts';
import type { AISettings } from './storageService.ts';
import { QuestionEngine } from './questionEngine.ts';

export async function testProviderHealth(settings: AISettings): Promise<{ ok: boolean; message: string }> {
  const provider = settings.activeProvider;

  if (provider === 'offline') {
    return { ok: true, message: 'Offline static question bank active (36 curated questions).' };
  }

  try {
    const testParams: AIQuestionPromptParams = {
      category: 'Computer Science',
      difficulty: 'easy',
      count: 1,
    };

    const questions = await fetchQuestionsFromProvider(testParams, settings);
    if (questions && questions.length > 0) {
      return { ok: true, message: `Successfully generated ${questions.length} test question from ${provider}.` };
    }
    return { ok: false, message: `Provider ${provider} returned invalid or empty response.` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Health check failed for ${provider}: ${msg}` };
  }
}

export async function generateQuestions(
  params: AIQuestionPromptParams,
  settings: AISettings
): Promise<Question[]> {
  const provider = settings.activeProvider;

  if (provider === 'offline') {
    return QuestionEngine.selectFromStaticBank(
      params.category || 'all',
      params.difficulty || 'medium',
      params.count,
      params.lang || 'pl'
    );
  }

  try {
    const questions = await fetchQuestionsFromProvider(params, settings);
    if (questions.length > 0) {
      return questions;
    }
    throw new Error('AI returned no valid questions after validation.');
  } catch (error) {
    console.warn(`[AI Provider] ${provider} failed.`, error);
    if (settings.fallbackToOffline) {
      console.log('[AI Provider] Falling back to curated offline static question bank.');
      return QuestionEngine.selectFromStaticBank(
        params.category || 'all',
        params.difficulty || 'medium',
        params.count,
        params.lang || 'pl'
      );
    }
    throw error;
  }
}

function getOfflineQuestions(params: AIQuestionPromptParams): Question[] {
  let pool = [...STATIC_QUESTION_BANK];

  // Filter by category if specified and not 'all'
  if (params.category && params.category !== 'all') {
    const matched = pool.filter((q) => q.category === params.category);
    if (matched.length > 0) {
      pool = matched;
    }
  }

  // Filter by difficulty if matches available
  const diffMatched = pool.filter((q) => q.difficulty === params.difficulty);
  if (diffMatched.length > 0) {
    pool = diffMatched;
  }

  // Shuffle pool using Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // If pool is smaller than count, duplicate/loop items
  const result: Question[] = [];
  for (let i = 0; i < params.count; i++) {
    const base = pool[i % pool.length];
    result.push({
      ...base,
      id: `${base.id}-off-${i}-${Date.now()}`,
      category: params.category && params.category !== 'all' ? params.category : base.category,
    });
  }

  return result;
}

async function fetchQuestionsFromProvider(
  params: AIQuestionPromptParams,
  settings: AISettings
): Promise<Question[]> {
  const provider = settings.activeProvider;

  switch (provider) {
    case 'server': {
      const rawEndpoint = settings.serverEndpoint || (import.meta as any).env?.VITE_OPENCLAW_ENDPOINT || '/mindclash/api/ai';
      const endpoint = rawEndpoint.replace(/\/+$/, '');
      const apiKey = settings.serverApiKey || (import.meta as any).env?.VITE_OPENCLAW_API_KEY || '';
      const model = settings.serverModel || (import.meta as any).env?.VITE_OPENCLAW_MODEL || 'gpt-5-mini';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['api-key'] = apiKey;
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const fetchUrl = `${endpoint}/chat/completions`;

      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: getSystemPrompt('server') },
            { role: 'user', content: buildUserPrompt(params) },
          ],
          temperature: 1,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenClaw Server LLM HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      const validated = validateAndParseAIResponse(content);
      if (!validated.valid) {
        throw new Error(`OpenClaw Server LLM response invalid: ${validated.errors.join('; ')}`);
      }
      return validated.questions;
    }

    default:
      return getOfflineQuestions(params);
  }
}
