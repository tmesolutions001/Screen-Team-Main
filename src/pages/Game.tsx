import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { GameHeader } from '@/components/GameHeader';
import { GlassInput } from '@/components/glass';
import { MODE_LABEL, parseMode, type GameMode } from '@/game/engine';
import { ROUND_SECONDS, useGame } from '@/game/useGame';
import { swapProps } from '@/lib/motion';
import type { EndState } from './End';

const LOW_TIME_SECONDS = 10;

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="glass-flat rounded-md px-1.5 py-0.5 font-mono text-xs text-foreground">{children}</kbd>
);

/** Submit-key hint under the input; mirrors the rules in BibleGame.spaceAction. */
const HINT: Record<GameMode, React.ReactNode> = {
  classic: <><Kbd>Enter</Kbd> to submit</>,
  'chapter-verse': <><Kbd>Enter</Kbd> to submit</>,
  book: <><Kbd>Space</Kbd> or <Kbd>Enter</Kbd> to submit</>,
  warmup: <>Modes rotate every 15 seconds</>,
};

const Game = () => {
  const navigate = useNavigate();
  const { mode } = useParams<{ mode?: string }>();
  const gameMode = parseMode(mode);
  // False once this page starts animating out; stops the clock and speech straight away.
  const isPresent = useIsPresent();
  const { prompt, score, total, missed, timeLeft, isOver, submit, spaceSubmits } = useGame(gameMode, isPresent);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Show the final score for 3 seconds, then move to the results page.
  useEffect(() => {
    if (!isOver) return;
    const transitionTimer = setTimeout(() => {
      const state: EndState = {
        mode: gameMode,
        score,
        missedPrompts: missed,
        totalPrompts: total,
        hasErrors: missed.length > 0,
      };
      navigate('/end', { state });
    }, 3000);
    return () => clearTimeout(transitionTimer);
  }, [isOver, navigate, gameMode, score, missed, total]);

  const submitInput = () => {
    submit(input);
    setInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' && spaceSubmits(input)) {
      e.preventDefault();
      submitInput();
    }
  };

  const progressValue = ((ROUND_SECONDS - timeLeft) / ROUND_SECONDS) * 100;
  const accuracy = total ? Math.round((score / total) * 100) : 0;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
      <GameHeader
        modeLabel={MODE_LABEL[gameMode]}
        score={score}
        total={total}
        timeLeft={formatTime(timeLeft)}
        timeLow={timeLeft <= LOW_TIME_SECONDS && !isOver}
        progress={progressValue}
      />

      <AnimatePresence mode="popLayout" initial={false}>
        {isOver ? (
          <motion.div key="score" {...swapProps} className="text-center">
            <h2 className="text-8xl font-bold tracking-tight text-gradient tabular-nums">
              {score}/{total}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">{accuracy}% accuracy</p>
          </motion.div>
        ) : (
          <motion.main key="stage" {...swapProps} className="w-full max-w-4xl space-y-5">
            {/* The prompt is spoken, not shown; kept in the DOM for screen readers */}
            <h2 className="sr-only">{prompt}</h2>
            <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Listen · type the reference
            </p>
            <form onSubmit={handleSubmit} className="w-full">
              {/* Caret wrapper carries the input's font so its ch/em units line up */}
              <div
                className="relative w-full custom-caret text-6xl font-bold font-mono"
                style={{ '--caret-ch': `${input.length}ch` } as React.CSSProperties}
              >
                <GlassInput
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="px-6 py-5 text-gradient caret-transparent"
                  aria-label="Type the answer for the prompt"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </form>
            <p className="text-center text-sm text-muted-foreground">{HINT[gameMode]}</p>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;
