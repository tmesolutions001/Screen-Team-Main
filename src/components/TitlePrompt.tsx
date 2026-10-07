import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AnswerField } from '@/components/AnswerField';
import { GlassButton, GlassPanel } from '@/components/glass';
import { blurText, springs } from '@/lib/motion';

const MotionPanel = motion.create(GlassPanel);

export interface TitlePromptProps {
  open: boolean;
  /** The first line, which read as a group label (shown so the operator sees why). */
  firstLine: string;
  onSubmit: (title: string) => void;
  onSkip: () => void;
}

/**
 * Shown when pasted lyrics start with a group label instead of a title.
 * Formatting waits until the operator types a title (Enter) or skips it.
 * The title field is the simulator's answer field at form size, so typed
 * letters resolve from a blur exactly as they do in a round; Skip sits
 * directly under it at the same width and height.
 */
export const TitlePrompt = ({ open, firstLine, onSubmit, onSkip }: TitlePromptProps) => {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const headingId = useId();

  // Fresh, focused field each time it opens.
  useEffect(() => {
    if (!open) return;
    setTitle('');
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && title.trim()) {
      e.preventDefault();
      onSubmit(title.trim());
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="title-prompt"
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <MotionPanel
            strong
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            className="w-full max-w-lg space-y-5 p-6 sm:p-8"
            // Darker than plain strong glass: it sits over the pasted lyrics and must stay legible.
            style={{ background: 'rgba(22, 22, 28, 0.86)' }}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={springs.smooth}
          >
            <div className="space-y-2 text-center">
              <motion.h2 id={headingId} {...blurText} className="text-3xl font-bold tracking-tight text-gradient-warm">
                No Title Detected!
              </motion.h2>
              <p className="text-sm text-muted-foreground">
                The first line, <span className="font-mono text-foreground">{firstLine}</span>, is a group label. Type the
                song's title, or skip it.
              </p>
            </div>

            <div className="space-y-3">
              <AnswerField
                ref={inputRef}
                size="md"
                value={title}
                onValueChange={setTitle}
                onKeyDown={onKeyDown}
                label="Song title"
                placeholder="Song title"
              />
              {/* Same box as the field above: full width, h-14, pill. */}
              <GlassButton className="h-14 w-full text-lg" onClick={onSkip}>
                Skip
              </GlassButton>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              <kbd className="glass-flat rounded-md px-1.5 py-0.5 font-mono text-foreground">Enter</kbd> to use this title ·
              Skip leaves the Title line out
            </p>
          </MotionPanel>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
