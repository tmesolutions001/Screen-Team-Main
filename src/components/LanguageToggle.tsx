import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Languages } from 'lucide-react';
import { GlassButton } from '@/components/glass';
import { GrainWaves, type GrainWavesHandle } from '@/components/GrainWaves';
import { SwapText } from '@/components/SwapText';
import { SIM_TEXT, useSimText } from '@/game/i18n';
import { getSettings, updateSettings } from '@/lib/settings';
import { cn } from '@/lib/utils';

/**
 * Simulator language pill: shows the current language (English / Español) and
 * switches it. Each press sends the sparkle-grain wave across the page from the
 * pill, purple for English and green for Español.
 *
 * Spam-safe: the next language is computed from the store's current value at
 * the moment of the click (not from a render that may be a frame behind), so
 * the label, the setting and the wave colour always agree; waves layer.
 */
export const LanguageToggle = ({ className }: { className?: string }) => {
  const { lang, t } = useSimText();
  const wavesRef = useRef<GrainWavesHandle>(null);

  const toggle = (button: HTMLElement) => {
    const next = getSettings().simLang === 'en' ? 'es' : 'en';
    updateSettings({ simLang: next });
    wavesRef.current?.fire(next === 'es' ? 'ok' : 'accent', button);
  };

  return (
    <>
      <GlassButton
        size="md"
        onClick={(e) => toggle(e.currentTarget)}
        aria-label={t.languageToggle}
        className={cn('h-11 px-4 text-sm', lang === 'es' ? 'hover:shadow-[0_0_28px_-8px_var(--ok)]' : undefined, className)}
      >
        <Languages className={cn('h-4 w-4 transition-colors duration-300', lang === 'es' ? 'text-[var(--ok)]' : 'text-[var(--accent-2)]')} />
        {/* Width of the longer name, so the pill never changes size mid-swap. */}
        <span className="relative inline-grid">
          <span className="invisible col-start-1 row-start-1">{SIM_TEXT.es.langName}</span>
          <span className="invisible col-start-1 row-start-1">{SIM_TEXT.en.langName}</span>
          <SwapText className="col-start-1 row-start-1 justify-items-center">{t.langName}</SwapText>
        </span>
      </GlassButton>
      {/* The wave sweeps the whole page; portalled so page transitions never offset it. */}
      {createPortal(<GrainWaves ref={wavesRef} className="fixed z-40" />, document.body)}
    </>
  );
};
