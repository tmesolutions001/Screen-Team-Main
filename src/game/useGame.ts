import { useCallback, useEffect, useState } from 'react';
import { BibleGame, type GameMode, type MissedPrompt } from './engine';

export const ROUND_SECONDS = 60;

/** Warm-up cycles through the other modes in 15-second segments. */
const warmupSegment = (secondsLeft: number): GameMode =>
  secondsLeft > 45 ? 'warmup' :
  secondsLeft > 30 ? 'book' :
  secondsLeft > 15 ? 'chapter-verse' :
  'classic';

export function useGame(mode: GameMode) {
  const [game, setGame] = useState<BibleGame | null>(null);
  const [prompt, setPrompt] = useState('');
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [missed, setMissed] = useState<MissedPrompt[]>([]);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  // performance.now() timestamp the round ends at; lets the UI animate the timer continuously.
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const newGame = new BibleGame(
      { onPrompt: setPrompt, onScore: setScore, onMissed: setMissed },
      mode
    );

    setGame(null);
    setPrompt('');
    setScore(0);
    setTotal(0);
    setMissed([]);
    setTimeLeft(ROUND_SECONDS);
    setEndsAt(null);
    setIsOver(false);

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

    const deadline = performance.now() + ROUND_SECONDS * 1000;
    setEndsAt(deadline);
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const remainingMs = Math.max(0, deadline - performance.now());
      const secs = Math.ceil(remainingMs / 1000);
      setTimeLeft(secs);

      if (mode === 'warmup') game.setMode(warmupSegment(secs));

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
  }, [game, mode]);

  const submit = useCallback((input: string) => {
    if (!game || isOver) return;
    game.handleInput(input);
    setTotal(game.getTotalPrompts());
  }, [game, isOver]);

  const spaceSubmits = useCallback(
    (input: string) => game?.spaceAction(input) === 'submit',
    [game]
  );

  return { ready: game !== null, prompt, score, total, missed, timeLeft, endsAt, isOver, submit, spaceSubmits };
}
