import { useEffect, useRef } from 'react';

/**
 * Pointer-tracking spotlight for `.spotlight` elements.
 *
 * Writes --spot-x / --spot-y straight onto the element (no React state, no
 * re-renders) at most once per animation frame. Visibility is handled in CSS
 * (`:hover` / `:focus-visible`), so keyboard focus gets the same glow,
 * centred, and the hook only needs to track position.
 *
 * Disabled for touch-only and reduced-motion users; the CSS falls back to a
 * static centred highlight on focus.
 */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia('(hover: none)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let frame = 0;
    let x = 0;
    let y = 0;

    const flush = () => {
      frame = 0;
      el.style.setProperty('--spot-x', `${x}px`);
      el.style.setProperty('--spot-y', `${y}px`);
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
      if (!frame) frame = requestAnimationFrame(flush);
    };

    // Drop the inline vars on leave so a later keyboard focus glows from centre.
    const onLeave = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      el.style.removeProperty('--spot-x');
      el.style.removeProperty('--spot-y');
    };

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    return () => {
      onLeave();
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return ref;
}
