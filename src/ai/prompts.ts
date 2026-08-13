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
3. "category" MUST be one of: "Computer Science", "Web Dev", "Tech & Future", "Cybersecurity", "Gaming & Esports", "Science", "Physics & Astronomy", "Mathematics", "Geography & Earth", "Medicine & Health", "History", "Polish History", "Mythology & Folklore", "Politics & Civics", "Philosophy & Psychology", "Pop Culture", "Cinema & Television", "Music", "Literature & Books", "Art & Architecture", "Sports", "Food & Culinary", "Business & Finance", "Automotive & Transport".
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

const SUBTOPIC_POOLS: Record<string, string[]> = {
  'Computer Science': [
    'Memory Management & Garbage Collection',
    'Graph Algorithms & Shortest Path',
    'Compiler Optimization & AST Parsing',
    'OS CPU Scheduling & Mutex Lock',
    'Cryptography Primitives & RSA/ECC',
    'Cache Coherence & CPU L1/L2/L3',
    'Assembly & Machine Code Architecture',
    'Distributed Systems & Consensus (Raft/Paxos)',
    'Data Structures (Red-Black Trees, Skip Lists)',
    'Automata & Turing Computability',
  ],
  'Web Dev': [
    'Browser Rendering Pipeline & Reflow',
    'CSS Flexbox/Grid Layout Algorithms',
    'HTTP/2 vs HTTP/3 QUIC Protocol',
    'DOM Event Bubbling & Capture Phases',
    'Web Workers & SharedArrayBuffer',
    'WebAssembly (Wasm) Compilation',
    'Security Headers (CSP, CORS, SameSite)',
    'React Fiber & Virtual DOM Reconciliation',
    'IndexedDB & Service Worker Caching',
  ],
  'Tech & Future': [
    'Quantum Computing Qubit Entanglement',
    'Deep Neural Network Architectures (Transformers, CNNs)',
    'Autonomous Robotics & SLAM Algorithms',
    'Nuclear Fusion Tokamak Diagnostics',
    'Synthetic Biology & DNA Data Storage',
    'Nanotechnology Materials & Carbon Nanotubes',
    'Space Ion Propulsion Engine Mechanics',
    'Brain-Computer Interface Neural Sensors',
    'Solid-State Battery Chemistry',
  ],
  'Cybersecurity': [
    'Zero-Trust Architecture Principles',
    'Buffer Overflow & Stack Smashing Defense',
    'Asymmetric Public Key Infrastructure',
    'Penetration Testing & Exploit Payloads',
    'Side-Channel Attack Vulnerabilities',
    'OAuth 2.0 & JWT Token Handshakes',
    'Reverse Engineering & Malware Decompilation',
    'Stateful Packet Inspection Firewalls',
  ],
  'Gaming & Esports': [
    'Game Engine Real-Time Physics & Collision',
    'Ray Tracing & Shader Graphics Rendering',
    'Arcade Classics Hardware Architecture',
    'Esports Championship Tournament History',
    'Game Mechanics & Level Design Theory',
    'Speedrunning Sequence Break Glitches',
    'Console Hardware Architecture & Co-Processors',
  ],
  'Science': [
    'Cellular Respiration & ATP Synthesis',
    'Organic Chemistry Reaction Mechanisms',
    'Genomics & CRISPR Gene Editing',
    'Ecosystem Trophic Cascades & Biomes',
    'Geology Tectonic Mineralogy',
    'Fluid Dynamics & Bernoulli Principle',
    'Chemical Bonding & Hybridization',
  ],
  'Physics & Astronomy': [
    'Quantum Entanglement & Bell Inequalities',
    'General Relativity Gravitational Time Dilation',
    'Stellar Nucleosynthesis & Supernovae',
    'Black Hole Thermodynamics & Event Horizon',
    'Particle Physics Standard Model & Higgs Boson',
    'Cosmic Microwave Background Anisotropy',
    'Wave Optics & Double-Slit Interference',
  ],
  'Mathematics': [
    'Linear Algebra Eigenvalues & Eigenvectors',
    'Multivariable Calculus Line Integrals',
    'Number Theory Prime Distribution & Modular Arithmetic',
    'Probability Distributions & Central Limit Theorem',
    'Topology Homotopy & Euler Characteristic',
    'Game Theory Nash Equilibrium & Prisoner Dilemma',
  ],
  'Geography & Earth': [
    'Tectonic Plate Boundary Subduction Zones',
    'Oceanic Thermohaline Circulation Belt',
    'Köppen Climate Classification Zones',
    'Mountain Orogeny & Fold Belts',
    'River Basin Delta Formation Hydraulics',
    'Geopolitical Enclaves & Border Anomalies',
  ],
  'Medicine & Health': [
    'Neurotransmitter Synaptic Reuptake',
    'Pharmacology Agonist & Antagonist Mechanisms',
    'Immunology Monoclonal Antibodies',
    'Metabolic Glycolysis & Krebs Cycle',
    'Epidemiology R0 Transmission Dynamics',
    'Cardiovascular Cardiac Output Physiology',
  ],
  'History': [
    'Late Bronze Age Collapse & Sea Peoples',
    'Roman Republic Military Strategy & Legion Tactics',
    'Silk Road Caravan Trade Routes & Exchanges',
    'Renaissance Printing Press Cultural Impact',
    'Age of Sail Naval Tactics & Galleons',
    'Cold War Diplomatic Crises & Proxy Conflicts',
  ],
  'Polish History': [
    'Panowanie Dynastii Piastów i Zjednoczenie Królestwa',
    'Rzeczpospolita Obojga Narodów i Złota Wolność',
    'Powstanie Styczniowe i Listopadowe',
    'Bitwa pod Warszawą 1920 i Wojna Polsko-Bolszewicka',
    'Uchwalenie Konstytucji 3 Maja 1791',
    'Odbudowa II Rzeczypospolitej i Wojna Odrębna',
  ],
  'Mythology & Folklore': [
    'Norse Mythology Nine Realms & Ragnarok',
    'Greek Titanomachy & Olympian Pantheon',
    'Slavic Mythology Perun & Leszy Legends',
    'Egyptian Book of the Dead & Afterlife Trials',
    'Celtic Druidic Lore & Tuatha Dé Danann',
  ],
  'Politics & Civics': [
    'Constitutional Judicial Review Principles',
    'International Treaty Conventions & Alliances',
    'Proportional vs First-Past-The-Post Electoral Systems',
    'Tripartite Separation of Powers Mechanics',
    'Political Philosophy (Social Contract & Utility)',
  ],
  'Philosophy & Psychology': [
    'Stoic Virtues & Dichotomy of Control',
    'Existentialist Absurdism (Camus & Sartre)',
    'Cognitive Heuristics (Anchoring & Availability)',
    'Operant Conditioning Reinforcement Schedules',
    'Epistemological Rationalism vs Empiricism',
  ],
  'Pop Culture': [
    'Iconic 1980s and 1990s Media Milestones',
    'Viral Internet Memes & Early Web Culture',
    'Historic Music Festivals & Breakthrough Sets',
    'Graphic Novel Age Transitions & Creators',
  ],
  'Cinema & Television': [
    'Auteur Cinematography & Aspect Ratio Framing',
    'Orchestral Film Score Composition Themes',
    'Academy Awards Record-Breaking Milestones',
    'Golden Age Television Serialized Narrative Arc',
  ],
  'Music': [
    'Harmony Modal Jazz Improvisation',
    'Classical Symphony Form Movement Structures',
    'Rock & Metal Underground Origins',
    'Analog Synthesizer Subtractive Synthesis',
  ],
  'Literature & Books': [
    'Epic Poetry Metrics & Alliteration',
    '19th-Century Realist Novel Structure',
    'Science Fiction World-Building Milestones',
    'Shakespearean Drama Iambic Pentameter',
  ],
  'Art & Architecture': [
    'Impressionist Light & Color Theory Techniques',
    'Gothic Flying Buttress Structural Mechanics',
    'Renaissance Chiaroscuro & Perspective',
    'Bauhaus Design Principles & Functionalism',
  ],
  'Sports': [
    'Olympic Games Historic World Records',
    'Tactical Football Formations (Tiki-taka, Gegenpressing)',
    'Tennis Grand Slam Surface Dynamics',
    'Formula 1 Aerodynamic Ground Effect Physics',
  ],
  'Food & Culinary': [
    'Molecular Gastronomy Emulsification & Spherification',
    'Global Spice Route Spice Chemistry',
    'Lacto-Fermentation Microbiology',
    'Classic French Mother Sauces & Derivatives',
  ],
  'Business & Finance': [
    'Microeconomics Marginal Utility & Price Elasticity',
    'Venture Capital Term Sheet Valuations',
    'Derivative Financial Instruments (Options/Futures)',
    'Macroeconomic Central Bank Interest Rate Dynamics',
  ],
  'Automotive & Transport': [
    'Internal Combustion Valve Timing & Turbocharging',
    'Aerodynamic Drag Coefficient & Downforce',
    'High-Speed Rail Maglev Suspension Physics',
    'Commercial Aircraft Jet Engine Turbofan Mechanics',
  ],
};

/**
 * Construct User Prompt for Quiz Generation
 */
export function buildUserPrompt(params: AIQuestionPromptParams): string {
  const { category, difficulty, count, topicFocus, lang } = params;
  const randomSeed = Math.floor(Math.random() * 1000000);

  let prompt = '';

  if (category === 'all') {
    // Pick 4 random categories from SUBTOPIC_POOLS to combine subtopics for 'all'
    const keys = Object.keys(SUBTOPIC_POOLS);
    const shuffledKeys = [...keys].sort(() => Math.random() - 0.5).slice(0, 4);
    const mixedSubtopics = shuffledKeys
      .map((k) => SUBTOPIC_POOLS[k][Math.floor(Math.random() * SUBTOPIC_POOLS[k].length)])
      .join('; ');

    prompt = `Generate exactly ${count} ${difficulty.toUpperCase()} difficulty quiz questions covering ALL CATEGORIES (MIXED TRIVIA). You MUST provide a diverse mix across different domains (such as Science, History, Tech & Future, Cinema, Geography, Pop Culture, Sports, Music, Literature, Medicine, Mathematics, Culinary). Draw inspiration from diverse angles such as: [${mixedSubtopics}]. For EACH question in the JSON array, set its "category" property to the exact matching category string from the schema.`;
  } else {
    const categoryPool = SUBTOPIC_POOLS[category] || [];
    const selectedSubtopics = categoryPool.length > 0
      ? [...categoryPool].sort(() => Math.random() - 0.5).slice(0, 3).join('; ')
      : '';

    prompt = `Generate exactly ${count} ${difficulty.toUpperCase()} difficulty quiz questions for category "${category}".`;

    if (topicFocus) {
      prompt += ` Specific focus area: "${topicFocus}".`;
    } else if (selectedSubtopics) {
      prompt += ` Draw inspiration from diverse subtopic angles such as: [${selectedSubtopics}].`;
    }
  }

  prompt += ` Randomization entropy seed: ${randomSeed}_${Date.now()}.`;

  prompt += ` NOVELTY MANDATE: Avoid cliché, overused, or generic textbook 101 questions. Provide fresh, unique, engaging, and precise trivia that tests genuine knowledge. Each of the ${count} questions MUST cover a completely different topic or domain.`;

  if (lang === 'pl') {
    prompt += ` LANGUAGE INSTRUCTION: All question text, all 4 option strings, and explanation text MUST BE WRITTEN IN POLISH (Język polski). Keep category names as one of the required schema strings.`;
  } else {
    prompt += ` LANGUAGE INSTRUCTION: All question text, options, and explanation text MUST BE WRITTEN IN ENGLISH.`;
  }

  prompt += ` Ensure all ${count} questions have 4 options and correctIndex ranging from 0 to 3. Output ONLY the JSON array.`;

  return prompt;
}
