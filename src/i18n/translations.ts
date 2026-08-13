export type Language = 'pl' | 'en';

export const translations = {
  pl: {
    // Header
    title: 'BrainSprint',
    subtitle: '',
    statsTooltip: 'Statystyki',
    settingsTooltip: 'Ustawienia Gry',
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
      versus: {
        title: 'Wyścig',
        badge: '12 Pytań • Tryb Wyścigu',
        description: 'Rywalizacja w czasie rzeczywistym. 12 pytań z naprzemiennym wyborem kategorii i wynikiem na żywo!',
      },
    },

    // Selectors
    categoryLabel: 'Kategoria',
    allCategories: 'Wszystkie kategorie',
    categories: {
      'Computer Science': 'Kod & Krzem',
      'Web Dev': 'W Pajęczynie Sieci',
      'Tech & Future': 'Technologie Jutra',
      'Cybersecurity': 'Hakerzy i Szyfry',
      'Gaming & Esports': 'Wirtualne Areny',
      'Science': 'Laboratorium Świata',
      'Physics & Astronomy': 'Kosmos i Kwanty',
      'Mathematics': 'Królowa Nauk',
      'Geography & Earth': 'Lądy i Oceany',
      'Medicine & Health': 'Tajemnice Ciała',
      'History': 'Wyprawy w Czasie',
      'Polish History': 'Śladami Orła',
      'Mythology & Folklore': 'Bogowie i Legendy',
      'Politics & Civics': 'W Kulisach Władzy',
      'Philosophy & Psychology': 'Labirynt Umysłu',
      'Pop Culture': 'Pop-Kultura na Fali',
      'Cinema & Television': 'W Błysku Reflektorów',
      'Music': 'Brzmienia i Rytmy',
      'Literature & Books': 'Między Wierszami',
      'Art & Architecture': 'Pędzlem i Kamieniem',
      'Sports': 'Stadiony Świata',
      'Food & Culinary': 'Smaki i Przepisy',
      'Business & Finance': 'Wilki i Kapitał',
      'Automotive & Transport': 'Wysokie Obroty',
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

    dailySeedLabel: 'Kod Wyzwania Dnia',
    copySeed: 'Kopiuj Kod Wyzwania',
    seedCopied: 'Skopiowano kod wyzwania:',

    startQuiz: 'ROZPOCZNIJ QUIZ 🚀',
    generating: 'Generowanie pytań...',

    // Generating State
    generatingTitle: 'Generowanie Pytań',
    generatingSubtitle: 'Tworzenie unikalnego zestawu pytań po polsku...',
    generatingDetailsMode: 'Tryb',
    generatingDetailsTopic: 'Temat',
    generatingStage1: '🔌 Łączenie z generatorem pytań...',
    generatingStage2: '🧠 Tworzenie unikalnego zestawu pytań...',
    generatingStage3: '🔍 Weryfikacja i przygotowywanie odpowiedzi...',
    generatingStage4: '⚡ Finalizowanie zestawu pytań...',
    elapsedTime: 'Czas',
    estimatedTime: 'Oczekiwany czas: kilka sekund',
    switchToOffline: '⚡ Przełącz na szybką bazę lokalną',

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
    eloRating: 'Poziom Mistrzostwa',
    playAgain: 'Zagraj Ponownie',
    reviewAnswers: 'Przejrzyj Odpowiedzi',

    // Review Overlay
    reviewTitle: 'Podsumowanie Odpowiedzi',
    backToResults: '← Powrót do wyników',
    yourAnswer: 'Twoja odpowiedź',
    correctAnswer: 'Poprawna odpowiedź',

    // Modals
    aiSettingsTitle: 'Ustawienia Gry & Pytań',
    engineLabel: 'Wybór Źródła Pytań',
    serverAiEngine: 'Generator Pytań',
    offlineBankEngine: 'Baza Lokalna',
    serverUrlLabel: 'Adres Serwera Pytań',
    serverKeyLabel: 'Klucz Dostępny (Opcjonalny)',
    serverKeyPlaceholder: 'Domyślny klucz dostępu',
    modelLabel: 'Model Pytań',
    fallbackOfflineLabel: 'Tryb bez internetu (baza lokalna)',
    fallbackOfflineDesc: 'W przypadku braku sieci użyj lokalnej bazy pytań.',
    testConnection: '🏥 Sprawdź Połączenie',
    testing: 'Sprawdzanie...',
    connectionSuccess: '🟢 Połączenie z silnikiem pytań działa poprawnie!',
    cancel: 'Anuluj',
    save: 'Zapisz Ustawienia',

    // Stats Modal
    statsTitle: 'Twoje Statystyki',
    gamesPlayed: 'Rozegrane Gry',
    totalQuestions: 'Wszystkie Pytania',
    totalScore: 'Suma Punktów',
    highestElo: 'Najwyższy Poziom Mistrzostwa',
    close: 'Zamknij',

    // Versus Duel Mode
    versusLobbyTitle: 'Wyścig',
    createRoom: 'Stwórz Nowy Pokój',
    joinRoom: 'Dołącz do Pokoju',
    roomCodeLabel: 'Kod Dostępu do Gry',
    enterRoomCode: 'Wpisz Kod Pokoju (4 znaki)',
    shareLink: '📋 Kopiuj Link dla Przeciwnika',
    linkCopied: 'Skopiowano link do gry!',
    waitingForPartner: 'Oczekiwanie na dołączenie drugiego gracza...',
    partnerConnected: '🟢 Przeciwnik Dołączył! Jest gotowy do gry.',
    startDuel: 'ROZPOCZNIJ WYŚCIG ⚔️',
    joiningRoom: 'Łączenie z pokojem...',
    versusWinner: '🏆 PODSUMOWANIE POJEDYNKU',
    youWon: 'Wygrałeś Pojedynek! 🎉',
    opponentWon: 'Przeciwnik Wygrał Pojedynek! 👑',
    draw: 'Remis w Pojedynku! 🤝',
    yourScore: 'Twój Wynik',
    opponentScore: 'Wynik Przeciwnika',

    // Footer
    footerText: '© 2026 Adam Barczynski • BrainSprint Engine',
  },

  en: {
    // Header
    title: 'BrainSprint',
    subtitle: '',
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
      versus: {
        title: 'Race',
        badge: '12 Questions • Race Mode',
        description: 'Real-time multiplayer race. 12 questions with alternating category selection and live leaderboard!',
      },
    },

    // Selectors
    categoryLabel: 'Category',
    allCategories: 'All Categories',
    categories: {
      'Computer Science': 'Silicon & Logic',
      'Web Dev': 'Web Craft & Cloud',
      'Tech & Future': 'Next-Gen Tech',
      'Cybersecurity': 'Hackers & Ciphers',
      'Gaming & Esports': 'Virtual Realms',
      'Science': 'Secret Science',
      'Physics & Astronomy': 'Cosmos & Quanta',
      'Mathematics': 'Number Crunch',
      'Geography & Earth': 'Planet Earth',
      'Medicine & Health': 'Human Body & Bio',
      'History': 'Time Travel',
      'Polish History': 'Crown & Eagle',
      'Mythology & Folklore': 'Gods & Myths',
      'Politics & Civics': 'Power & Politics',
      'Philosophy & Psychology': 'Mind & Soul',
      'Pop Culture': 'Trendsetters',
      'Cinema & Television': 'Silver Screen',
      'Music': 'Soundwave & Hits',
      'Literature & Books': 'Between the Lines',
      'Art & Architecture': 'Masterpieces',
      'Sports': 'Stadium Fever',
      'Food & Culinary': 'Culinary Secrets',
      'Business & Finance': 'Wall Street & Wealth',
      'Automotive & Transport': 'High Octane',
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
    generatingTitle: 'Preparing Questions',
    generatingSubtitle: 'Preparing and validating question set...',
    generatingDetailsMode: 'Mode',
    generatingDetailsTopic: 'Topic',
    generatingStage1: '🔌 Preparing question engine...',
    generatingStage2: '🧠 Generating questions & options...',
    generatingStage3: '🔍 Verifying accuracy & options...',
    generatingStage4: '⚡ Finalizing question set...',
    elapsedTime: 'Elapsed',
    estimatedTime: 'Est. ~3-5s',
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

    // Versus Race Mode
    versusLobbyTitle: 'Race',
    createRoom: 'Create New Room',
    joinRoom: 'Join Room',
    roomCodeLabel: 'Race Access Code',
    enterRoomCode: 'Enter Room Code (4 chars)',
    shareLink: '📋 Copy Race Room Link',
    linkCopied: 'Race link copied!',
    waitingForPartner: 'Waiting for opponent to connect...',
    partnerConnected: '🟢 Opponent Joined!',
    startDuel: 'START RACE 🚀',
    joiningRoom: 'Connecting to room...',
    versusWinner: '🏆 RACE SUMMARY',
    youWon: 'You Won the Race! 🎉',
    opponentWon: 'Opponent Won the Race! 👑',
    draw: 'Race Tie! 🤝',
    yourScore: 'Your Score',
    opponentScore: 'Opponent Score',

    // Footer
    footerText: '© 2026 Adam Barczynski • BrainSprint',
  },
};
