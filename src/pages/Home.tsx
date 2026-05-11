import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from '@/components/Settings';

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
          <p className="text-sm text-gray-400">V1.0</p>
          <h1 className="text-5xl font-bold gradient-text">
            Welcome to the<br />Screen Team Simulator
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
          <button
            onClick={() => navigate('/game')}
            className="gradient-button text-white text-lg font-semibold"
            aria-label="Start Classic mode"
          >
            Classic
          </button>
          <button
            onClick={() => navigate('/game/chapter-verse')}
            className="gradient-button text-white text-lg font-semibold"
            aria-label="Start Chapter-Verse mode"
          >
            Chapter–Verse
          </button>
          <button
            onClick={() => navigate('/game/book')}
            className="gradient-button text-white text-lg font-semibold"
            aria-label="Start Book mode"
          >
            Book
          </button>
          <button
            onClick={() => navigate('/game/warmup')}
            className="gradient-button-warm text-white text-lg font-semibold"
            aria-label="Start Warm Up mode"
          >
            Warm Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
