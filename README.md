# Screen Team App

Tools for ProPresenter operators.

- **Simulator** — rapid-fire scripture reference trainer. A prompt is spoken aloud
  (e.g. "John 3 verse 16") and the operator types it as fast as possible; a round lasts 60 seconds.
  Modes: **Classic** (book chapter verse), **Chapter–Verse**, **Book**, and **Warm Up**
  (Chapter–Verse, Book, then Classic, 30 s each; each segment's name is shown and spoken,
  then a 3-2-1 countdown, with a switch sound between segments; the clock only runs while playing).
  The results table explains every miss: an **Issue** pill (e.g. *Opens earlier book*) opens a
  popup saying what the typing would actually have opened, what was missing, and the fastest
  correct answer. Colons count as a miss: typing a space is faster.
- **Song Formatter** — paste raw lyrics, copy slide-ready text. First, alignment dots
  (`....Lorem.ipsum.dolor`) become spaces and chord-only lines (`G C/G`, `Em C G`) are removed. The first line becomes
  `Title: …` (trailing `[…]` metadata removed) and everything before the first group label is
  dropped. Labels in English or Spanish, abbreviated, misspelled or with multipliers (`Coro x2`,
  `V1`, `Puente ×4`, `Chrous`) map to fixed groups (`[Verse 1]`, `[Chorus]`, `[PreChorus]`, …).
  Lines wrap at word boundaries to 25 characters (words are never split), and each group is split into 2–3-line slides,
  keeping a wrapped lyric line on one slide where possible. Each group's tag is written once, with
  slides separated by a blank line. The song opens with `[Blank]` holding a single `.` so ProPresenter
  keeps the group; copying shows a reminder to remove that period.

## Development

```sh
npm install
npm run dev     # http://localhost:8080
npm run build
```

Stack: React 18, Vite, TypeScript, Tailwind CSS, Motion. Book/chapter/verse data lives in `public/BookInfo.xml`.

## Layout

- `src/pages` — `Home` (app home), `SongFormatter`, `Simulator` (mode menu), `Game`, `End` (results)
- `src/game` — `engine.ts` (prompts and scoring), `diagnose.ts` (why a miss was wrong), `warmup.ts` (Warm Up schedule), `useGame.ts` (round state, clock, feedback)
- `src/components/glass` — frosted-glass component set; design tokens are in `src/index.css`
- `src/songs` — `formatSong.ts` (Song Formatter rules and group dictionary)
- `src/lib` — `motion.ts` (shared springs/variants), `sfx.ts` (synthesized sounds), `settings.ts`
