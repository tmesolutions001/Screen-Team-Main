import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from '@/components/Settings';
import { GlassButton } from '@/components/glass';

const Home = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  // Keep the state but it's no longer toggleable from UI
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <Settings
        language={language}
        voiceEnabled={voiceEnabled}
        onLanguageChange={setLanguage}
        onVoiceToggle={setVoiceEnabled}
      />
      <div className="text-center space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">V1.0</p>
          <h1 className="text-5xl font-bold tracking-tight text-gradient">
            Welcome to the<br />Screen Team Simulator
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
          <GlassButton variant="accent" size="lg" onClick={() => navigate('/game')} aria-label="Start Classic mode">
            Classic
          </GlassButton>
          <GlassButton variant="accent" size="lg" onClick={() => navigate('/game/chapter-verse')} aria-label="Start Chapter-Verse mode">
            Chapter–Verse
          </GlassButton>
          <GlassButton variant="accent" size="lg" onClick={() => navigate('/game/book')} aria-label="Start Book mode">
            Book
          </GlassButton>
          <GlassButton variant="warm" size="lg" onClick={() => navigate('/game/warmup')} aria-label="Start Warm Up mode">
            Warm Up
          </GlassButton>
        </div>
      </div>
    </div>
  );
};

export default Home;
