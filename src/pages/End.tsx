import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, LayoutGrid, RotateCcw } from 'lucide-react';
import { MODE_LABEL, type GameMode, type MissedPrompt } from '@/game/engine';
import { GlassButton, GlassPanel, IconButton } from '@/components/glass';
import { rowVariants, springs, swapProps } from '@/lib/motion';

export interface EndState {
  mode: GameMode;
  score: number;
  totalPrompts: number;
  missedPrompts: MissedPrompt[];
  hasErrors: boolean;
}

const MotionPanel = motion.create(GlassPanel);

const modePath = (mode: GameMode) => (mode === 'classic' ? '/game' : `/game/${mode}`);

const Stat = ({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'miss' }) => (
  <GlassPanel flat className="px-4 py-3 text-center min-w-[5.5rem]">
    <p className={`text-2xl font-semibold tabular-nums ${tone === 'ok' ? 'text-ok' : tone === 'miss' ? 'text-miss' : ''}`}>
      {value}
    </p>
    <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
  </GlassPanel>
);

const End = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as EndState | null;
  const [visibleMissed, setVisibleMissed] = useState(0);
  const [showScore, setShowScore] = useState(true);

  useEffect(() => {
    if (!state) navigate('/simulator');
  }, [state, navigate]);

  // Show the score for 2 seconds first.
  useEffect(() => {
    const scoreTimer = setTimeout(() => setShowScore(false), 2000);
    return () => clearTimeout(scoreTimer);
  }, []);

  // Then reveal missed prompts one at a time.
  const missedCount = state?.missedPrompts.length ?? 0;
  useEffect(() => {
    if (showScore || visibleMissed >= missedCount) return;
    const revealTimer = setTimeout(() => setVisibleMissed(n => n + 1), 600);
    return () => clearTimeout(revealTimer);
  }, [showScore, visibleMissed, missedCount]);

  if (!state) return null;

  const { mode, score, totalPrompts, missedPrompts, hasErrors } = state;
  const accuracy = totalPrompts ? Math.round((score / totalPrompts) * 100) : 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <IconButton onClick={() => navigate('/')} className="fixed top-4 right-4" aria-label="Back to Screen Team App">
        <HomeIcon className="w-5 h-5" />
      </IconButton>

      <AnimatePresence mode="popLayout">
        {showScore ? (
          <motion.div key="score" {...swapProps} className="text-center">
            <h1 className="text-8xl font-bold tracking-tight text-gradient tabular-nums">
              {score}/{totalPrompts}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">{accuracy}% accuracy</p>
          </motion.div>
        ) : (
          <MotionPanel key="results" {...swapProps} className="w-full max-w-2xl p-8">
            <header className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Round complete · {MODE_LABEL[mode]}
                </p>
                <h1 className="mt-1 text-6xl font-bold tracking-tight text-gradient tabular-nums leading-none">
                  {hasErrors ? `${score}/${totalPrompts}` : totalPrompts ? 'Perfect round' : 'No answers'}
                </h1>
              </div>
              <div className="flex gap-3">
                <Stat label="Accuracy" value={`${accuracy}%`} />
                <Stat label="Correct" value={String(score)} tone="ok" />
                <Stat label="Missed" value={String(missedPrompts.length)} tone={hasErrors ? 'miss' : undefined} />
              </div>
            </header>

            {hasErrors ? (
              <section className="mt-8" aria-label="What you missed">
                <div className="grid grid-cols-[2.5rem_1fr_1fr] px-3 pb-2 text-xs uppercase tracking-wider text-muted-foreground border-b border-glass-border">
                  <span>#</span>
                  <span>Prompt</span>
                  <span>You typed</span>
                </div>
                <ol className="divide-y divide-glass-border">
                  {missedPrompts.slice(0, visibleMissed).map((item, i) => (
                    <motion.li
                      key={item.id}
                      variants={rowVariants}
                      initial="initial"
                      animate="enter"
                      transition={springs.smooth}
                      className="grid grid-cols-[2.5rem_1fr_1fr] items-baseline px-3 py-3 font-mono text-lg"
                    >
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-foreground">{item.prompt}</span>
                      <span className="text-miss">{item.userInput.trim() || '—'}</span>
                    </motion.li>
                  ))}
                </ol>
              </section>
            ) : (
              <p className="mt-8 text-muted-foreground">
                {totalPrompts
                  ? `Every prompt answered correctly — ${totalPrompts} for ${totalPrompts}.`
                  : 'No prompts were answered this round.'}
              </p>
            )}

            <footer className="mt-8 flex justify-end gap-3">
              <GlassButton onClick={() => navigate('/simulator')}>
                <LayoutGrid className="w-4 h-4" /> Modes
              </GlassButton>
              <GlassButton variant="accent" onClick={() => navigate(modePath(mode))}>
                <RotateCcw className="w-4 h-4" /> Play again
              </GlassButton>
            </footer>
          </MotionPanel>
        )}
      </AnimatePresence>
    </div>
  );
};

export default End;
