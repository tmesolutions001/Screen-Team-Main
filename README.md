# Screen Team Simulator

Rapid-fire scripture reference trainer for ProPresenter operators. A prompt is spoken aloud
(e.g. "John 3 verse 16") and the operator types it as fast as possible; the round lasts 60 seconds.

Modes: **Classic** (book chapter verse), **Chapter–Verse**, **Book**, and **Warm Up**
(which cycles through the other modes in 15-second segments).

## Development

```sh
npm install
npm run dev     # http://localhost:8080
npm run build
```

Stack: React 18, Vite, TypeScript, Tailwind CSS. Book/chapter/verse data lives in `public/BookInfo.xml`.
