import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameHeader } from '@/components/GameHeader';
import { Progress } from '@/components/ui/progress';
import { GlassInput } from '@/components/glass';
import { Timer } from 'lucide-react';
import { parseMode } from '@/game/engine';
import { ROUND_SECONDS, useGame } from '@/game/useGame';
import type { EndState } from './End';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const Game = () => {
  const navigate = useNavigate();
  const { mode } = useParams<{ mode?: string }>();
  const gameMode = parseMode(mode);
  const { prompt, score, total, missed, timeLeft, isOver, submit, spaceSubmits } = useGame(gameMode);
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
  }, [isOver, navigate, score, missed, total]);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <GameHeader score={score} total={total} timeLeft={formatTime(timeLeft)} />

      <div className="fixed top-12 left-0 right-0 px-4">
        <div className="flex items-center gap-2 mb-1">
          <Timer size={16} />
          <span className="text-sm">Time Remaining: {formatTime(timeLeft)}</span>
        </div>
        <Progress
          value={progressValue}
          className="w-full h-2 bg-gray-700 overflow-hidden"
        />
      </div>

      {isOver ? (
        <div className="text-center space-y-8 max-w-xl w-full animate-fade-in">
          <h2 className="text-8xl font-bold gradient-text">
            {score}/{total}
          </h2>
        </div>
      ) : (
        <div className="text-center space-y-8 max-w-xl w-full">
          {/* Hidden visually but available for screen readers */}
          <h2 className="sr-only">{prompt}</h2>
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
                className="px-6 py-3 text-gradient caret-transparent"
                aria-label="Type the answer for the prompt"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Game;
