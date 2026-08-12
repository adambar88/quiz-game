import type { AIQuestionPromptParams, Question } from '../types/quiz.ts';
import { getSystemPrompt, buildUserPrompt } from '../ai/prompts.ts';
import { validateAndParseAIResponse } from '../ai/validators.ts';
import { STATIC_QUESTION_BANK } from '../data/questions.ts';
import type { AISettings } from './storageService.ts';

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
    return getOfflineQuestions(params);
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
      return getOfflineQuestions(params);
    }
    throw error;
  }
}

function getOfflineQuestions(params: AIQuestionPromptParams): Question[] {
  let pool = [...STATIC_QUESTION_BANK];

  // Filter by category if specified and not 'all'
  if (params.category) {
    const matched = pool.filter((q) => q.category === params.category);
    if (matched.length >= params.count) {
      pool = matched;
    }
  }

  // Filter by difficulty if matches available
  const diffMatched = pool.filter((q) => q.difficulty === params.difficulty);
  if (diffMatched.length >= params.count) {
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
      const endpoint = (settings.serverEndpoint || 'https://adam-barczynski-resource.openai.azure.com/openai/v1').replace(/\/+$/, '');
      const apiKey = settings.serverApiKey || (import.meta as any).env?.VITE_OPENCLAW_API_KEY || '';
      const model = settings.serverModel || 'gpt-5-mini';

      const res = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: getSystemPrompt('openai') },
            { role: 'user', content: buildUserPrompt(params) },
          ],
          temperature: 0.7,
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

    case 'groq': {
      if (!settings.groqApiKey) throw new Error('Groq API Key is required.');
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.groqApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: getSystemPrompt('groq') },
            { role: 'user', content: buildUserPrompt(params) },
          ],
          temperature: 0.7,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq HTTP ${res.status}: ${errText}`);
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      const validated = validateAndParseAIResponse(content);
      if (!validated.valid) {
        throw new Error(`Groq response invalid: ${validated.errors.join('; ')}`);
      }
      return validated.questions;
    }

    case 'openai': {
      if (!settings.openaiApiKey) throw new Error('OpenAI API Key is required.');
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: getSystemPrompt('openai') },
            { role: 'user', content: buildUserPrompt(params) },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI HTTP ${res.status}: ${errText}`);
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      const validated = validateAndParseAIResponse(content);
      if (!validated.valid) {
        throw new Error(`OpenAI response invalid: ${validated.errors.join('; ')}`);
      }
      return validated.questions;
    }

    case 'gemini': {
      if (!settings.geminiApiKey) throw new Error('Gemini API Key is required.');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settings.geminiApiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${getSystemPrompt('gemini')}\n\n${buildUserPrompt(params)}` },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini HTTP ${res.status}: ${errText}`);
      }
      const data = await res.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const validated = validateAndParseAIResponse(content);
      if (!validated.valid) {
        throw new Error(`Gemini response invalid: ${validated.errors.join('; ')}`);
      }
      return validated.questions;
    }

    case 'ollama': {
      const endpoint = settings.ollamaEndpoint || 'http://localhost:11434/api/generate';
      const prompt = `System Instructions:\n${getSystemPrompt('groq')}\n\nTask:\n${buildUserPrompt(params)}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          prompt: prompt,
          stream: false,
          format: 'json',
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Ollama HTTP ${res.status}: ${errText}`);
      }
      const data = await res.json();
      const content = data.response || '';
      const validated = validateAndParseAIResponse(content);
      if (!validated.valid) {
        throw new Error(`Ollama response invalid: ${validated.errors.join('; ')}`);
      }
      return validated.questions;
    }

    default:
      return getOfflineQuestions(params);
  }
}
