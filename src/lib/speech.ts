/**
 * Speech synthesis wrapper that works around the ways Chrome drops prompts.
 *
 * - `speechSynthesis.cancel()` is global. A round that is animating out used to
 *   silence the round that replaced it. Speaking is owned: `stop(owner)` is a
 *   no-op unless that owner is the one currently speaking.
 * - Chrome (especially on Windows) often discards a `speak()` issued in the same
 *   tick as a `cancel()`. Speaking is deferred a few ms; a later request in the
 *   meantime simply supersedes it.
 * - An utterance that Chrome accepted but never started is retried once.
 * - The live utterance is referenced so it cannot be garbage-collected mid-way,
 *   which silently truncates speech in Chrome.
 */

let currentOwner: object | null = null;
let generation = 0;
let live: SpeechSynthesisUtterance | null = null;

const SPEAK_DELAY_MS = 40;
const START_TIMEOUT_MS = 500;

const synth = () => (typeof window !== 'undefined' ? window.speechSynthesis : undefined);

const cancelIfBusy = (s: SpeechSynthesis) => {
  // cancel() while idle can wedge Chrome so the next speak() is ignored.
  if (s.speaking || s.pending) s.cancel();
};

const fire = (gen: number, text: string, rate: number, retry: boolean) => {
  const s = synth();
  if (!s || gen !== generation) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  let started = false;
  utterance.onstart = () => {
    started = true;
  };
  live = utterance;

  s.resume(); // Chrome can be left paused after a cancel
  s.speak(utterance);

  if (retry) {
    setTimeout(() => {
      if (gen === generation && !started && !s.speaking && !s.pending) fire(gen, text, rate, false);
    }, START_TIMEOUT_MS);
  }
};

/** Speak `text` for `owner`, replacing whatever is currently being spoken. */
export const speak = (owner: object, text: string, rate = 1.5) => {
  const s = synth();
  if (!s) return;
  currentOwner = owner;
  const gen = ++generation;
  cancelIfBusy(s);
  setTimeout(() => fire(gen, text, rate, true), SPEAK_DELAY_MS);
};

/** Stop speaking, but only if `owner` is the one speaking. */
export const stop = (owner: object) => {
  if (currentOwner !== owner) return;
  generation++;
  live = null;
  const s = synth();
  if (s) cancelIfBusy(s);
};

/** For tests and diagnostics. */
export const isSpeakingFor = (owner: object) => currentOwner === owner && live !== null;
