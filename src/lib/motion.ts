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

/**
 * Staggered entrance. These share the page wrapper's variant labels, so a
 * container just needs `variants={staggerContainer}`: it inherits "enter" from
 * the page transition and cascades it to its items.
 */
export const staggerContainer: Variants = {
  initial: {},
  enter: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  enter: { opacity: 1, y: 0, transition: springs.smooth },
};

/**
 * A list row that grows into place. Height uses an overdamped spring (no
 * overshoot past its natural size, so the rows below never wobble); blur and
 * opacity are short tweens, like answer letters, since a spring could carry
 * blur negative. Settled rows drop the filter so they don't stay a filter layer.
 */
export const rowReveal = {
  initial: { height: 0, opacity: 0, y: 10, filter: 'blur(6px)' },
  animate: { height: 'auto', opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } },
  transition: {
    height: { type: 'spring', stiffness: 260, damping: 36 },
    y: springs.smooth,
    opacity: { duration: 0.28, ease: 'easeOut' },
    filter: { duration: 0.32, ease: 'easeOut' },
  },
} as const;
