import { forwardRef, useEffect, type CSSProperties, type KeyboardEventHandler } from 'react';
import { motion, useAnimate, useReducedMotion } from 'motion/react';
import { GlassInput } from '@/components/glass';
import { springs } from '@/lib/motion';
import type { Feedback } from '@/game/useGame';

interface AnswerFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  /** Latest answer result; pulses the field green or red (with a small shake on a miss). */
  feedback: Feedback | null;
}

// New characters resolve out of a slight blur and rise. Opacity/blur are short
// tweens (a spring could overshoot into an invalid negative blur); only the
// rise is sprung. Removal is instant, so rapid typing and submits never wait.
const charInitial = { opacity: 0, filter: 'blur(8px)', y: 4 };
const charAnimate = { opacity: 1, filter: 'blur(0px)', y: 0 };
const charTransition = {
  ...springs.snappy,
  opacity: { duration: 0.16, ease: 'easeOut' },
  filter: { duration: 0.22, ease: 'easeOut' },
} as const;

const ringStyle = (color: string): CSSProperties => ({
  boxShadow: `0 0 0 2px ${color}, 0 0 44px -6px ${color}`,
});

/**
 * The simulator's answer input. The real <input> keeps all typing, focus and
 * submit behaviour but renders its text transparent; a display layer on top
 * draws each character as its own element so it can animate in, followed by a
 * caret that springs to the end of the text.
 */
export const AnswerField = forwardRef<HTMLInputElement, AnswerFieldProps>(
  ({ value, onValueChange, onKeyDown, feedback }, ref) => {
    const [scope, animate] = useAnimate<HTMLDivElement>();
    const reduceMotion = useReducedMotion();

    // Same pattern as the HUD score: pre-rendered rings, opacity-only, and each
    // new answer replaces the running animation so rapid answers never stack.
    useEffect(() => {
      if (!feedback) return;
      const [hit, other] = feedback.correct ? ['[data-ring="ok"]', '[data-ring="miss"]'] : ['[data-ring="miss"]', '[data-ring="ok"]'];
      animate(other, { opacity: 0 }, { duration: 0.08 });
      animate(hit, { opacity: [1, 0] }, { duration: 0.6, ease: 'easeOut' });
      if (!feedback.correct && !reduceMotion) {
        animate(scope.current, { x: [0, -7, 6, -4, 2, 0] }, { duration: 0.32, ease: 'easeOut' });
      }
    }, [feedback, animate, scope, reduceMotion]);

    return (
      // Font lives on the wrapper so the input and the display layer share metrics.
      <div ref={scope} className="w-full text-6xl font-bold font-mono">
        <GlassInput
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="px-6 py-5 text-transparent caret-transparent"
          aria-label="Type the answer for the prompt"
          autoComplete="off"
          spellCheck={false}
        >
          <span data-ring="ok" aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0" style={ringStyle('var(--ok)')} />
          <span data-ring="miss" aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0" style={ringStyle('var(--miss)')} />
          <div className="answer-display" aria-hidden="true">
            <div className="flex h-full items-center whitespace-pre pl-6">
              {Array.from(value).map((char, i) => (
                <motion.span
                  // Index + character: appending mounts only the new letter.
                  key={`${i}-${char}`}
                  className="answer-char"
                  style={{ '--i': i } as CSSProperties}
                  initial={charInitial}
                  animate={charAnimate}
                  transition={charTransition}
                >
                  {char}
                </motion.span>
              ))}
              <motion.span layout transition={springs.snappy} className="answer-caret">
                {/* Re-keyed per keystroke so the blink restarts solid while typing */}
                <span key={value.length} className="answer-caret__blink" />
              </motion.span>
            </div>
          </div>
        </GlassInput>
      </div>
    );
  }
);
AnswerField.displayName = 'AnswerField';
