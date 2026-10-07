import { Fragment, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Check, Copy, Eraser, Sparkles } from 'lucide-react';
import { GlassButton, GlassPanel, IconButton } from '@/components/glass';
import { Toast } from '@/components/Toast';
import { MAX_LINE, formatSong } from '@/songs/formatSong';
import { blurText, rowReveal, springs, staggerContainer, staggerItem } from '@/lib/motion';

/** Placeholder text only: shows every rule (alignment dots, chord and N.C. lines, repeat markers, accents, empty groups, metadata, Spanish labels, multipliers, wrapping, chunking). */
const EXAMPLE = `Lorem.Ipsum.Dolor [G, 70 bpm, 4/4]
Written.by.Consectetur.Adipiscing
Key:.G........Tempo:.70

Verse.I:
N.C.
G. C/G
........Lorem.ipsum.dolor.sit.amet.consectetur
G/B. Dsus
Adipiscing.elit.sed.do.eiusmod
Em. C. G
Tempor.incidídunt.ut.labóre
Et.dolore.magna.aliqua

Pre-Coro
Ut enim ad minim veniam
Quis nostrud exercitation

Coro (x2)
C.......G/B.......Am7
Ullamco laboris nisi ut aliquip ex ea commodo
Duis aute irure dolor
In reprehenderit in voluptate
Velit esse cillum dolore (x2)

Puente ×4
Excepteur sint occaecat cupidatat
Non proident sunt in culpa señor

Tag
`;

const MotionPanel = motion.create(GlassPanel);

/**
 * Formatted output with group labels and the title picked out. Lines stay real
 * text joined by newlines, so selecting and copying by hand gives the exact output.
 */
const Output = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && '\n'}
          {line === '.' && i > 0 && lines[i - 1]?.toUpperCase() === '[BLANK]' ? (
            // The placeholder period the operator removes after importing.
            <span className="font-semibold text-[var(--accent-warm-2)]">{line}</span>
          ) : line.startsWith('[') ? (
            <span className="font-semibold text-[var(--accent-2)]">{line}</span>
          ) : /^title: /i.test(line) ? (
            <span className="font-semibold text-foreground">{line}</span>
          ) : (
            line
          )}
        </Fragment>
      ))}
    </>
  );
};

/** Clipboard API where allowed; falls back to a hidden textarea (embedded frames often block the API). */
const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    el.remove();
    return ok;
  }
};

const SongFormatter = () => {
  const navigate = useNavigate();
  const [raw, setRaw] = useState('');
  // Formatting is cheap, but deferring keeps typing in a large paste responsive.
  const deferredRaw = useDeferredValue(raw);
  const result = useMemo(() => formatSong(deferredRaw), [deferredRaw]);
  const [copied, setCopied] = useState(false);
  // Shown on every copy; a new id restarts it.
  const [toastId, setToastId] = useState<number | null>(null);
  const closeToast = useCallback(() => setToastId(null), []);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const slides = result.text ? result.text.split('\n\n').length - 1 : 0;
  const longest = result.text
    ? Math.max(0, ...result.text.split('\n').filter((l) => l && !l.startsWith('[') && !/^title: /i.test(l)).map((l) => l.length))
    : 0;

  const copy = async () => {
    if (!result.text || !(await copyText(result.text))) return;
    setCopied(true);
    setToastId(Date.now());
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 sm:p-6">
      <Toast id={toastId} message="Remember to remove the period (.) under [Blank]" duration={5000} onClose={closeToast} />
      <IconButton onClick={() => navigate('/')} className="fixed top-4 left-4 z-10" aria-label="Back to Screen Team App">
        <ArrowLeft className="w-5 h-5" />
      </IconButton>

      <motion.div variants={staggerContainer} className="w-full max-w-6xl space-y-8">
        <motion.header variants={staggerItem} className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Screen Team App</p>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gradient leading-tight">Song Formatter</h1>
          <p className="text-lg text-muted-foreground">Paste raw lyrics. Get slide-ready text.</p>
        </motion.header>

        <div className="grid gap-4 md:grid-cols-2">
          <MotionPanel variants={staggerItem} className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Raw text</h2>
              <div className="flex gap-2">
                <GlassButton size="sm" onClick={() => setRaw(EXAMPLE)}>
                  <Sparkles className="h-4 w-4" /> Example
                </GlassButton>
                <GlassButton size="sm" onClick={() => setRaw('')} disabled={!raw}>
                  <Eraser className="h-4 w-4" /> Clear
                </GlassButton>
              </div>
            </div>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={'Paste the song here, title on the first line.\n\nVerse 1\n…'}
              spellCheck={false}
              aria-label="Raw song text"
              className="glass-flat focus-ring h-[40vh] md:h-[56vh] w-full resize-none rounded-2xl bg-transparent p-4 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-foreground/30"
            />
          </MotionPanel>

          <MotionPanel variants={staggerItem} className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Formatted</h2>
              <GlassButton size="sm" variant="accent" onClick={copy} disabled={!result.text} aria-live="polite">
                <span className="relative grid place-items-center">
                  <AnimatePresence initial={false}>
                    <motion.span key={copied ? 'done' : 'copy'} {...blurText} className="col-start-1 row-start-1">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </motion.span>
                  </AnimatePresence>
                </span>
                {copied ? 'Copied' : 'Copy'}
              </GlassButton>
            </div>
            <pre
              aria-label="Formatted song"
              className="glass-flat h-[40vh] md:h-[56vh] overflow-auto rounded-2xl p-4 font-mono text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap"
            >
              {result.text ? <Output text={result.text} /> : <span className="text-foreground/30">The formatted song appears here.</span>}
            </pre>
            <p className="text-xs text-muted-foreground tabular-nums">
              {result.text ? (
                <>
                  {slides} slide{slides === 1 ? '' : 's'} · longest line {longest}/{MAX_LINE}
                </>
              ) : (
                <>&nbsp;</>
              )}
            </p>
          </MotionPanel>
        </div>

        {/* Keyed by message, so warnings that persist while typing stay put and only new ones animate. */}
        <ul aria-label="Formatting notes" className="mx-auto max-w-3xl">
          <AnimatePresence initial={false}>
            {[...new Set(result.warnings)].map((w) => (
              <motion.li
                key={w}
                {...rowReveal}
                exit={{ height: 0, opacity: 0, transition: { height: springs.smooth, opacity: { duration: 0.15 } } }}
                className="overflow-hidden"
              >
                <p className="flex gap-2.5 py-1.5 text-sm text-muted-foreground">
                  <span aria-hidden className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-warm-2)]" />
                  {w}
                </p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </motion.div>
    </div>
  );
};

export default SongFormatter;
