import type { AIValidationResult, Category, Difficulty, Question } from '../types/quiz.ts';

/**
 * Standard JSON Schema Draft-07 for Quiz Question Array Validation
 */
export const QUIZ_QUESTION_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'QuizQuestionArray',
  type: 'array',
  items: {
    type: 'object',
    required: ['category', 'question', 'options', 'correctIndex', 'explanation', 'difficulty'],
    properties: {
      id: { type: 'string' },
      category: {
        type: 'string',
        enum: ['Computer Science', 'Web Dev', 'Science', 'Mathematics', 'History', 'Pop Culture'],
      },
      question: { type: 'string', minLength: 5 },
      options: {
        type: 'array',
        minItems: 4,
        maxItems: 4,
        items: { type: 'string', minLength: 1 },
      },
      correctIndex: {
        type: 'integer',
        minimum: 0,
        maximum: 3,
      },
      explanation: { type: 'string', minLength: 5 },
      difficulty: {
        type: 'string',
        enum: ['easy', 'medium', 'hard', 'expert'],
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
      baseElo: { type: 'number' },
    },
    additionalProperties: true,
  },
};

export const VALID_CATEGORIES: Category[] = [
  'Computer Science',
  'Web Dev',
  'Science',
  'Mathematics',
  'History',
  'Pop Culture',
];

export const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

/**
 * Robust JSON Sanitizer and Cleanup Parser.
 * Strips markdown code blocks, cleans up trailing commas, unescaped quotes, control chars.
 */
export function cleanRawJsonResponse(rawText: string): string {
  if (!rawText) return '';

  let cleaned = rawText.trim();

  // Strip Markdown code block fences (e.g. ```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  // Extract content between first '[' and last ']' if surrounded by conversational fluff
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  } else {
    // If not array, check object wrapper like {"questions": [...]}
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }

  // Remove trailing commas before closing brackets or braces
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

  // Replace invalid control characters (except newline, tab, carriage return)
  cleaned = cleaned.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, '');

  return cleaned.trim();
}

/**
 * Validate and sanitize generated question objects against strict schema.
 */
export function validateAndParseAIResponse(rawResponse: string): AIValidationResult {
  const errors: string[] = [];
  const validQuestions: Question[] = [];

  const cleanedJson = cleanRawJsonResponse(rawResponse);

  if (!cleanedJson) {
    return {
      valid: false,
      questions: [],
      errors: ['Raw AI response was empty or contained no JSON structure'],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanedJson);
  } catch (err: unknown) {
    const parseError = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      questions: [],
      errors: [`JSON parse failure: ${parseError}`],
      rawCleanedJson: cleanedJson,
    };
  }

  // Extract array if wrapped in object (e.g., { "questions": [...] } or { "data": [...] })
  let itemsToValidate: unknown[] = [];
  if (Array.isArray(parsed)) {
    itemsToValidate = parsed;
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    const possibleArray = obj.questions || obj.data || obj.items || Object.values(obj).find(Array.isArray);
    if (Array.isArray(possibleArray)) {
      itemsToValidate = possibleArray;
    } else {
      return {
        valid: false,
        questions: [],
        errors: ['JSON object does not contain a valid array of question objects'],
        rawCleanedJson: cleanedJson,
      };
    }
  } else {
    return {
      valid: false,
      questions: [],
      errors: ['Parsed JSON is neither an array nor an object container'],
      rawCleanedJson: cleanedJson,
    };
  }

  // Validate each question element
  itemsToValidate.forEach((item, index) => {
    const itemPrefix = `Question[${index}]`;

    if (!item || typeof item !== 'object') {
      errors.push(`${itemPrefix}: Item is not an object.`);
      return;
    }

    const q = item as Record<string, unknown>;

    // Category
    const category = String(q.category || '').trim() as Category;
    if (!VALID_CATEGORIES.includes(category)) {
      errors.push(`${itemPrefix}: Invalid or missing category "${q.category}". Must be one of: ${VALID_CATEGORIES.join(', ')}.`);
    }

    // Question text
    const questionText = String(q.question || '').trim();
    if (!questionText || questionText.length < 5) {
      errors.push(`${itemPrefix}: Missing or too short question text.`);
    }

    // Options array
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`${itemPrefix}: "options" must be an array of exactly 4 strings.`);
    } else {
      const emptyOptIndex = q.options.findIndex((opt) => typeof opt !== 'string' || !opt.trim());
      if (emptyOptIndex !== -1) {
        errors.push(`${itemPrefix}: Option at index ${emptyOptIndex} is empty or not a string.`);
      }
    }

    // Correct index
    const correctIndex = Number(q.correctIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      errors.push(`${itemPrefix}: "correctIndex" must be an integer between 0 and 3.`);
    }

    // Explanation
    const explanation = String(q.explanation || '').trim();
    if (!explanation || explanation.length < 5) {
      errors.push(`${itemPrefix}: Missing or too short explanation.`);
    }

    // Difficulty
    const difficulty = String(q.difficulty || '').toLowerCase().trim() as Difficulty;
    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      errors.push(`${itemPrefix}: Invalid difficulty "${q.difficulty}". Must be one of: ${VALID_DIFFICULTIES.join(', ')}.`);
    }

    // If no fatal errors for this item, format as clean Question object
    if (
      VALID_CATEGORIES.includes(category) &&
      questionText.length >= 5 &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      Number.isInteger(correctIndex) &&
      correctIndex >= 0 &&
      correctIndex <= 3 &&
      explanation.length >= 5 &&
      VALID_DIFFICULTIES.includes(difficulty)
    ) {
      const formattedQuestion: Question = {
        id: String(q.id || `gen-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`),
        category,
        question: questionText,
        options: [
          String(q.options[0]).trim(),
          String(q.options[1]).trim(),
          String(q.options[2]).trim(),
          String(q.options[3]).trim(),
        ],
        correctIndex,
        explanation,
        difficulty,
        tags: Array.isArray(q.tags) ? q.tags.map(String) : [category.toLowerCase()],
        baseElo: typeof q.baseElo === 'number' ? q.baseElo : undefined,
      };

      validQuestions.push(formattedQuestion);
    }
  });

  const valid = errors.length === 0 && validQuestions.length > 0;

  return {
    valid,
    questions: validQuestions,
    errors,
    rawCleanedJson: cleanedJson,
  };
}
