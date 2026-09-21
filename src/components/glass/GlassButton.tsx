import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useSpotlight } from '@/hooks/useSpotlight';

const glassButton = cva(
  [
    'glass spotlight focus-ring',
    'inline-flex items-center justify-center gap-2 rounded-pill select-none',
    'font-semibold tracking-tight text-foreground',
    'transition-[background-color,transform,box-shadow] duration-200 ease-out',
    'hover:bg-glass-hover active:scale-[0.98]',
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
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButton> {}

/**
 * Frosted pill button with a pointer-tracking spotlight.
 * Children are wrapped in a <span> so gradient variants can clip text to it.
 */
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, type = 'button', children, ...props }, forwardedRef) => {
    const spotRef = useSpotlight<HTMLButtonElement>();
    return (
      <button
        ref={(node) => {
          spotRef.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        type={type}
        className={cn(glassButton({ variant, size }), className)}
        {...props}
      >
        <span className="relative inline-flex items-center gap-2">{children}</span>
      </button>
    );
  }
);
GlassButton.displayName = 'GlassButton';
