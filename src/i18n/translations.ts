export type Language = 'pl' | 'en';

export const translations = {
  pl: {
    // Header
    title: 'Quiz',
    subtitle: '.barczynski.dev',
    statsTooltip: 'Statystyki',
    settingsTooltip: 'Ustawienia Serwera',
    soundOn: 'Włącz dźwięk',
    soundOff: 'Wycisz dźwięk',

    // Modes
    modes: {
      classic: {
        title: 'Klasyczny 10Q',
        badge: '10 Pytań',
        description: '10 pytań z dynamicznym naliczaniem punktów. Szybki trening wiedzy.',
      },
      survival: {
        title: 'Przetrwanie',
        badge: '3 Życia',
        description: 'Gra bez końca. Poziom trudności rośnie wraz z Twoją serią zwycięstw.',
      },
      blitz: {
        title: 'Szybki Blitz',
        badge: '10s Czasu',
        description: 'Tylko 10 sekund na każde pytanie. Liczy się natychmiastowy refleks!',
      },
      custom: {
        title: 'Własny Temat',
        badge: 'Własny',
        description: 'Wpisz dowolne zagadnienie do wygenerowania dedykowanego zestawu pytań.',
      },
      daily: {
        title: 'Wyzwanie Dnia',
        badge: 'Dzisiejszy Zestaw',
        description: 'Unikalne wyzwanie odnawiane codziennie. Sprawdź się dzisiaj.',
      },
    },

    // Selectors
    categoryLabel: 'Kategoria',
    allCategories: 'Wszystkie kategorie',
    categories: {
      'Computer Science': 'Informatyka',
      'Web Dev': 'Web Development',
      'Tech & Future': 'Technologia Przyszłości',
      'Cybersecurity': 'Cyberbezpieczeństwo',
      'Gaming & Esports': 'Gry & Esports',
      'Science': 'Biologia & Chemia',
      'Physics & Astronomy': 'Fizyka & Astronomia',
      'Mathematics': 'Matematyka',
      'Geography & Earth': 'Geografia & Ziemia',
      'Medicine & Health': 'Medycyna & Zdrowie',
      'History': 'Historia Świata',
      'Polish History': 'Historia Polski',
      'Mythology & Folklore': 'Mitologia & Legendy',
      'Politics & Civics': 'Polityka & Prawo',
      'Philosophy & Psychology': 'Filozofia & Psychologia',
      'Pop Culture': 'Popkultura',
      'Cinema & Television': 'Film & TV',
      'Music': 'Muzyka',
      'Literature & Books': 'Literatura & Książki',
      'Art & Architecture': 'Sztuka & Architektura',
      'Sports': 'Sport',
      'Food & Culinary': 'Kulinaria & Gastronomia',
      'Business & Finance': 'Biznes & Finanse',
      'Automotive & Transport': 'Motoryzacja & Transport',
    },

    difficultyLabel: 'Poziom Trudności',
    difficulties: {
      easy: 'Łatwy',
      medium: 'Średni',
      hard: 'Trudny',
      expert: 'Ekspert',
    },

    customPromptLabel: 'Wpisz Temat Quizu',
    customPromptPlaceholder: 'np. Historia Polski, Astronomia, JavaScript, Filmografia...',

    dailySeedLabel: 'Data Wyzwania',
    copySeed: 'Kopiuj Seed',
    seedCopied: 'Skopiowano seed wyzwania:',

    startQuiz: 'ROZPOCZNIJ QUIZ 🚀',
    generating: 'Generowanie pytań...',

    // Generating State
    generatingTitle: 'Generowanie Pytań',
    generatingSubtitle: 'Tworzenie unikalnego zestawu pytań po polsku...',
    generatingDetailsMode: 'Tryb',
    generatingDetailsTopic: 'Temat',
    switchToOffline: '⚡ Przełącz na szybką bazę offline',

    // Quiz Arena
    score: 'Wynik',
    streak: 'Seria',
    lives: 'Życia',
    questionCount: 'Pytanie',
    of: 'z',
    submit: 'Zatwierdź odpowiedź',
    next: 'Następne pytanie →',
    correct: 'Świetnie! Poprawna odpowiedź',
    wrong: 'Błędna odpowiedź',
    explanation: 'Wyjaśnienie',

    // Game Over
    gameOverTitle: 'Koniec Gry!',
    finalScore: 'Końcowy Wynik',
    accuracy: 'Dokładność',
    bestStreak: 'Najlepsza Seria',
    xpEarned: 'Zdobyte XP',
    eloRating: 'Ranking ELO',
    playAgain: 'Zagraj Ponownie',
    reviewAnswers: 'Przejrzyj Odpowiedzi',

    // Review Overlay
    reviewTitle: 'Podsumowanie Odpowiedzi',
    backToResults: '← Powrót do wyników',
    yourAnswer: 'Twoja odpowiedź',
    correctAnswer: 'Poprawna odpowiedź',

    // Modals
    aiSettingsTitle: 'Ustawienia Serwera',
    engineLabel: 'Wybór Silnika Pytań',
    serverAiEngine: 'Serwer Pytań',
    offlineBankEngine: 'Baza Offline',
    serverUrlLabel: 'Adres Serwera',
    serverKeyLabel: 'Klucz API (Opcjonalny)',
    serverKeyPlaceholder: 'Domyślny klucz serwera',
    modelLabel: 'Model Silnika',
    fallbackOfflineLabel: 'Automatyczny powrót do bazy offline',
    fallbackOfflineDesc: 'W przypadku braku sieci użyj lokalnej bazy pytań.',
    testConnection: '🏥 Testuj Połączenie',
    testing: 'Testowanie...',
    connectionSuccess: '🟢 Połączenie z serwerem działa poprawnie!',
    cancel: 'Anuluj',
    save: 'Zapisz Ustawienia',

    // Stats Modal
    statsTitle: 'Twoje Statystyki',
    gamesPlayed: 'Rozegrane Gry',
    totalQuestions: 'Wszystkie Pytania',
    totalScore: 'Suma Punktów',
    highestElo: 'Najwyższy ELO',
    close: 'Zamknij',

    // Footer
    footerText: '© 2026 Adam Barczynski • Quiz Engine',
  },

  en: {
    // Header
    title: 'Quiz',
    subtitle: '.barczynski.dev',
    statsTooltip: 'Statistics',
    settingsTooltip: 'Server Settings',
    soundOn: 'Enable sound',
    soundOff: 'Mute sound',

    // Modes
    modes: {
      classic: {
        title: 'Classic 10Q',
        badge: '10 Questions',
        description: '10 trivia questions with dynamic scoring. Great for a quick round.',
      },
      survival: {
        title: 'Survival',
        badge: '3 Lives',
        description: 'Endless mode. Difficulty scales dynamically as your streak increases.',
      },
      blitz: {
        title: 'Time Blitz',
        badge: '10s Timer',
        description: '10 seconds per question. Fast reaction speed required!',
      },
      custom: {
        title: 'Custom Topic',
        badge: 'Custom',
        description: 'Specify any topic to generate a custom question set.',
      },
      daily: {
        title: 'Daily Challenge',
        badge: 'Today’s Set',
        description: 'A unique question set updated daily. Test your skills today.',
      },
    },

    // Selectors
    categoryLabel: 'Category',
    allCategories: 'All Categories',
    categories: {
      'Computer Science': 'Computer Science',
      'Web Dev': 'Web Development',
      'Tech & Future': 'Tech & Future',
      'Cybersecurity': 'Cybersecurity',
      'Gaming & Esports': 'Gaming & Esports',
      'Science': 'Biology & Chemistry',
      'Physics & Astronomy': 'Physics & Astronomy',
      'Mathematics': 'Mathematics',
      'Geography & Earth': 'Geography & Earth',
      'Medicine & Health': 'Medicine & Health',
      'History': 'World History',
      'Polish History': 'Polish History',
      'Mythology & Folklore': 'Mythology & Folklore',
      'Politics & Civics': 'Politics & Law',
      'Philosophy & Psychology': 'Philosophy & Psychology',
      'Pop Culture': 'Pop Culture',
      'Cinema & Television': 'Cinema & TV',
      'Music': 'Music',
      'Literature & Books': 'Literature & Books',
      'Art & Architecture': 'Art & Architecture',
      'Sports': 'Sports',
      'Food & Culinary': 'Food & Culinary',
      'Business & Finance': 'Business & Finance',
      'Automotive & Transport': 'Automotive & Transport',
    },

    difficultyLabel: 'Difficulty Level',
    difficulties: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      expert: 'Expert',
    },

    customPromptLabel: 'Enter Quiz Topic',
    customPromptPlaceholder: 'e.g. World History, Astronomy, JavaScript, Movies...',

    dailySeedLabel: 'Challenge Date',
    copySeed: 'Copy Seed',
    seedCopied: 'Copied challenge seed:',

    startQuiz: 'START QUIZ 🚀',
    generating: 'Generating questions...',

    // Generating State
    generatingTitle: 'Generating Questions',
    generatingSubtitle: 'Crafting custom trivia questions in English...',
    generatingDetailsMode: 'Mode',
    generatingDetailsTopic: 'Topic',
    switchToOffline: '⚡ Switch to Fast Offline Bank',

    // Quiz Arena
    score: 'Score',
    streak: 'Streak',
    lives: 'Lives',
    questionCount: 'Question',
    of: 'of',
    submit: 'Submit Answer',
    next: 'Next Question →',
    correct: 'Great! Correct answer',
    wrong: 'Incorrect answer',
    explanation: 'Explanation',

    // Game Over
    gameOverTitle: 'Game Over!',
    finalScore: 'Final Score',
    accuracy: 'Accuracy',
    bestStreak: 'Best Streak',
    xpEarned: 'XP Earned',
    eloRating: 'ELO Rating',
    playAgain: 'Play Again',
    reviewAnswers: 'Review Answers',

    // Review Overlay
    reviewTitle: 'Answer Review',
    backToResults: '← Back to Results',
    yourAnswer: 'Your answer',
    correctAnswer: 'Correct answer',

    // Modals
    aiSettingsTitle: 'Server Settings',
    engineLabel: 'Question Engine',
    serverAiEngine: 'Question Server',
    offlineBankEngine: 'Offline Bank',
    serverUrlLabel: 'Server URL',
    serverKeyLabel: 'API Key (Optional)',
    serverKeyPlaceholder: 'Server default key',
    modelLabel: 'Engine Model',
    fallbackOfflineLabel: 'Automatic fallback to offline bank',
    fallbackOfflineDesc: 'Use local static questions if network connection fails.',
    testConnection: '🏥 Test Connection',
    testing: 'Testing...',
    connectionSuccess: '🟢 Server connection successful!',
    cancel: 'Cancel',
    save: 'Save Settings',

    // Stats Modal
    statsTitle: 'Your Statistics',
    gamesPlayed: 'Games Played',
    totalQuestions: 'Total Questions',
    totalScore: 'Total Score',
    highestElo: 'Highest ELO',
    close: 'Close',

    // Footer
    footerText: '© 2026 Adam Barczynski • Quiz Engine',
  },
};
