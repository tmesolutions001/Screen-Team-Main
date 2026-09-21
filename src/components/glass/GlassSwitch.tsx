import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/motion';

interface GlassSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  'aria-labelledby'?: string;
  'aria-label'?: string;
}

/** Frosted toggle. The thumb is a layout spring, so rapid toggling just retargets it. */
export const GlassSwitch = ({ checked, onCheckedChange, ...aria }: GlassSwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      'glass-flat focus-ring inline-flex h-7 w-12 shrink-0 items-center rounded-pill px-0.5',
      'transition-colors duration-200',
      checked ? 'justify-end bg-[color-mix(in_srgb,var(--accent-2)_55%,transparent)]' : 'justify-start'
    )}
    {...aria}
  >
    <motion.span layout transition={springs.snappy} className="h-6 w-6 rounded-full bg-white shadow-md" />
  </button>
);
