import type { AIProvider, Category, Difficulty } from '../types/quiz.ts';
import type { Language } from '../i18n/translations.ts';

export interface AISettings {
  activeProvider: 'server' | 'offline';
  serverEndpoint: string;
  serverApiKey: string;
  serverModel: string;
  fallbackToOffline: boolean;
}

export interface QuizHistoryEntry {
  id: string;
  timestamp: number;
  dateStr: string;
  mode: string;
  category: Category | 'all';
  difficulty: Difficulty | 'dynamic';
  score: number;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  highestStreak: number;
  xpEarned: number;
  finalEloRating?: number;
}

export interface QuizStats {
  gamesPlayed: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalScore: number;
  highestStreak: number;
  highestEloRating: number;
  totalXp: number;
  categoryStats: Record<string, { total: number; correct: number }>;
}

const DEFAULT_AI_SETTINGS: AISettings = {
  activeProvider: 'server',
  serverEndpoint: (import.meta as any).env?.VITE_OPENCLAW_ENDPOINT || '/mindclash/api/ai',
  serverApiKey: '',
  serverModel: (import.meta as any).env?.VITE_OPENCLAW_MODEL || 'gpt-5-mini',
  fallbackToOffline: true,
};

const DEFAULT_STATS: QuizStats = {
  gamesPlayed: 0,
  totalQuestionsAnswered: 0,
  totalCorrect: 0,
  totalScore: 0,
  highestStreak: 0,
  highestEloRating: 1200,
  totalXp: 0,
  categoryStats: {},
};

export const storageService = {
  // Theme
  getTheme(): 'dark' | 'light' {
    try {
      const stored = localStorage.getItem('barczynski-theme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // ignore
    }
    return 'dark';
  },

  setTheme(theme: 'dark' | 'light'): void {
    try {
      localStorage.setItem('barczynski-theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    } catch {
      // ignore
    }
  },

  // Language
  getLanguage(): Language {
    try {
      const stored = localStorage.getItem('barczynski-quiz-lang');
      if (stored === 'pl' || stored === 'en') return stored;
    } catch {
      // ignore
    }
    return 'pl';
  },

  setLanguage(lang: Language): void {
    try {
      localStorage.setItem('barczynski-quiz-lang', lang);
    } catch {
      // ignore
    }
  },

  // AI Settings
  getAISettings(): AISettings {
    try {
      const raw = localStorage.getItem('quiz_ai_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.serverEndpoint && (parsed.serverEndpoint.includes('/quiz/api/ai') || parsed.serverEndpoint.includes('/brainsprint/api/ai'))) {
          parsed.serverEndpoint = '/mindclash/api/ai';
        }
        return { ...DEFAULT_AI_SETTINGS, ...parsed };
      }
    } catch {
      // ignore
    }
    return DEFAULT_AI_SETTINGS;
  },

  setAISettings(settings: AISettings): void {
    try {
      localStorage.setItem('quiz_ai_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  },

  // Stats
  getStats(): QuizStats {
    try {
      const raw = localStorage.getItem('quiz_stats');
      if (raw) {
        return { ...DEFAULT_STATS, ...JSON.parse(raw) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_STATS;
  },

  saveGameStats(result: {
    score: number;
    totalQuestions: number;
    correctCount: number;
    highestStreak: number;
    xpEarned: number;
    finalEloRating?: number;
    categoryBreakdown: Record<string, { total: number; correct: number }>;
  }): QuizStats {
    const stats = this.getStats();
    stats.gamesPlayed += 1;
    stats.totalQuestionsAnswered += result.totalQuestions;
    stats.totalCorrect += result.correctCount;
    stats.totalScore += result.score;
    stats.highestStreak = Math.max(stats.highestStreak, result.highestStreak);
    stats.totalXp += result.xpEarned;
    if (result.finalEloRating) {
      stats.highestEloRating = Math.max(stats.highestEloRating, result.finalEloRating);
    }

    Object.entries(result.categoryBreakdown).forEach(([cat, data]) => {
      if (!stats.categoryStats[cat]) {
        stats.categoryStats[cat] = { total: 0, correct: 0 };
      }
      stats.categoryStats[cat].total += data.total;
      stats.categoryStats[cat].correct += data.correct;
    });

    try {
      localStorage.setItem('quiz_stats', JSON.stringify(stats));
    } catch {
      // ignore
    }

    return stats;
  },

  // History
  getHistory(): QuizHistoryEntry[] {
    try {
      const raw = localStorage.getItem('quiz_history');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return [];
  },

  addHistoryEntry(entry: Omit<QuizHistoryEntry, 'id' | 'timestamp' | 'dateStr'>): QuizHistoryEntry {
    const history = this.getHistory();
    const now = new Date();
    const newEntry: QuizHistoryEntry = {
      ...entry,
      id: `game-${Date.now()}`,
      timestamp: now.getTime(),
      dateStr: now.toISOString().split('T')[0],
    };

    history.unshift(newEntry);
    // Keep last 50 games
    const trimmed = history.slice(0, 50);

    try {
      localStorage.setItem('quiz_history', JSON.stringify(trimmed));
    } catch {
      // ignore
    }

    return newEntry;
  },

  // Player Name / Nick
  getPlayerName(): string {
    try {
      const stored = localStorage.getItem('barczynski-quiz-player-name');
      if (stored && stored.trim().length > 0) return stored.trim();
    } catch {
      // ignore
    }
    return '';
  },

  setPlayerName(name: string): void {
    try {
      if (name && name.trim().length > 0) {
        localStorage.setItem('barczynski-quiz-player-name', name.trim());
      } else {
        localStorage.removeItem('barczynski-quiz-player-name');
      }
    } catch {
      // ignore
    }
  },
};
