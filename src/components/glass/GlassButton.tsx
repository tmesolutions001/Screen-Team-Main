import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/motion';
import { useSpotlight } from '@/hooks/useSpotlight';

const glassButton = cva(
  [
    'glass spotlight focus-ring',
    'inline-flex items-center justify-center gap-2 rounded-pill select-none',
    'font-semibold tracking-tight text-foreground',
    // transform is owned by the press/hover springs, so it is not CSS-transitioned
    'transition-[background-color,box-shadow] duration-200 ease-out',
    'hover:bg-glass-hover',
    'disabled:pointer-events-none disabled:opacity-40',
  ],
  {
    variants: {
      variant: {
        glass: '',
        // Gradient labels make currentColor transparent, so icons get an explicit colour.
        accent: 'spotlight-accent hover:shadow-glow-accent [&>span]:text-gradient [&_svg]:text-[var(--accent-1)]',
        warm: 'spotlight-warm hover:shadow-[0_0_40px_-8px_var(--accent-warm-2)] [&>span]:text-gradient-warm [&_svg]:text-[var(--accent-warm-1)]',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
      },
    },
    defaultVariants: { variant: 'glass', size: 'md' },
  }
);

export interface GlassButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    VariantProps<typeof glassButton> {
  children?: ReactNode;
}

/**
 * Frosted pill button with a pointer-tracking spotlight and spring press.
 * Children are wrapped in a <span> so gradient variants can clip text to it.
 */
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, type = 'button', children, ...props }, forwardedRef) => {
    const spotRef = useSpotlight<HTMLButtonElement>();
    return (
      <motion.button
        ref={(node) => {
          spotRef.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        type={type}
        className={cn(glassButton({ variant, size }), className)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={springs.snappy}
        {...props}
      >
        <span className="relative inline-flex items-center gap-2">{children}</span>
      </motion.button>
    );
  }
);
GlassButton.displayName = 'GlassButton';
