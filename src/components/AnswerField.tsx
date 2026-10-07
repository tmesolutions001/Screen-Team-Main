import { forwardRef, useEffect, useLayoutEffect, useRef, type CSSProperties, type KeyboardEventHandler } from 'react';
import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'motion/react';
import { GlassInput } from '@/components/glass';
import { blurText, springs } from '@/lib/motion';
import type { Feedback } from '@/game/useGame';

interface AnswerFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  /** Latest answer result; pulses the field green or red (with a small shake on a miss). */
  feedback?: Feedback | null;
  /** Warm Up countdown digit, shown centred in the field in place of the caret. */
  countdown?: number | null;
  /** lg: the simulator's answer field. md: the same typing animation at form size, fixed height (h-14). */
  size?: 'lg' | 'md';
  label?: string;
  placeholder?: string;
}

const SIZES = {
  lg: { font: 'text-6xl font-bold', wrapper: undefined, input: 'px-6 py-5' },
  md: { font: 'text-2xl font-semibold', wrapper: 'h-14', input: 'h-full px-6' },
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
  (
    { value, onValueChange, onKeyDown, feedback = null, countdown = null, size = 'lg', label = 'Type the answer for the prompt', placeholder },
    ref
  ) => {
    const [scope, animate] = useAnimate<HTMLDivElement>();
    const reduceMotion = useReducedMotion();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const displayRef = useRef<HTMLDivElement>(null);

    // When text outgrows the field the real input scrolls to keep the cursor in
    // view; mirror that offset so the display layer stays aligned with it.
    useLayoutEffect(() => {
      if (inputRef.current && displayRef.current) {
        displayRef.current.style.transform = `translateX(${-inputRef.current.scrollLeft}px)`;
      }
    }, [value]);

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
      <div ref={scope} className={`w-full font-mono ${SIZES[size].font}`}>
        <GlassInput
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={onKeyDown}
          wrapperClassName={SIZES[size].wrapper}
          placeholder={placeholder}
          className={`${SIZES[size].input} text-transparent caret-transparent`}
          aria-label={label}
          autoComplete="off"
          spellCheck={false}
        >
          <span data-ring="ok" aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0" style={ringStyle('var(--ok)')} />
          <span data-ring="miss" aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0" style={ringStyle('var(--miss)')} />
          <div className="answer-display" aria-hidden="true">
            <div ref={displayRef} className="flex h-full items-center whitespace-pre pl-6">
              {Array.from(value).map((char, i) => (
                <motion.span
                  // Index + character: appending mounts only the new letter.
                  key={`${i}-${char}`}
                  className="answer-char"
                  style={{ '--i': i } as CSSProperties}
                  // New letters resolve from a blur; removal is instant, so rapid typing and submits never wait.
                  initial={blurText.initial}
                  animate={blurText.animate}
                  transition={blurText.transition}
                >
                  {char}
                </motion.span>
              ))}
              <motion.span
                layout
                transition={springs.snappy}
                animate={{ opacity: countdown === null ? 1 : 0 }}
                className="answer-caret"
              >
                {/* Re-keyed per keystroke so the blink restarts solid while typing */}
                <span key={value.length} className="answer-caret__blink" />
              </motion.span>
            </div>
            {/* Digits share one grid cell, so the outgoing one blurs out where the next blurs in. */}
            <div className="absolute inset-0 grid place-items-center">
              <AnimatePresence>
                {countdown !== null && (
                  <motion.span key={countdown} {...blurText} className="col-start-1 row-start-1 text-gradient">
                    {countdown}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </GlassInput>
      </div>
    );
  }
);
AnswerField.displayName = 'AnswerField';
