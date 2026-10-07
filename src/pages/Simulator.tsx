import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Flame, Hash, ScrollText } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { SwapText } from '@/components/SwapText';
import { GlassTile, IconButton } from '@/components/glass';
import type { GameMode } from '@/game/engine';
import { useSimText } from '@/game/i18n';
import { staggerContainer, staggerItem } from '@/lib/motion';

const MODES: Array<{ mode: GameMode; path: string; icon: ReactNode; tone?: 'warm' }> = [
  { mode: 'classic', path: '/game', icon: <ScrollText className="h-6 w-6" /> },
  { mode: 'chapter-verse', path: '/game/chapter-verse', icon: <Hash className="h-6 w-6" /> },
  { mode: 'book', path: '/game/book', icon: <BookOpen className="h-6 w-6" /> },
  { mode: 'warmup', path: '/game/warmup', icon: <Flame className="h-6 w-6" />, tone: 'warm' },
];

/** Simulator menu: pick a drill mode, and the simulator language. */
const Simulator = () => {
  const navigate = useNavigate();
  const { t } = useSimText();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <IconButton onClick={() => navigate('/')} className="fixed top-4 left-4" aria-label={t.menu.back}>
        <ArrowLeft className="w-5 h-5" />
      </IconButton>
      <LanguageToggle className="fixed top-4 right-4" />

      <motion.div variants={staggerContainer} className="w-full max-w-2xl space-y-10">
        <motion.header variants={staggerItem} className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Screen Team App</p>
          <h1 className="text-6xl font-bold tracking-tight leading-tight">
            <SwapText itemClassName="text-gradient">{t.menu.title}</SwapText>
          </h1>
          <p className="text-lg text-muted-foreground">
            <SwapText block>{t.menu.subtitle}</SwapText>
          </p>
        </motion.header>

        <div className="grid gap-4 sm:grid-cols-2">
          {MODES.map(({ mode, path, icon, tone }) => (
            <GlassTile
              key={mode}
              variants={staggerItem}
              icon={icon}
              title={<SwapText>{t.modes[mode]}</SwapText>}
              description={<SwapText block>{t.menu.descriptions[mode]}</SwapText>}
              tone={tone}
              onClick={() => navigate(path)}
              aria-label={t.menu.start(t.modes[mode])}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Simulator;
