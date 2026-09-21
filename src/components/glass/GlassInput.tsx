import { forwardRef, type CSSProperties, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { useSpotlight } from '@/hooks/useSpotlight';

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Class and style for the frosted wrapper (the <input> itself is transparent). */
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
}

/**
 * Frosted pill text field. The glass, spotlight and focus ring live on a
 * wrapper because inputs can't render pseudo-elements.
 */
export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, wrapperClassName, wrapperStyle, ...props }, ref) => {
    const spotRef = useSpotlight<HTMLDivElement>();
    return (
      <div
        ref={spotRef}
        style={wrapperStyle}
        className={cn(
          'glass spotlight spotlight-accent rounded-pill',
          'transition-[box-shadow,border-color] duration-200 ease-out',
          'focus-within:border-glass-border-strong focus-within:shadow-glow-accent',
          wrapperClassName
        )}
      >
        <input
          ref={ref}
          className={cn(
            'w-full bg-transparent outline-none placeholder:text-foreground/30',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
GlassInput.displayName = 'GlassInput';
