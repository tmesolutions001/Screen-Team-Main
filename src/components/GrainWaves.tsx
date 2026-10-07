import { forwardRef, useImperativeHandle, useRef, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/** Wave colours: accent (purple) for neutral/Edit/English, ok (green) for Save/Español. */
export type WaveColor = 'accent' | 'ok';

const COLOR: Record<WaveColor, string> = { accent: 'var(--accent-2)', ok: 'var(--ok)' };

interface Wave {
  id: number;
  color: WaveColor;
  x: number;
  y: number;
  radius: number;
}

export interface GrainWavesHandle {
  /** Fire a sparkle-grain wave from `from` (the button pressed) across this layer. Overlaps freely. */
  fire: (color: WaveColor, from: Element | null) => void;
}

/**
 * The sparkle-grain wave: a ring of colour that grows out of a button and
 * sweeps across this layer, masked by drifting grain noise (CSS `.grain-wave`).
 * Each fire mounts its own element (the last six are kept), so rapid presses
 * overlap instead of queueing, and each removes itself when it finishes.
 * Place it inside the area it should sweep; it fills its positioned parent and
 * clips to it. Pointer events pass through.
 */
export const GrainWaves = forwardRef<GrainWavesHandle, { className?: string }>(({ className }, ref) => {
  const layerRef = useRef<HTMLDivElement>(null);
  const [waves, setWaves] = useState<Wave[]>([]);
  const nextId = useRef(0);

  useImperativeHandle(ref, () => ({
    fire(color, from) {
      const box = layerRef.current?.getBoundingClientRect();
      if (!box) return;
      const origin = from?.getBoundingClientRect();
      // From the button's centre (it may sit outside the layer), or the top-right corner without one.
      const x = origin ? origin.left + origin.width / 2 - box.left : box.width;
      const y = origin ? origin.top + origin.height / 2 - box.top : 0;
      // Far enough to sweep past the farthest corner.
      const corners = [[0, 0], [box.width, 0], [0, box.height], [box.width, box.height]];
      const radius = Math.max(...corners.map(([cx, cy]) => Math.hypot(cx - x, cy - y))) + 60;
      const id = ++nextId.current;
      setWaves((w) => [...w.slice(-5), { id, color, x, y, radius }]);
    },
  }));

  return (
    <div ref={layerRef} aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {waves.map((w) => (
        <span
          key={w.id}
          className="grain-wave"
          onAnimationEnd={() => setWaves((all) => all.filter((x) => x.id !== w.id))}
          style={{ left: w.x, top: w.y, '--r': `${w.radius}px`, '--wave': COLOR[w.color] } as CSSProperties}
        />
      ))}
    </div>
  );
});
GrainWaves.displayName = 'GrainWaves';
