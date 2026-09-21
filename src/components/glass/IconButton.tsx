import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/motion';
import { useSpotlight } from '@/hooks/useSpotlight';

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  /** Required: icon-only buttons need an accessible name. */
  'aria-label': string;
  children?: ReactNode;
}

/** Round frosted button for a single icon. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, type = 'button', ...props }, forwardedRef) => {
    const spotRef = useSpotlight<HTMLButtonElement>();
    return (
      <motion.button
        ref={(node) => {
          spotRef.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        type={type}
        className={cn(
          'glass spotlight focus-ring',
          'inline-flex h-11 w-11 items-center justify-center rounded-pill',
          'text-foreground/80 hover:text-foreground hover:bg-glass-hover',
          'transition-[background-color,color] duration-200 ease-out',
          className
        )}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        transition={springs.snappy}
        {...props}
      />
    );
  }
);
IconButton.displayName = 'IconButton';
