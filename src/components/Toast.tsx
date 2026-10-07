import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { blurText, springs } from '@/lib/motion';

const RING_SIZE = 36;
const RING_STROKE = 2;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export interface ToastProps {
  /** Changes on every show; a new id restarts the toast (and its timer) cleanly. */
  id: number | null;
  message: string;
  /** Auto-close delay in ms; the ring drains over exactly this long. */
  duration?: number;
  onClose: () => void;
}

/**
 * Bottom-centre notification. The message blurs in like typed text; an SVG ring
 * around the close button drains over `duration`, then the toast fades away.
 * The timeout is the source of truth for closing; the ring is its picture.
 */
export const Toast = ({ id, message, duration = 2000, onClose }: ToastProps) => {
  // Latest onClose without restarting the timer when the parent re-renders.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (id === null) return;
    const timer = setTimeout(() => closeRef.current(), duration);
    return () => clearTimeout(timer);
  }, [id, duration]);

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4" role="status" aria-live="polite">
      <AnimatePresence>
        {id !== null && (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98, transition: { opacity: { duration: 0.25, ease: 'easeOut' }, default: springs.smooth } }}
            transition={springs.smooth}
            className="glass glass-strong pointer-events-auto flex items-center gap-3 rounded-pill py-2 pl-5 pr-2"
          >
            <motion.p {...blurText} className="text-sm font-medium text-foreground">
              {message}
            </motion.p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss"
              className="focus-ring relative grid shrink-0 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:text-foreground"
              style={{ width: RING_SIZE, height: RING_SIZE }}
            >
              <svg width={RING_SIZE} height={RING_SIZE} className="absolute inset-0 -rotate-90" aria-hidden>
                <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" stroke="var(--glass-border)" strokeWidth={RING_STROKE} />
                {/* Time-driven, so a linear tween rather than a spring: it must empty exactly on the deadline. */}
                <motion.circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  fill="none"
                  stroke="var(--accent-2)"
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={RING_LENGTH}
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: RING_LENGTH }}
                  transition={{ duration: duration / 1000, ease: 'linear' }}
                />
              </svg>
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};
