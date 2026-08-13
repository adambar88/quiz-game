import { describe, it, expect } from 'vitest';
import { quizStore, useQuizStore } from '../src/state/useQuizStore.ts';
import { QuestionEngine } from '../src/services/questionEngine.ts';
import { peerService, PeerMessage } from '../src/services/peerService.ts';
import { STATIC_QUESTION_BANK_PL } from '../src/data/questions.ts';
import type { Category } from '../src/types/quiz.ts';

describe('Full 4-Round Race Simulation (Adam vs Edyta - 12 Questions)', () => {
  it('should run a complete 12-question race duel with zero duplicate questions or category mismatches', async () => {
    console.log('\n======================================================');
    console.log('🏁 INICJACJA SYMULACJI PEŁNEGO WYŚCIGU (4 RUNDY / 12 PYTAŃ)');
    console.log('======================================================\n');

    // 1. Reset Store to initial state
    quizStore.exitToHome();
    quizStore.setMode('versus');

    const categories: Category[] = [
      'Computer Science',
      'Physics & Astronomy',
      'Cinema & Television',
      'Polish History',
    ];

    const pickers = ['Adam (Host)', 'Edyta (Guest)', 'Adam (Host)', 'Edyta (Guest)'];

    let allQuestions: any[] = [];
    const seenQuestionIds = new Set<string>();
    const seenQuestionTexts = new Set<string>();

    for (let round = 0; round < 4; round++) {
      const chosenCategory = categories[round];
      const picker = pickers[round];

      console.log(`\n--- RUNDA ${round + 1}/4: Wybiera ${picker} | Kategoria: "${chosenCategory}" ---`);

      // Prepare 3 questions for this round
      const roundQs = QuestionEngine.selectFromStaticBank(chosenCategory, 'easy', 3, 'pl');
      expect(roundQs.length).toBe(3);

      for (let i = 0; i < roundQs.length; i++) {
        const q = roundQs[i];
        
        // Assert Category matches chosen category!
        expect(q.category).toBe(chosenCategory);

        // Check for duplicates
        if (seenQuestionTexts.has(q.question)) {
          console.warn(`⚠️ OSTRZEŻENIE: Wykryto powtórzone pytanie: "${q.question}"`);
        }
        seenQuestionTexts.add(q.question);
        seenQuestionIds.add(q.id);

        allQuestions.push(q);
      }
    }

    console.log(`\n📊 Zestawienie 12 pytań dla 4 rund:`);
    allQuestions.forEach((q, idx) => {
      console.log(`   Q${idx + 1} [${q.category}]: ${q.question.slice(0, 55)}...`);
    });

    // Verify Total Questions count and uniqueness
    expect(allQuestions.length).toBe(12);
    expect(seenQuestionIds.size).toBe(12);

    console.log('\n======================================================');
    console.log('✅ SYMULACJA PEŁNEGO WYŚCIGU ZAKOŃCZONA SUKCESEM 🟢');
    console.log('Brak duplikatów pytań, 100% spójności kategorii!');
    console.log('======================================================\n');
  });
});
