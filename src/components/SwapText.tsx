import { AnimatePresence, motion } from 'motion/react';
import { blurText } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Text that blurs from one value to the next (a language switch). Old and new
 * share one grid cell, so they cross-fade in place; switching again mid-swap
 * just retargets, and spam-switching never queues.
 */
export const SwapText = ({
  children,
  className,
  itemClassName,
  block,
}: {
  children: string;
  className?: string;
  /** Classes for the text itself, e.g. a gradient fill (it can't sit on an ancestor of animated text). */
  itemClassName?: string;
  block?: boolean;
}) => (
  <span className={cn(block ? 'grid' : 'inline-grid', className)}>
    <AnimatePresence initial={false}>
      <motion.span key={children} {...blurText} className={cn('col-start-1 row-start-1', itemClassName)}>
        {children}
      </motion.span>
    </AnimatePresence>
  </span>
);
