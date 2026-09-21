import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Heavier blur and fill; use for overlays that sit on top of other glass. */
  strong?: boolean;
  /**
   * Skip backdrop-filter and use a translucent fill only. Use for glass nested
   * inside other glass, where a second blur pass costs frames for no visible gain.
   */
  flat?: boolean;
}

/** Frosted surface. One backdrop-filter per panel; nest with `flat`. */
export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, strong, flat, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-glass',
        flat ? 'glass-flat' : 'glass',
        strong && !flat && 'glass-strong',
        className
      )}
      {...props}
    />
  )
);
GlassPanel.displayName = 'GlassPanel';
