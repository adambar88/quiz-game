import type { AIProvider, AIQuestionPromptParams } from '../types/quiz.ts';

/**
 * Common JSON output schema specification described in natural language for AI prompts.
 */
export const QUESTION_FORMAT_INSTRUCTIONS = `
CRITICAL: You MUST respond ONLY with a raw JSON array of question objects.
Do NOT include markdown formatting (no \`\`\`json or \`\`\`), no introductory text, no trailing text.

Each object in the JSON array MUST strictly match this schema:
[
  {
    "category": "Computer Science | Web Dev | Science | Mathematics | History | Pop Culture",
    "question": "Clear, precise question stem text here?",
    "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
    "correctIndex": 0,
    "explanation": "Detailed explanation of why the correct option is right and others are incorrect.",
    "difficulty": "easy | medium | hard | expert",
    "tags": ["tag1", "tag2"]
  }
]

RULES:
1. "options" MUST contain EXACTLY 4 distinct choices.
2. "correctIndex" MUST be an integer between 0 and 3 inclusive, corresponding to the correct option.
3. "category" MUST be one of: "Computer Science", "Web Dev", "Science", "Mathematics", "History", "Pop Culture".
4. "difficulty" MUST be one of: "easy", "medium", "hard", "expert".
5. Distractors must be plausible but unambiguously incorrect.
`;

/**
 * Groq Llama 3.3 70B System Prompt Template
 * Model: llama-3.3-70b-versatile
 */
export const GROQ_LLAMA3_SYSTEM_PROMPT = `
<system_instructions>
You are an expert quiz question generator API service.
Your task is to generate high-quality, mathematically sound, facts-checked quiz questions.
You output ONLY valid JSON without any markdown formatting or commentary.
</system_instructions>

${QUESTION_FORMAT_INSTRUCTIONS}
`;

/**
 * OpenAI GPT-4o-mini System Prompt Template
 * Model: gpt-4o-mini (Uses response_format: { type: "json_object" } or structured outputs)
 */
export const OPENAI_GPT4O_MINI_SYSTEM_PROMPT = `
You are a specialized AI quiz generator engine for an interactive trivia platform.
Generate accurate, engaging, and balanced quiz questions.
Return JSON output adhering strictly to the required schema.

${QUESTION_FORMAT_INSTRUCTIONS}
`;

/**
 * Gemini 1.5 Flash System Prompt Template
 * Model: gemini-1.5-flash (Configured with responseMimeType: "application/json")
 */
export const GEMINI_FLASH_SYSTEM_PROMPT = `
You are an advanced automated test item generator.
You must construct high-discrimination multiple-choice question objects in strict JSON format.

${QUESTION_FORMAT_INSTRUCTIONS}
`;

/**
 * Get Provider-Specific System Prompt
 */
export function getSystemPrompt(_provider?: AIProvider): string {
  return OPENAI_GPT4O_MINI_SYSTEM_PROMPT;
}

/**
 * Construct User Prompt for Quiz Generation
 */
export function buildUserPrompt(params: AIQuestionPromptParams): string {
  const { category, difficulty, count, topicFocus } = params;
  
  let prompt = `Generate exactly ${count} ${difficulty.toUpperCase()} difficulty quiz questions for category "${category}".`;
  
  if (topicFocus) {
    prompt += ` Specific focus area: "${topicFocus}".`;
  }

  prompt += ` Ensure all ${count} questions have 4 options and correctIndex ranging from 0 to 3. Output ONLY the JSON array.`;
  
  return prompt;
}
