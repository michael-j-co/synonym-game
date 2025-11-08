# PRD — “Unnamed Synonym Word Game (Web + Mobile Browser)

## 0. Summary

A minimalistic word game where a player is shown a base word and tries to enter as many valid synonyms (and near-synonyms) as they can think of. Scoring rewards rarer synonyms more. Stopwatch (min:sec) begins on the player’s **first keystroke** to reduce idle stress. Synonym sets are produced and validated by **AI**.

---

## 1. Goals & Non-Goals

**Goals**

* Ship a polished MVP in 2–4 weeks.
* Simple, “one more run” loop with instant replay.
* Runs smoothly on desktop + mobile browsers (React).
* Minimal UI (NYT Wordle/Spelling Bee vibe).

**Non-Goals (MVP)**

* No accounts or global leaderboard.
* No difficulty selector (single balanced pool).
* No multiplayer/async challenges.
* No multi-language support (English only).
  
---

## 2. Player Experience

**Core Loop**

1. Player lands on Home → presses **Play**.
2. Sees a base word + empty input + list of accepted answers.
3. On the player’s **first keystroke**, start an upward timer that runs until they either give up or clear every synonym.
4. Player continues submitting unique synonyms/near-synonyms.
5. When they give up or finish the list: show **Score**, **Elapsed Time**, **Answers found**, **Top missed**, and **Play Again**.

**Feel**

* Fast, low-friction, minimal distractions.
* Subtle animations; satisfying “accepted” feedback.
* Wordle-adjacent typography and spacing.

---

## 3. Game Rules

* **Input acceptance**

  * Accept **single-word** entries only in MVP (no multi-word phrases); hyphenated allowed.
  * Case-insensitive; trim whitespace; normalize diacritics.
  * Reject duplicates and exact repeats of lemmas (e.g., *pleased* and *please* handled by lemma rules).
* **Validity**

  * Must be in the AI-generated canonical synonym set for the base word (includes near-synonyms).
  * Only items in this set award points; anything else is treated as incorrect with 0 points.
  * Optional: reject rare archaic/technical items if AI flags as “domain-specific only”.
* **Timer**

  * No fixed length; chronometer starts on first **keystroke**.
  * Runs indefinitely until the player gives up or finds every synonym.
* **Scoring (Rarity-Based)**

  * AI service returns each synonym with a **rarity tier** or numeric rarity score.
  * Points by tier (default):

    * Common = 1
    * Uncommon = 2
    * Rare = 3
  * Optional streak bonus (not MVP): +1 multiplier every 3 consecutive correct within 7s window.
* **End of Round**

  * Show score, list found, list missed (sorted by rarity), and “Play Again”.
  * Surface 3–5 “notable missed” items (highest rarity).

---

## 4) Content & Data Model

### 4.1 Base Word Source

* Curated list of ~300–600 balanced English words (general vocabulary) stored locally (JSON).
* Daily seed (optional later) to choose a “Word of the Day” deterministically.
* Random “Quick Play” mode pulls uniformly from list.

### 4.2 AI Synonym Service (MVP Contract)

* **Purpose**: Given a base word, return a canonical list of synonyms and near-synonyms with metadata.

**Request**

```json
POST /api/synonyms
{
  "word": "happy",
  "max": 120,
  "includeNear": true,
  "normalize": true
}
```

**Response**

```json
{
  "word": "happy",
  "canonicalLemma": "happy",
  "synonyms": [
    {"term": "glad", "lemma": "glad", "tier": "common", "rarity": 0.25},
    {"term": "delighted", "lemma": "delight", "tier": "uncommon", "rarity": 0.55},
    {"term": "ecstatic", "lemma": "ecstatic", "tier": "rare", "rarity": 0.82}
  ],
  "notes": "Exclude sentiment-neutral terms; allow emotional intensity variants."
}
```

**Requirements**

* **Determinism**: Temperature low; stable outputs across a day. Cache by `(word, version)`.
* **Normalization**: Service must return `term` + `lemma`; remove exact lemma duplicates.
* **Rarity**: Either return a normalized `rarity ∈ [0,1]` (higher = rarer) and we tier by thresholds:

  * `≤0.33 → common`, `≤0.66 → uncommon`, else `rare`.
* **Latency target**: < 400ms p95 with caching; initial uncached may be slower but masked by “Get ready” state.
* **Rate limiting**: Local cache + prefetch 1–2 words to avoid wait between rounds.

> Implementation note: AI can be OpenAI/GPT or similar behind a thin app server; front end talks to your backend only.

### 4.3 Local Storage

* `bestScoreAllTime`, `lastPlayedAt`, `runsCount`, `settings`.
* Optional `dailyWordProgress[yyyy-mm-dd] = {score, found[]}`.

---

## 5) UX & UI

### 5.1 Screens

* **Home**

  * Title, Play, How to Play, Settings (icon).
* **Game**

  * Base word (large).
  * Stopwatch pill right/top.
  * Input field (mobile-optimized).
  * “Accepted” list chip grid with subtle entrance animation.
  * Small score badge live-updating.
* **Results**

  * Big score.
  * Found list; Missed list (group by rarity).
  * CTA: **Play Again**.
* **How to Play** (modal)

  * 3–5 short bullets, examples of valid/invalid entries.
* **Settings** (modal)

* Sound on/off (future), elapsed timer (read-only in MVP), dark mode.

### 5.2 Accessibility

* Keyboard-first; Enter to submit; Esc to clear.
* ARIA live regions for “Accepted”/“Rejected”.
* High contrast mode; scalable typography.
* Motion-reduced mode respects `prefers-reduced-motion`.

### 5.3 Visual Design

* Clean grid, generous spacing, subtle shadows.
* Pastel accents for rarity (green=common, amber=uncommon, purple=rare).
* One accent color only in MVP.

---

## 6 React Architecture

```
/src
  /components
    Header.tsx
    Timer.tsx
    WordCard.tsx
    InputBar.tsx
    ChipsList.tsx
    ResultsPanel.tsx
    Modal.tsx (HowTo, Settings)
    Toast.tsx
  /pages
    Home.tsx
    Game.tsx
    Results.tsx
  /hooks
    useTimer.ts
    useRound.ts (state machine of a single round)
    useSynonyms.ts (fetch/cache AI results)
    useLocalStore.ts
  /lib
    aiClient.ts (fetch to backend)
    scoring.ts (rarity → points; totals)
    normalize.ts (lemma, case, diacritics, hyphen rules)
    wordbank.ts (local list)
  /state
    (lightweight: React state + context; no Redux in MVP)
  /styles
    (CSS modules or Tailwind)
```

**State Machine (useRound)**

* `idle` → `ready(wordLoaded)` → `running(timerActive)` → `ended(results)`
* Transition `running` starts on the **first keystroke**.

---

## 7) Scoring & Validation Logic

**Validation pipeline (per submission)**

1. Normalize: trim, lower, strip diacritics, collapse hyphens.
2. Reject if empty or multi-word (contains spaces) [MVP].
3. Lemmatize (client or use AI response lemmas).
4. Check `seenSet` (reject dup by lemma).
5. Check against AI `synonyms[].lemma` (O(1) Set for lookups).
6. If present → get `rarity` → map to tier → award points.
7. Push to `found[]` with `{term, tier, points, tSubmit}`.

**Score formula**

```
points(term) = 
  1 if tier=common
  2 if tier=uncommon
  3 if tier=rare
total = Σ points(term)
```

---

## 8) Backend (Thin) Requirements

**Endpoints**

* `POST /api/synonyms` (see contract)
* `GET /api/word` → `{ "word": "happy" }`

  * Optionally deterministic daily word via seed.
* Caching layer (Redis or in-memory) for synonym sets and word rotations.

**AI Prompting (Guideline)**

* System: “Return a JSON with canonical synonyms and near-synonyms for the base English word. No antonyms. No multi-word phrases. Provide normalized lemmas and a rarity score in [0,1] based on general usage frequency and semantic specificity.”
* Temperature: 0.2–0.3 (consistency).
* Do not include borderline or sentiment-neutral terms unless they are legitimate synonyms; anything not returned in `synonyms[]` will not score.

**Security**

* Hide API key server-side.
* Rate-limit by IP.
* Validate inputs (length ≤ 32, a–z + hyphen only).

---

## 9) Performance & Quality

**Perf Targets**

* FCP < 1.0s on mid-range mobile.
* Input submit → feedback < 100ms for cached sets.
* Synonym fetch cache hit rate > 80% after first run.

**Testing**

* Unit: `normalize`, `scoring`, `useRound`.
* Contract tests: `/api/synonyms` schema.
* E2E happy path: “type 5 known answers → score updates → results rendered”.
* Edge cases: empty submit, duplicate, give-up mid-entry, long words.

**Analytics (local/minimal)**

* `runsCount`, `avgScore`, `avgTermsPerRun`, acceptance rate.
* All local only in MVP (no PII).

---

## 10) Edge Cases & Rules

* **Borderline terms** (e.g., “okay”, “fine” for “happy”): if not present in the canonical `synonyms[]`, they are treated as incorrect (0 points, not added to found).
* **Inflections**: treat lemma duplicates as duplicates.
* **Hyphenation**: accept “light-hearted”, reject multi-token with space.
* **Timer state**: chronometer keeps counting upward until the player gives up or clears every synonym; freeze and display final time in results.
* **Network fail**: show “Can’t fetch synonyms. Try again.” and retry; allow offline quick replay only if cached.

---

## 12) Acceptance Criteria (MVP)

* I can complete a full round on desktop and mobile browsers with <1s initial load and <100ms input feedback for cached sets.
* Timer starts on my **first keystroke** and stops only when I give up or finish every synonym.
* Duplicate entries (by lemma) are rejected with clear feedback.
* Score reflects rarity tiers exactly (1/2/3).
* Results screen shows found/missed and lets me replay instantly.
* App works without refresh across multiple rounds; best score persists.

---

## 13) Tech Choices

* **Frontend**: React + (Tailwind or CSS Modules). Vite build.
* **State**: Local component state + simple Context; no Redux.
* **Backend**: Minimal Node/Express (or Next.js API routes) + AI provider.
* **Deployment**: Vercel/Netlify for FE; same host for API.
* **Testing**: Vitest + React Testing Library; Playwright (basic E2E).

---

## 14) Deliverables

* Source repo with `/src` structure above.
* `README` with local dev, env vars, and API contracts.
* JSON wordbank and example cached synonym payloads.
* Test suite covering scoring/validation and one E2E happy path.

---
