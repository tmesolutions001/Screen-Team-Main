import type { GameMode } from './engine';
import type { Lang } from './books';

/**
 * Warm Up: Chapter–Verse, then Book, then Classic. Each segment opens with its
 * name (shown and spoken), then a 3-2-1 countdown; segments after the first are
 * announced by a switch sound. The clock only runs while playing.
 */
export const WARMUP_SEGMENTS: ReadonlyArray<{ mode: GameMode; seconds: number }> = [
  { mode: 'chapter-verse', seconds: 30 },
  { mode: 'book', seconds: 30 },
  { mode: 'classic', seconds: 30 },
];

/** Spoken segment names (the narrator reads "Chapter–Verse" badly). */
export const SEGMENT_SPEECH: Record<Lang, Partial<Record<GameMode, string>>> = {
  en: { 'chapter-verse': 'Chapter verse', book: 'Book', classic: 'Classic' },
  es: { 'chapter-verse': 'Capítulo versículo', book: 'Libro', classic: 'Clásico' },
};

export type WarmupPhase =
  | { kind: 'switch'; segment: number }
  | { kind: 'title'; segment: number }
  /** Title blurring out; nothing new on screen yet. */
  | { kind: 'gap'; segment: number }
  | { kind: 'count'; segment: number; count: 3 | 2 | 1 }
  | { kind: 'play'; segment: number };

export interface ScheduledPhase {
  phase: WarmupPhase;
  /** ms from the start of the warm-up */
  start: number;
  end: number;
}

/** Lets the page transition settle before the first title. */
const LEAD_IN_MS = 350;
/** Switch sound, before the next title. */
const SWITCH_MS = 750;
/** Title blurs in and holds while it's spoken... */
const TITLE_MS = 1400;
/** ...then blurs out before the countdown starts. */
const GAP_MS = 300;
const COUNT_MS = 1000;

export function buildSchedule(): ScheduledPhase[] {
  const out: ScheduledPhase[] = [];
  let t = LEAD_IN_MS;
  const add = (phase: WarmupPhase, ms: number) => {
    out.push({ phase, start: t, end: t + ms });
    t += ms;
  };
  WARMUP_SEGMENTS.forEach(({ seconds }, segment) => {
    if (segment > 0) add({ kind: 'switch', segment }, SWITCH_MS);
    add({ kind: 'title', segment }, TITLE_MS);
    add({ kind: 'gap', segment }, GAP_MS);
    for (const count of [3, 2, 1] as const) add({ kind: 'count', segment, count }, COUNT_MS);
    add({ kind: 'play', segment }, seconds * 1000);
  });
  return out;
}
