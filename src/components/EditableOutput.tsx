import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react';
import { cn } from '@/lib/utils';

/** One character of the display layer. New ones (typed or pasted while editing) blur in. */
interface Glyph {
  id: number;
  ch: string;
  /** performance.now() when typed; 0 for text that arrived without typing. */
  born: number;
}

/** A glyph counts as new only briefly, so a line re-mounting later never replays its blur. */
const FRESH_MS = 300;

export type WaveKind = 'edit' | 'save';

interface Wave {
  id: number;
  kind: WaveKind;
  x: number;
  y: number;
  radius: number;
}

export interface EditableOutputHandle {
  textarea: HTMLTextAreaElement | null;
  /** Focus for editing without jumping: the view stays where the operator was reading. */
  focus: () => void;
  /** Fire a sparkle-grain wave from `from` (the toggle button) across the box. Overlaps freely. */
  wave: (kind: WaveKind, from: Element | null) => void;
}

export interface EditableOutputProps {
  value: string;
  onChange: (value: string) => void;
  editing: boolean;
  placeholder: string;
  label: string;
  className?: string;
}

/** Colour for a whole line: title, group tags, and the placeholder period under [BLANK]. */
const lineTone = (line: string, prev: string | undefined) =>
  line === '.' && prev?.toUpperCase() === '[BLANK]'
    ? 'font-semibold text-[var(--accent-warm-2)]'
    : line.startsWith('[')
      ? 'font-semibold text-[var(--accent-2)]'
      : /^title: /i.test(line)
        ? 'font-semibold text-foreground'
        : 'text-foreground/90';

const Line = memo(({ glyphs, tone, now }: { glyphs: Glyph[]; tone: string; now: number }) => (
  <div className={cn('min-h-[1lh]', tone)}>
    {glyphs.map((g) =>
      g.ch === ' ' ? (
        ' '
      ) : (
        <span key={g.id} className={now - g.born < FRESH_MS ? 'edit-char edit-char--new' : 'edit-char'}>
          {g.ch}
        </span>
      )
    )}
  </div>
));
Line.displayName = 'Line';

let nextGlyphId = 1;
const toGlyphs = (text: string, born: number): Glyph[] => Array.from(text, (ch) => ({ id: nextGlyphId++, ch, born }));

/**
 * Re-use glyphs for the unchanged start and end of the text, so only what was
 * inserted gets new (animating) glyphs: typing mid-text never re-animates the rest.
 */
function diffGlyphs(prev: Glyph[], next: string, animate: boolean): Glyph[] {
  const chars = Array.from(next);
  let start = 0;
  while (start < prev.length && start < chars.length && prev[start].ch === chars[start]) start++;
  let end = 0;
  while (
    end < prev.length - start &&
    end < chars.length - start &&
    prev[prev.length - 1 - end].ch === chars[chars.length - 1 - end]
  )
    end++;
  const inserted = chars.slice(start, chars.length - end).join('');
  return [...prev.slice(0, start), ...toGlyphs(inserted, animate ? performance.now() : 0), ...prev.slice(prev.length - end)];
}

/**
 * The formatted song as a real <textarea> (so selection, caret, undo and the
 * copied value are native) with transparent text, under a display layer that
 * draws the same text with line colours and blurs newly typed characters in,
 * like the simulator's answer field. Both use identical metrics, no wrapping,
 * and the layer mirrors the textarea's scroll.
 */
export const EditableOutput = forwardRef<EditableOutputHandle, EditableOutputProps>(
  ({ value, onChange, editing, placeholder, label, className }, ref) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const layerRef = useRef<HTMLDivElement>(null);
    const glyphsRef = useRef<Glyph[]>(toGlyphs(value, 0));
    const [waves, setWaves] = useState<Wave[]>([]);
    const waveId = useRef(0);

    // Only edits typed while editing animate; regenerated output swaps in quietly.
    glyphsRef.current = diffGlyphs(glyphsRef.current, value, editing);
    const glyphs = glyphsRef.current;
    const now = performance.now();

    // Group glyphs into lines once per render; unchanged lines keep their array identity via memo keys.
    const lines: Glyph[][] = [[]];
    for (const g of glyphs) {
      if (g.ch === '\n') lines.push([]);
      else lines[lines.length - 1].push(g);
    }
    const lineTexts = lines.map((l) => l.map((g) => g.ch).join(''));

    const syncScroll = useCallback(() => {
      const t = textareaRef.current;
      if (t && layerRef.current) layerRef.current.style.transform = `translate(${-t.scrollLeft}px, ${-t.scrollTop}px)`;
    }, []);
    useLayoutEffect(syncScroll, [value, syncScroll]);

    useImperativeHandle(ref, () => ({
      get textarea() {
        return textareaRef.current;
      },
      focus() {
        const t = textareaRef.current;
        if (!t) return;
        const { scrollTop, scrollLeft } = t;
        t.focus({ preventScroll: true });
        // Focusing scrolls a textarea to its caret (the end); put the view back.
        t.scrollTop = scrollTop;
        t.scrollLeft = scrollLeft;
        syncScroll();
      },
      wave(kind, from) {
        const box = boxRef.current?.getBoundingClientRect();
        if (!box) return;
        const origin = from?.getBoundingClientRect();
        // From the button's centre (above the box), or the top-right corner without one.
        const x = origin ? origin.left + origin.width / 2 - box.left : box.width;
        const y = origin ? origin.top + origin.height / 2 - box.top : 0;
        // Far enough to sweep past the farthest corner.
        const radius = Math.max(...[[0, 0], [box.width, 0], [0, box.height], [box.width, box.height]].map(([cx, cy]) => Math.hypot(cx - x, cy - y))) + 60;
        const id = ++waveId.current;
        // Keep the last few: spam-clicking layers waves instead of queueing them.
        setWaves((w) => [...w.slice(-5), { id, kind, x, y, radius }]);
      },
    }));

    const endWave = (id: number) => setWaves((w) => w.filter((x) => x.id !== id));

    return (
      <div
        ref={boxRef}
        className={cn(
          'glass-flat relative overflow-hidden rounded-2xl transition-[box-shadow] duration-300',
          editing && 'shadow-[0_0_0_1px_var(--accent-2),0_0_32px_-10px_var(--accent-2)]',
          className
        )}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden p-4 font-mono text-sm leading-relaxed whitespace-pre">
          <div ref={layerRef} className="will-change-transform">
            {value ? (
              lines.map((l, i) => <Line key={i} glyphs={l} tone={lineTone(lineTexts[i], lineTexts[i - 1])} now={now} />)
            ) : (
              <span className="text-foreground/30">{placeholder}</span>
            )}
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          onScroll={syncScroll}
          readOnly={!editing}
          wrap="off"
          spellCheck={false}
          aria-label={label}
          className={cn(
            'absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent p-4 font-mono text-sm leading-relaxed whitespace-pre outline-none',
            'text-transparent selection:bg-white/20',
            editing ? 'caret-[var(--accent-2)]' : 'caret-transparent'
          )}
        />
        {waves.map((w) => (
          <span
            key={w.id}
            aria-hidden
            className="grain-wave"
            onAnimationEnd={() => endWave(w.id)}
            style={
              {
                left: w.x,
                top: w.y,
                '--r': `${w.radius}px`,
                '--wave': w.kind === 'save' ? 'var(--ok)' : 'var(--accent-2)',
              } as CSSProperties
            }
          />
        ))}
      </div>
    );
  }
);
EditableOutput.displayName = 'EditableOutput';
