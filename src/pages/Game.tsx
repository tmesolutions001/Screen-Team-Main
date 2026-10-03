import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { GameHeader } from '@/components/GameHeader';
import { AnswerField } from '@/components/AnswerField';
import { CountUp } from '@/components/CountUp';
import { MODE_LABEL, parseMode, type GameMode } from '@/game/engine';
import { useGame } from '@/game/useGame';
import { blurText, swapProps } from '@/lib/motion';
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

/** Submit-key hint under the input, keyed by the mode being drilled; mirrors BibleGame.spaceAction. */
const HINT: Record<GameMode, React.ReactNode> = {
  classic: <><Kbd>Enter</Kbd> to submit</>,
  'chapter-verse': <><Kbd>Enter</Kbd> to submit</>,
  book: <><Kbd>Space</Kbd> or <Kbd>Enter</Kbd> to submit</>,
  // Never drilled directly: Warm Up always reports the segment's own mode.
  warmup: <><Kbd>Enter</Kbd> to submit</>,
};

const Game = () => {
  const navigate = useNavigate();
  const { mode } = useParams<{ mode?: string }>();
  const gameMode = parseMode(mode);
  // False once this page starts animating out; stops the clock and speech straight away.
  const isPresent = useIsPresent();
  const {
    prompt, score, total, missed, timeLeft, progress, isOver, feedback, activeMode, phase, accepting, submit, spaceSubmits,
  } = useGame(gameMode, isPresent);
  const isWarmup = gameMode === 'warmup';
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Warm Up drops any half-typed answer when a segment ends, so it is never
  // scored against a prompt the player never heard.
  useEffect(() => {
    setInput('');
  }, [activeMode, accepting]);

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

  // Stable identity so the memoized HUD is not re-rendered by every keystroke.
  const quit = useCallback(() => navigate('/simulator'), [navigate]);

  // Read the DOM value rather than React state so a submit that lands in the
  // same event burst as the last keystroke can never score a stale value.
  const submitInput = () => {
    submit(inputRef.current?.value ?? input);
    setInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' && spaceSubmits(e.currentTarget.value)) {
      e.preventDefault();
      submitInput();
    }
  };

  const accuracy = total ? Math.round((score / total) * 100) : 0;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
      <GameHeader
        modeLabel={MODE_LABEL[gameMode]}
        segmentLabel={isWarmup ? MODE_LABEL[activeMode] : undefined}
        score={score}
        total={total}
        timeLeft={formatTime(timeLeft)}
        timeLow={accepting && !isOver && timeLeft <= LOW_TIME_SECONDS}
        progress={progress}
        feedback={feedback}
        onQuit={quit}
      />

      <AnimatePresence mode="popLayout">
        {isOver ? (
          <motion.div key="score" {...swapProps} className="text-center">
            <h2 className="text-8xl font-bold tracking-tight text-gradient tabular-nums">
              <CountUp value={score} />/{total}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">{accuracy}% accuracy</p>
          </motion.div>
        ) : (
          // initial={false} here, not on AnimatePresence: the presence-level flag is
          // inherited by everything inside and would block the letters' enter animation.
          <motion.main key="stage" {...swapProps} initial={false} className="w-full max-w-4xl space-y-5">
            {/* The prompt is spoken, not shown; kept in the DOM for screen readers */}
            <h2 className="sr-only">{prompt}</h2>
            {/* Fixed-height slot above the field: Warm Up's segment title blurs in and out here,
                then the usual instruction returns once the segment is being played. */}
            <div className="relative grid h-10 place-items-center" aria-live="polite">
              <AnimatePresence>
                {phase?.kind === 'title' ? (
                  <motion.p
                    key={`title-${phase.segment}`}
                    {...blurText}
                    className="col-start-1 row-start-1 text-3xl font-bold tracking-tight text-gradient-warm"
                  >
                    {MODE_LABEL[activeMode]}
                  </motion.p>
                ) : accepting ? (
                  <motion.p
                    key="instruction"
                    {...blurText}
                    className="col-start-1 row-start-1 text-xs uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    Listen · type the reference
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
            <form onSubmit={handleSubmit} className="w-full">
              <AnswerField
                ref={inputRef}
                value={input}
                // Typing is held until the countdown ends, so nothing is half-typed when the segment starts.
                onValueChange={(value) => accepting && setInput(value)}
                onKeyDown={handleKeyDown}
                feedback={feedback}
                countdown={phase?.kind === 'count' ? phase.count : null}
              />
            </form>
            <p className="text-center text-sm text-muted-foreground">{HINT[activeMode]}</p>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;
