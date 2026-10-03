import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Flame, Hash, ScrollText } from 'lucide-react';
import { Settings } from '@/components/Settings';
import { GlassTile, IconButton } from '@/components/glass';
import { MODE_LABEL, type GameMode } from '@/game/engine';
import { staggerContainer, staggerItem } from '@/lib/motion';

const MODES: Array<{ mode: GameMode; path: string; icon: ReactNode; description: string; tone?: 'warm' }> = [
  { mode: 'classic', path: '/game', icon: <ScrollText className="h-6 w-6" />, description: 'Book, chapter and verse.' },
  { mode: 'chapter-verse', path: '/game/chapter-verse', icon: <Hash className="h-6 w-6" />, description: 'Chapter and verse numbers only. Warm up on the numberpad.' },
  { mode: 'book', path: '/game/book', icon: <BookOpen className="h-6 w-6" />, description: 'Book names only.' },
  { mode: 'warmup', path: '/game/warmup', icon: <Flame className="h-6 w-6" />, description: 'Chapter–Verse, Book, then Classic, with a countdown before each.', tone: 'warm' },
];

/** Simulator menu: pick a drill mode. */
const Simulator = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <IconButton onClick={() => navigate('/')} className="fixed top-4 left-4" aria-label="Back to Screen Team App">
        <ArrowLeft className="w-5 h-5" />
      </IconButton>
      <Settings />

      <motion.div variants={staggerContainer} className="w-full max-w-2xl space-y-10">
        <motion.header variants={staggerItem} className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Screen Team App</p>
          <h1 className="text-6xl font-bold tracking-tight text-gradient leading-tight">Simulator</h1>
          <p className="text-lg text-muted-foreground">Sixty seconds. Listen, then type the reference.</p>
        </motion.header>

        <div className="grid gap-4 sm:grid-cols-2">
          {MODES.map(({ mode, path, icon, description, tone }) => (
            <GlassTile
              key={mode}
              variants={staggerItem}
              icon={icon}
              title={MODE_LABEL[mode]}
              description={description}
              tone={tone}
              onClick={() => navigate(path)}
              aria-label={`Start ${MODE_LABEL[mode]} mode`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Simulator;
