import { useEffect } from 'react';
import { useAnimate, useReducedMotion } from 'motion/react';
import { Timer } from 'lucide-react';
import { GlassPanel } from '@/components/glass';
import { Progress } from '@/components/ui/progress';
import { springs } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { Feedback } from '@/game/useGame';

interface GameHeaderProps {
  modeLabel: string;
  score: number;
  total: number;
  /** Formatted mm:ss */
  timeLeft: string;
  /** Turns the timer to the warning colour for the closing seconds. */
  timeLow: boolean;
  /** Elapsed share of the round, 0–100. */
  progress: number;
  /** Latest answer result; flashes the score green or red. */
  feedback: Feedback | null;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs uppercase tracking-wider text-muted-foreground">{children}</p>
);

const glowStyle = (color: string): React.CSSProperties => ({
  background: `radial-gradient(closest-side, color-mix(in srgb, ${color} 40%, transparent), transparent)`,
  boxShadow: `0 0 28px -2px ${color}, inset 0 0 0 1px color-mix(in srgb, ${color} 70%, transparent)`,
});

/** Floating HUD: mode, timer and score in one glass bar with the round progress. */
export const GameHeader = ({ modeLabel, score, total, timeLeft, timeLow, progress, feedback }: GameHeaderProps) => {
  const [scoreRef, animate] = useAnimate<HTMLDivElement>();
  const reduceMotion = useReducedMotion();

  // Flash the matching glow. The glows are pre-rendered and only their opacity
  // animates (compositor-only). Starting a new animation replaces any running
  // one, so back-to-back answers retrigger cleanly instead of stacking.
  useEffect(() => {
    if (!feedback) return;
    const [hit, other] = feedback.correct ? ['[data-glow="ok"]', '[data-glow="miss"]'] : ['[data-glow="miss"]', '[data-glow="ok"]'];
    animate(other, { opacity: 0 }, { duration: 0.08 });
    animate(hit, { opacity: [1, 0] }, { duration: 0.75, ease: 'easeOut' });
    if (!reduceMotion) animate('[data-score]', { scale: [1.2, 1] }, springs.snappy);
  }, [feedback, animate, reduceMotion]);

  return (
    <header className="fixed top-4 inset-x-4 z-10 flex justify-center">
      <GlassPanel className="w-full max-w-4xl px-6 pt-3 pb-4">
        <div className="grid grid-cols-3 items-end">
          <div>
            <Label>Mode</Label>
            <p className="text-2xl font-semibold tracking-tight">{modeLabel}</p>
          </div>

          <div className="text-center">
            <Label>Time left</Label>
            <p
              className={cn(
                'inline-flex items-center gap-2 font-mono text-2xl font-semibold tabular-nums transition-colors duration-300',
                timeLow && 'text-miss'
              )}
            >
              <Timer className="w-5 h-5 opacity-70" aria-hidden="true" />
              {timeLeft}
            </p>
          </div>

          <div ref={scoreRef} className="relative justify-self-end text-right">
            <span data-glow="ok" aria-hidden="true" className="pointer-events-none absolute -inset-x-4 -inset-y-1.5 rounded-xl opacity-0" style={glowStyle('var(--ok)')} />
            <span data-glow="miss" aria-hidden="true" className="pointer-events-none absolute -inset-x-4 -inset-y-1.5 rounded-xl opacity-0" style={glowStyle('var(--miss)')} />
            <div className="relative">
              <Label>Score</Label>
              <p data-score className="origin-right font-mono text-2xl font-semibold tabular-nums">
                <span className="text-ok">{score}</span>
                <span className="text-muted-foreground">/{total}</span>
              </p>
            </div>
          </div>
        </div>

        <Progress value={progress} className="mt-3 h-1.5 bg-white/10" aria-label="Round progress" />
      </GlassPanel>
    </header>
  );
};
