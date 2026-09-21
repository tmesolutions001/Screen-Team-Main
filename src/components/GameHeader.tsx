import { Timer } from 'lucide-react';
import { GlassPanel } from '@/components/glass';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs uppercase tracking-wider text-muted-foreground">{children}</p>
);

/** Floating HUD: mode, timer and score in one glass bar with the round progress. */
export const GameHeader = ({ modeLabel, score, total, timeLeft, timeLow, progress }: GameHeaderProps) => (
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

        <div className="text-right">
          <Label>Score</Label>
          <p className="font-mono text-2xl font-semibold tabular-nums">
            <span className="text-ok">{score}</span>
            <span className="text-muted-foreground">/{total}</span>
          </p>
        </div>
      </div>

      <Progress value={progress} className="mt-3 h-1.5 bg-white/10" aria-label="Round progress" />
    </GlassPanel>
  </header>
);
