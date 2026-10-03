import { useCallback, useEffect, useRef, useState } from 'react';
import { BibleGame, type GameMode, type MissedPrompt } from './engine';
import { SEGMENT_SPEECH, WARMUP_SEGMENTS, buildSchedule, type WarmupPhase } from './warmup';
import { playResult, playSegmentSwitch, playThump } from '@/lib/sfx';

export const ROUND_SECONDS = 60;

/** Result of the latest answer; `id` changes on every answer so repeats re-trigger UI feedback. */
export interface Feedback {
  id: number;
  correct: boolean;
}

const WARMUP_SCHEDULE = buildSchedule();
const FIRST_SEGMENT = WARMUP_SEGMENTS[0];

const initialMode = (mode: GameMode) => (mode === 'warmup' ? FIRST_SEGMENT.mode : mode);
const initialSeconds = (mode: GameMode) => (mode === 'warmup' ? FIRST_SEGMENT.seconds : ROUND_SECONDS);

/**
 * @param active false while the page is animating out: the clock and speech
 *   stop immediately instead of running on until the exit animation unmounts
 *   the page. If the exit is reversed, the round resumes against the same deadline.
 */
export function useGame(mode: GameMode, active = true) {
  const [game, setGame] = useState<BibleGame | null>(null);
  const [prompt, setPrompt] = useState('');
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [missed, setMissed] = useState<MissedPrompt[]>([]);
  const [timeLeft, setTimeLeft] = useState(() => initialSeconds(mode));
  /** Elapsed share of the round (Warm Up: of the current segment), 0–100. */
  const [progress, setProgress] = useState(0);
  const [isOver, setIsOver] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // The mode currently being drilled: differs from `mode` only during Warm Up's segments.
  const [activeMode, setActiveMode] = useState<GameMode>(() => initialMode(mode));
  // Warm Up only: where in the title/countdown/play schedule the round is. Null before the first title.
  const [phase, setPhase] = useState<WarmupPhase | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const warmupStartRef = useRef<number | null>(null);
  const enteredPhaseRef = useRef(-1);

  useEffect(() => {
    let cancelled = false;
    const newGame = new BibleGame(
      {
        onPrompt: setPrompt,
        onScore: setScore,
        onMissed: setMissed,
        onResult: (correct) => {
          playResult(correct);
          setFeedback((prev) => ({ id: (prev?.id ?? 0) + 1, correct }));
        },
      },
      mode
    );
    setFeedback(null);
    setActiveMode(initialMode(mode));
    setPhase(null);

    setGame(null);
    setPrompt('');
    setScore(0);
    setTotal(0);
    setMissed([]);
    setTimeLeft(initialSeconds(mode));
    setProgress(0);
    setIsOver(false);
    deadlineRef.current = null;
    warmupStartRef.current = null;
    enteredPhaseRef.current = -1;

    newGame.loadXmlDocument('/BookInfo.xml').then(() => {
      if (cancelled) return;
      newGame.start();
      setGame(newGame);
    });

    return () => {
      cancelled = true;
      newGame.cancelSpeech();
    };
  }, [mode]);

  useEffect(() => {
    if (!game) return;
    if (!active) {
      game.cancelSpeech();
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;

    if (mode === 'warmup') {
      // Cues fire once, on entering their phase; a reversed page exit resumes
      // the same schedule without replaying them.
      const enter = (next: WarmupPhase) => {
        const segment = WARMUP_SEGMENTS[next.segment];
        switch (next.kind) {
          case 'switch':
            game.pause();
            playSegmentSwitch();
            break;
          case 'title':
            game.pause();
            setActiveMode(segment.mode);
            setTimeLeft(segment.seconds);
            setProgress(0);
            game.announce(SEGMENT_SPEECH[segment.mode] ?? segment.mode);
            break;
          case 'count':
            playThump();
            break;
          case 'play':
            game.beginSegment(segment.mode);
            break;
        }
      };

      warmupStartRef.current ??= performance.now();
      const start = warmupStartRef.current;

      const tick = () => {
        const now = performance.now() - start;
        const index = WARMUP_SCHEDULE.findIndex((p) => now < p.end);
        if (index === -1) {
          game.pause();
          setPhase(null);
          setTimeLeft(0);
          setProgress(100);
          setIsOver(true);
          return;
        }
        const current = WARMUP_SCHEDULE[index];
        if (now < current.start) {
          timeout = setTimeout(tick, current.start - now + 5);
          return;
        }
        if (enteredPhaseRef.current !== index) {
          enteredPhaseRef.current = index;
          setPhase(current.phase);
          enter(current.phase);
        }

        let wait = current.end - now;
        if (current.phase.kind === 'play') {
          const segmentMs = current.end - current.start;
          const remainingMs = current.end - now;
          const secs = Math.ceil(remainingMs / 1000);
          setTimeLeft(secs);
          setProgress(((segmentMs - remainingMs) / segmentMs) * 100);
          wait = Math.min(wait, remainingMs - (secs - 1) * 1000);
        }
        timeout = setTimeout(tick, wait + 5);
      };

      tick();
      return () => clearTimeout(timeout);
    }

    deadlineRef.current ??= performance.now() + ROUND_SECONDS * 1000;
    const deadline = deadlineRef.current;

    const tick = () => {
      const remainingMs = Math.max(0, deadline - performance.now());
      const secs = Math.ceil(remainingMs / 1000);
      setTimeLeft(secs);
      setProgress(((ROUND_SECONDS - secs) / ROUND_SECONDS) * 100);

      if (secs === 0) {
        game.cancelSpeech();
        setIsOver(true);
        return;
      }
      // Wake just after the next whole-second boundary.
      timeout = setTimeout(tick, remainingMs - (secs - 1) * 1000 + 5);
    };

    tick();
    return () => clearTimeout(timeout);
  }, [game, mode, active]);

  // Warm Up only takes answers while a segment is being played.
  const accepting = mode !== 'warmup' || phase?.kind === 'play';

  const submit = useCallback((input: string) => {
    if (!game || isOver || !active || !accepting) return;
    game.handleInput(input);
    setTotal(game.getTotalPrompts());
  }, [game, isOver, active, accepting]);

  const spaceSubmits = useCallback(
    (input: string) => game?.spaceAction(input) === 'submit',
    [game]
  );

  return { prompt, score, total, missed, timeLeft, progress, isOver, feedback, activeMode, phase, accepting, submit, spaceSubmits };
}
