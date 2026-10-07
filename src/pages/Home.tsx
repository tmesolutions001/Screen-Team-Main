import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FileMusic, Keyboard } from 'lucide-react';
import { GlassTile } from '@/components/glass';
import { staggerContainer, staggerItem } from '@/lib/motion';

/** App home: entry point to each Screen Team tool. */
const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div variants={staggerContainer} className="w-full max-w-2xl space-y-10">
        <motion.header variants={staggerItem} className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">V2.0</p>
          <h1 className="text-6xl font-bold tracking-tight text-gradient leading-tight">Screen Team App</h1>
          <p className="text-lg text-muted-foreground">Tools for the booth.</p>
        </motion.header>

        <div className="grid gap-4 sm:grid-cols-2">
          <GlassTile
            variants={staggerItem}
            icon={<FileMusic className="h-6 w-6" />}
            title="Song Formatter"
            description="Clean up and reformat song lyrics for slides."
            onClick={() => navigate('/songs')}
          />
          <GlassTile
            variants={staggerItem}
            icon={<Keyboard className="h-6 w-6" />}
            title="Simulator"
            description="Rapid-fire scripture reference drills."
            onClick={() => navigate('/simulator')}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
