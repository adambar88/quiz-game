# Quiz Engine: Mathematical Structures, Algorithms & Dataset Specification

## 1. Executive Summary & Overview

This document presents the complete mathematical formulation, algorithmic logic, AI prompt engineering templates, and static dataset specifications for the **Quiz Application** located at `/home/adam/projects/my-domain/quiz`.

The core architecture consists of five decoupled modules:
1. **Speed-Decay & Streak Scoring Module** (`src/algorithms/scoring.ts`)
2. **Dynamic Adaptive ELO Difficulty Scaling Module** (`src/algorithms/elo.ts`)
3. **Deterministic Daily Challenge Seed Hash Module** (`src/algorithms/seedRng.ts`)
4. **AI System Prompt & Validation Engine** (`src/ai/prompts.ts`, `src/ai/validators.ts`)
5. **Curated Static Offline Question Bank** (`src/data/questions.ts`)

---

## 2. Speed-Decay & Streak Scoring Algorithm

### 2.1 Mathematical Formulation

The total points $\text{Score}$ awarded for answering a question correctly is calculated by combining three factors: **Base Points** by difficulty tier, a **Speed-Decay Multiplier**, and a **Streak Multiplier**.

$$\text{Score} = \operatorname{round}\Big( \text{BasePoints}(\text{difficulty}) \times F_{\text{time}}(t, T_{\text{max}}) \times M_{\text{streak}}(S) \Big)$$

If the player answers incorrectly:
$$\text{Score} = 0 \quad \text{and} \quad S_{\text{new}} = 0$$

#### Base Points Table
| Difficulty Tier | Base Points ($\text{BasePoints}$) | Default Time Limit ($T_{\text{max}}$) |
| :--- | :---: | :---: |
| **`easy`** | $100$ | $15\text{s}$ |
| **`medium`** | $200$ | $20\text{s}$ |
| **`hard`** | $350$ | $20\text{s}$ |
| **`expert`** | $500$ | $25\text{s}$ |

#### Speed-Decay Multiplier ($F_{\text{time}}$)
Let $t$ be the time elapsed in milliseconds, and $T_{\text{max}}$ be the maximum time limit in milliseconds. The normalized time ratio $r$ is:

$$r = \operatorname{clamp}\left(\frac{t}{T_{\text{max}}}, 0, 1\right)$$

The speed multiplier decays from $1.0$ (instant answer) down to a minimum floor $F_{\text{min}} = 0.2$ (answering at $t = T_{\text{max}}$):

$$F_{\text{time}}(r) = \max\Big(F_{\text{min}}, 1.0 - (1.0 - F_{\text{min}}) \cdot r^{\gamma}\Big)$$

Where $\gamma = 1.0$ (linear decay).

#### Streak Multiplier ($M_{\text{streak}}$)
For $S$ consecutive correct answers ($S \ge 1$ after answering correctly):

| Streak Count ($S$) | Multiplier ($M_{\text{streak}}$) | Progression Delta |
| :--- | :---: | :---: |
| $0$ | $1.00\times$ | Base |
| $1$ | $1.10\times$ | $+0.10$ |
| $2$ | $1.25\times$ | $+0.15$ |
| $3$ | $1.50\times$ | $+0.25$ |
| $4$ | $1.80\times$ | $+0.30$ |
| $5$ | $2.20\times$ | $+0.40$ |
| $6$ | $2.60\times$ | $+0.40$ |
| $\ge 7$ | $3.00\times$ (Cap) | Max Floor |

---

## 3. Dynamic Adaptive ELO Difficulty Scaling Algorithm

### 3.1 Mathematical Formulation

The difficulty scaling engine uses the classical ELO rating system adapted for Single Player vs Question item response theory.

#### Expected Score Formula
Given player rating $R_p$ and question rating $R_q$, the expected probability $E_p \in (0, 1)$ of the player answering correctly is:

$$E_p = \frac{1}{1 + 10^{\frac{R_q - R_p}{400}}}$$

#### Rating Update Formula
Upon an answer submission with outcome $S_p \in \{0, 1\}$ ($1$ for correct, $0$ for incorrect):

$$R'_p = \max\Big(100, \operatorname{round}\big(R_p + K \cdot (S_p - E_p)\big)\Big)$$
$$R'_q = \max\Big(100, \operatorname{round}\big(R_q + K \cdot (E_p - S_p)\big)\Big)$$

Where $K = 32$ is the rating update factor.

### 3.2 Difficulty Tier Boundaries & Transition Rules

#### ELO Tier Mapping
```
      Easy           Medium           Hard           Expert
[ 0 -------- 1199 | 1200 ----- 1599 | 1600 ----- 1999 | 2000+ ]
```

#### Dynamic Tier Step-Up & Step-Down Rules
1. **Step-Up Rule**: Answering **3 consecutive questions correctly** at the current tier forces an immediate step-up to the next higher tier (`easy` $\to$ `medium` $\to$ `hard` $\to$ `expert`).
2. **Step-Down Rule**: Answering **1 question incorrectly** forces an immediate step-down to the next lower tier (`expert` $\to$ `hard` $\to$ `medium` $\to$ `easy`).
3. **Life Decay**: An incorrect answer decrements player lives: $\text{lives}_{\text{new}} = \max(0, \text{lives} - 1)$. Game Over occurs when $\text{lives} = 0$.

---

## 4. Deterministic Daily Challenge Seed Hash Algorithm

To ensure every client worldwide plays the **exact same question sequence** and **exact same option order** on any given calendar date without server synchronization, a deterministic PRNG pipeline is employed.

### 4.1 FNV-1a Date Seed Hash
Given a date string $D$ (e.g. `"2026-08-12"`):

$$H_0 = 2166136261 \quad (\text{0x811C9DC5})$$
$$H_i = \Big((H_{i-1} \oplus \text{charCodeAt}(D[i])) \times 16777619\Big) \bmod 2^{32}$$

### 4.2 Mulberry32 Pseudo-Random Number Generator
Mulberry32 generates uniform pseudo-random 32-bit floats in $[0, 1)$:

```ts
export function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

### 4.3 Deterministic Selection & Option Shuffling
1. **Question Selection**: Performs a seeded Fisher-Yates shuffle on the question pool and selects the first $N$ items.
2. **Option Shuffling**: Performs a seeded shuffle on the 4 options of each question, tracking the moving position of the correct answer to update `correctIndex`.

---

## 5. AI System Prompt Templates & JSON Schema Validators

Dedicated prompt system instructions for Groq (`llama-3.3-70b-versatile`), OpenAI (`gpt-4o-mini`), and Gemini (`gemini-1.5-flash`) enforce strict raw JSON array generation.

### 5.1 JSON Schema Definition
Questions generated by AI models are validated against the Draft-07 JSON Schema defined in `src/ai/validators.ts`:
- `category`: Must be one of 6 valid categories.
- `question`: String of minimum length 5.
- `options`: Array of exactly 4 non-empty strings.
- `correctIndex`: Integer between 0 and 3.
- `explanation`: Detailed string explaining the correct answer.
- `difficulty`: `'easy' | 'medium' | 'hard' | 'expert'`.

### 5.2 Fallback Clean-Up Parser (`cleanRawJsonResponse`)
The parser strips markdown fences (` ```json ... ``` `), handles surrounding conversational text, removes trailing commas before `]` or `}`, strips control characters, and handles array-wrapping objects.

---

## 6. Curated Static Offline Question Bank Summary

The static dataset (`src/data/questions.ts`) contains **36 curated TypeScript question objects** distributed across 6 categories:
- **Computer Science** (6 questions: complexity, data structures, P vs NP, Dijkstra, Belady's Anomaly, Halting Problem)
- **Web Dev** (6 questions: HTTP status, Flexbox, Event Loop microtasks, React keys, Cache-Control, CSRF/SameSite)
- **Science** (6 questions: Speed of light, Mitochondria, Photoelectric effect, Helicase, Bell's Theorem, Gluons)
- **Mathematics** (6 questions: Pi, Derivatives, Euler's Identity, Eigenvalues, Fundamental Theorem of Calculus, Riemann Hypothesis)
- **History** (6 questions: 1776 US Declaration, Pyramids, 1453 Fall of Constantinople, 1648 Westphalia, 1215 Magna Carta, 313 Edict of Milan)
- **Pop Culture** (6 questions: J.K. Rowling, Avatar box office, Freddie Mercury, Portal cake meme, Snow White 1937, Enterprise NCC-1701-D)

---

## 7. Direct Import & Usage Code Example

```ts
import {
  calculateQuestionScore,
  updateEloState,
  createInitialEloState,
  generateDailyChallenge,
  validateAndParseAIResponse,
  STATIC_QUESTION_BANK
} from '/home/adam/projects/my-domain/quiz/src/index.ts';

// 1. Daily Challenge Generation
const challenge = generateDailyChallenge('2026-08-12', STATIC_QUESTION_BANK, 10);
console.log(`Seed Hex: ${challenge.seedHex}`);

// 2. Score Calculation
const score = calculateQuestionScore(true, 'hard', 4500, 20000, 2);
console.log(`Earned Points: ${score.finalScore}, New Streak: ${score.streak}`);

// 3. Dynamic ELO Update
const initialElo = createInitialEloState(1200, 3);
const { newState, result } = updateEloState(initialElo, 1400, true);
console.log(`New Rating: ${newState.playerRating}, Tier: ${newState.tier}`);
```
