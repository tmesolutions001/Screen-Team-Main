import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/motion';
import { useSpotlight } from '@/hooks/useSpotlight';

export interface GlassTileProps extends Omit<HTMLMotionProps<'button'>, 'children' | 'title'> {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  /** Small tag beside the title, e.g. "Coming soon". */
  badge?: string;
  tone?: 'accent' | 'warm';
  /** Not wired up yet: reads as unavailable and does not lift or press. */
  inactive?: boolean;
}

/** Large frosted menu tile: icon, title and a one-line description. */
export const GlassTile = forwardRef<HTMLButtonElement, GlassTileProps>(
  ({ icon, title, description, badge, tone = 'accent', inactive, className, ...props }, forwardedRef) => {
    const spotRef = useSpotlight<HTMLButtonElement>();
    return (
      <motion.button
        ref={(node) => {
          spotRef.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        type="button"
        aria-disabled={inactive || undefined}
        className={cn(
          'glass spotlight focus-ring rounded-glass p-6 text-left',
          'flex flex-col gap-4 transition-[background-color,box-shadow] duration-200 ease-out',
          tone === 'warm' ? 'spotlight-warm' : 'spotlight-accent',
          inactive
            ? 'cursor-default'
            : tone === 'warm'
              ? 'hover:bg-glass-hover hover:shadow-[0_0_40px_-8px_var(--accent-warm-2)]'
              : 'hover:bg-glass-hover hover:shadow-glow-accent',
          className
        )}
        whileHover={inactive ? undefined : { y: -4 }}
        whileTap={inactive ? undefined : { scale: 0.98 }}
        transition={springs.snappy}
        {...props}
      >
        <span
          className={cn(
            'glass-flat inline-flex h-12 w-12 items-center justify-center rounded-xl',
            tone === 'warm' ? 'text-[var(--accent-warm-2)]' : 'text-[var(--accent-2)]',
            inactive && 'opacity-60'
          )}
        >
          {icon}
        </span>
        <span className="space-y-1">
          <span className="flex items-center gap-2">
            <span className={cn('text-xl font-semibold tracking-tight', inactive && 'text-foreground/70')}>
              {title}
            </span>
            {badge && (
              <span className="glass-flat rounded-pill px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                {badge}
              </span>
            )}
          </span>
          <span className="block text-sm text-muted-foreground">{description}</span>
        </span>
      </motion.button>
    );
  }
);
GlassTile.displayName = 'GlassTile';
