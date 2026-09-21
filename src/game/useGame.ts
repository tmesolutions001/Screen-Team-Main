import { useCallback, useEffect, useRef, useState } from 'react';
import { BibleGame, type GameMode, type MissedPrompt } from './engine';
import { playResult } from '@/lib/sfx';

export const ROUND_SECONDS = 60;

/** Result of the latest answer; `id` changes on every answer so repeats re-trigger UI feedback. */
export interface Feedback {
  id: number;
  correct: boolean;
}

/** Warm-up cycles through the other modes in 15-second segments. */
const warmupSegment = (secondsLeft: number): GameMode =>
  secondsLeft > 45 ? 'warmup' :
  secondsLeft > 30 ? 'book' :
  secondsLeft > 15 ? 'chapter-verse' :
  'classic';

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
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [isOver, setIsOver] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // The mode currently being drilled: differs from `mode` only during Warm Up's segments.
  const [activeMode, setActiveMode] = useState<GameMode>(mode);
  const deadlineRef = useRef<number | null>(null);

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
    setActiveMode(mode);

    setGame(null);
    setPrompt('');
    setScore(0);
    setTotal(0);
    setMissed([]);
    setTimeLeft(ROUND_SECONDS);
    setIsOver(false);
    deadlineRef.current = null;

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

    deadlineRef.current ??= performance.now() + ROUND_SECONDS * 1000;
    const deadline = deadlineRef.current;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const remainingMs = Math.max(0, deadline - performance.now());
      const secs = Math.ceil(remainingMs / 1000);
      setTimeLeft(secs);

      if (mode === 'warmup') {
        const segment = warmupSegment(secs);
        game.setMode(segment);
        setActiveMode(segment);
      }

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

  const submit = useCallback((input: string) => {
    if (!game || isOver || !active) return;
    game.handleInput(input);
    setTotal(game.getTotalPrompts());
  }, [game, isOver, active]);

  const spaceSubmits = useCallback(
    (input: string) => game?.spaceAction(input) === 'submit',
    [game]
  );

  return { prompt, score, total, missed, timeLeft, isOver, feedback, activeMode, submit, spaceSubmits };
}
