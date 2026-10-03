import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, type Variants } from 'motion/react';
import type { Diagnosis } from '@/game/diagnose';
import { springs } from '@/lib/motion';

/** Renders `code` and **bold** spans from a diagnosis message. */
const RichText = ({ text }: { text: string }) => (
  <>
    {text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith('`') ? (
        <code key={i} className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.92em] text-foreground">
          {part.slice(1, -1)}
        </code>
      ) : part.startsWith('**') ? (
        <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      )
    )}
  </>
);

const GAP = 8;
const EDGE = 16;
const WIDTH = 352; // 22rem

type Side = 'below' | 'above';

interface Placement {
  top: number;
  left: number;
  side: Side;
  /** Transform origin: the point nearest the pill, so the popover grows out of it. */
  origin: string;
}

/*
 * Open/close is a single animated state, not mount/unmount: toggling mid-flight
 * retargets the same springs from wherever they are, so it always reverses
 * smoothly. The popover stays mounted after first open and is hidden from
 * pointer and assistive tech while closed.
 */
const popoverVariants: Variants = {
  closed: (side: Side) => ({
    opacity: 0,
    scale: 0.94,
    y: side === 'below' ? -6 : 6,
  }),
  open: { opacity: 1, scale: 1, y: 0 },
};

export interface IssueButtonProps {
  diagnosis: Diagnosis;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Results-table pill naming the main issue; opens a popover explaining every issue. */
export const IssueButton = ({ diagnosis, open, onOpenChange }: IssueButtonProps) => {
  const { issues, fastest } = diagnosis;
  const id = useId();
  const pillRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [place, setPlace] = useState<Placement | null>(null);

  // Just below its row, to the left of the issue column: it covers neither the
  // answer it explains nor the other pills. Narrow screens: under the pill,
  // flipping above when there's no room.
  const measure = useCallback(() => {
    const pill = pillRef.current?.getBoundingClientRect();
    const column = pillRef.current?.parentElement?.getBoundingClientRect();
    if (!pill || !column) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(WIDTH, vw - EDGE * 2);
    const height = popRef.current?.offsetHeight ?? 0;

    if (column.left - GAP - width >= EDGE) {
      const left = column.left - GAP - width;
      const below = pill.bottom + GAP;
      const fitsBelow = below + height <= vh - EDGE;
      const top = fitsBelow ? below : Math.max(EDGE, pill.top - GAP - height);
      setPlace({ top, left, side: fitsBelow ? 'below' : 'above', origin: fitsBelow ? '100% 0%' : '100% 100%' });
      return;
    }
    const left = Math.max(EDGE, Math.min(pill.left, vw - width - EDGE));
    const above = pill.bottom + GAP + height > vh - EDGE && pill.top - GAP - height > EDGE;
    const originX = `${pill.left + pill.width / 2 - left}px`;
    setPlace(above
      ? { top: pill.top - GAP - height, left, side: 'above', origin: `${originX} 100%` }
      : { top: pill.bottom + GAP, left, side: 'below', origin: `${originX} 0%` });
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setHidden(false);
    }
  }, [open]);

  // Measure after the popover has rendered (its height decides flipping), then follow scroll/resize.
  useLayoutEffect(() => {
    if (!open || !mounted) return;
    measure();
    let frame = 0;
    const onMove = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open, mounted, measure]);

  // Dismiss on outside press or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !pillRef.current?.contains(t)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
        pillRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  const [main, ...rest] = issues;

  return (
    <>
      <motion.button
        ref={pillRef}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => onOpenChange(!open)}
        className={
          'glass-flat focus-ring inline-flex h-8 max-w-full items-center gap-2 rounded-pill px-3 ' +
          'font-sans text-xs font-medium text-foreground transition-colors duration-200 hover:bg-glass-hover ' +
          (open ? 'bg-glass-hover' : '')
        }
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        transition={springs.snappy}
      >
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-miss" />
        <span className="truncate">{main.label}</span>
        {rest.length > 0 && (
          <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-px tabular-nums text-muted-foreground">
            +{rest.length}
          </span>
        )}
      </motion.button>

      {mounted &&
        createPortal(
          <motion.div
            ref={popRef}
            id={id}
            role="dialog"
            aria-label="Why this was marked wrong"
            aria-hidden={!open}
            custom={place?.side ?? 'below'}
            variants={popoverVariants}
            initial="closed"
            animate={open && place ? 'open' : 'closed'}
            transition={springs.snappy}
            onAnimationComplete={(def) => def === 'closed' && !open && setHidden(true)}
            className="glass glass-strong fixed z-50 rounded-2xl p-4 text-left"
            style={{
              top: place?.top ?? 0,
              left: place?.left ?? 0,
              width: `min(${WIDTH}px, calc(100vw - ${EDGE * 2}px))`,
              transformOrigin: place?.origin ?? '100% 0%',
              // Darker than plain strong glass: it sits over table text and must stay legible.
              background: 'rgba(22, 22, 28, 0.82)',
              visibility: hidden ? 'hidden' : 'visible',
              pointerEvents: open ? 'auto' : 'none',
            }}
          >
            <ul className="space-y-3">
              {issues.map((issue, i) => (
                <li key={i} className="flex gap-2.5">
                  <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-miss" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{issue.label}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      <RichText text={issue.detail} />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-glass-border pt-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Fastest</span>
              <span className="font-mono text-base font-semibold text-gradient">{fastest}</span>
            </div>
          </motion.div>,
          document.body
        )}
    </>
  );
};
