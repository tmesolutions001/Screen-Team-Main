import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { useSpotlight } from '@/hooks/useSpotlight';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only buttons need an accessible name. */
  'aria-label': string;
}

/** Round frosted button for a single icon. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, type = 'button', ...props }, forwardedRef) => {
    const spotRef = useSpotlight<HTMLButtonElement>();
    return (
      <button
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
          'transition-[background-color,color,transform] duration-200 ease-out active:scale-95',
          className
        )}
        {...props}
      />
    );
  }
);
IconButton.displayName = 'IconButton';
