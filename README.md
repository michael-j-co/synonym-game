# Synonym Sprint

Minimalist word game prototype that follows the `PRD.md` specification. Runs entirely on the client with a mock AI service so designers can validate the loop without backend wiring.

## Getting Started

```bash
npm install
npm run dev
```

* `npm run dev` – start Vite dev server.
* `npm run build` – type-check and create a production build.
* `npm run preview` – preview the production build locally.
* `npm run test` – execute Vitest unit tests for scoring/normalization utilities.

## Project Layout

```
src/
  components/        UI primitives (HUD, results, lists)
  data/              Word bank + mock synonym payloads
  hooks/             `useRound` state machine + countdown timer
  lib/               Normalization, scoring, mock AI client, tests
  state/             Local storage for per-device stats
  styles/            Global + feature styles
```

The game loop lives in `hooks/useRound.ts` and mirrors the PRD state machine: `idle → ready → running → ended`, starting the countdown on the first accepted submission. Validation enforces single-word inputs, de-duplicates by lemma, and awards rarity-based points (1/2/3).

## Mock Content / AI

* `src/data/wordbank.json` – curated MVP word list.
* `src/data/mockSynonyms.json` – deterministic AI responses (word → canonical synonyms with metadata).
* `src/lib/aiClient.ts` – thin client that simulates network latency + caching. Swap this with a real backend fetch when the service is ready.

## Next Steps

1. Replace the mock AI client with actual API calls plus caching.
2. Add Playwright smoke test that covers a full successful round.
3. Layer subtle animations/FX per the visual design pass.
