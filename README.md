# Screen Team App

Tools for ProPresenter operators.

- **Simulator** — rapid-fire scripture reference trainer. A prompt is spoken aloud
  (e.g. "John 3 verse 16") and the operator types it as fast as possible; a round lasts 60 seconds.
  Modes: **Classic** (book chapter verse), **Chapter–Verse**, **Book**, and **Warm Up**
  (ordinals, then each of the other modes, in 15-second segments).
- **Song Formatter** — planned; the home tile is a placeholder.

## Development

```sh
npm install
npm run dev     # http://localhost:8080
npm run build
```

Stack: React 18, Vite, TypeScript, Tailwind CSS, Motion. Book/chapter/verse data lives in `public/BookInfo.xml`.

## Layout

- `src/pages` — `Home` (app home), `Simulator` (mode menu), `Game`, `End` (results)
- `src/game` — `engine.ts` (prompts and scoring), `useGame.ts` (round state, clock, feedback)
- `src/components/glass` — frosted-glass component set; design tokens are in `src/index.css`
- `src/lib` — `motion.ts` (shared springs/variants), `sfx.ts` (synthesized sounds), `settings.ts`
