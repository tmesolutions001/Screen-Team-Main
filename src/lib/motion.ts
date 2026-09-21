import type { Transition, Variants } from 'motion/react';

/**
 * Shared spring presets. Every state-driven animation uses one of these so
 * motion feels consistent, and because springs carry velocity: retargeting
 * mid-flight (a reversed toggle, a second keypress) continues from the current
 * position and speed instead of restarting or queueing.
 */
export const springs = {
  /** Presses, carets, small UI. Fast, no visible overshoot. */
  snappy: { type: 'spring', stiffness: 520, damping: 36, mass: 0.8 },
  /** Panels, sheets, page transitions. */
  smooth: { type: 'spring', stiffness: 260, damping: 30 },
  /** Large or decorative movement. */
  gentle: { type: 'spring', stiffness: 140, damping: 22 },
} satisfies Record<string, Transition>;

/**
 * Page transition. Opacity/scale only: a `filter` (or lingering opacity < 1)
 * on a page wrapper would become a backdrop root and cut the glass panels
 * inside it off from the ambient background they blur.
 */
export const pageVariants: Variants = {
  initial: { opacity: 0, scale: 0.985, y: 8 },
  enter: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 1.01, y: -8 },
};

/** Content swapped in place (score reveal, results panel). */
export const swapVariants: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  enter: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.03 },
};

/** Spread onto a motion element that swaps in place inside AnimatePresence. */
export const swapProps = {
  variants: swapVariants,
  initial: 'initial',
  animate: 'enter',
  exit: 'exit',
  transition: springs.smooth,
} as const;

/** List rows that step in one after another. */
export const rowVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0 },
};
