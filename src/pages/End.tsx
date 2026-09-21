import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon } from 'lucide-react';
import type { MissedPrompt } from '@/game/engine';

export interface EndState {
  score: number;
  totalPrompts: number;
  missedPrompts: MissedPrompt[];
  hasErrors: boolean;
}

const End = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as EndState | null;
  const [visibleMissed, setVisibleMissed] = useState(0);
  const [showScore, setShowScore] = useState(true);

  useEffect(() => {
    if (!state) navigate('/');
  }, [state, navigate]);

  // Show the score for 2 seconds first.
  useEffect(() => {
    const scoreTimer = setTimeout(() => setShowScore(false), 2000);
    return () => clearTimeout(scoreTimer);
  }, []);

  // Then reveal missed prompts one per second.
  const missedCount = state?.missedPrompts.length ?? 0;
  useEffect(() => {
    if (showScore || visibleMissed >= missedCount) return;
    const revealTimer = setTimeout(() => setVisibleMissed(n => n + 1), 1000);
    return () => clearTimeout(revealTimer);
  }, [showScore, visibleMissed, missedCount]);

  if (!state) return null;

  return (
    <div className="min-h-screen flex flex-col p-4 relative">
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-800 transition-colors"
        aria-label="Back to home"
      >
        <HomeIcon className="w-6 h-6" />
      </button>

      {showScore && (
        <div className="flex-1 flex items-center justify-center animate-fade-in">
          <h1 className="text-8xl font-bold gradient-text text-center animate-scale-in">
            {state.score}/{state.totalPrompts}
          </h1>
        </div>
      )}

      {!showScore && state.hasErrors && (
        <div className="mt-16 animate-fade-in">
          <h2 className="text-4xl font-bold gradient-text mb-8">What You Missed:</h2>
          <div className="space-y-8">
            {state.missedPrompts.slice(0, visibleMissed).map(item => (
              <div key={item.id} className="flex justify-between items-start space-x-4 chat-message">
                <div className="flex-1">
                  <p className="text-lg text-left text-red-400">Your input: {item.userInput}</p>
                </div>
                <div className="flex-1">
                  <p className="text-lg text-right text-green-400">Prompt: {item.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showScore && !state.hasErrors && (
        <div className="flex-1 flex items-center justify-center animate-fade-in">
          <h1 className="text-8xl font-bold gradient-text text-center">
            Perfect Score!
          </h1>
        </div>
      )}
    </div>
  );
};

export default End;
