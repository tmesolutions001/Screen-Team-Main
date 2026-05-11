import React from 'react';

interface GameHeaderProps {
  score: number;
  total: number;
  timeLeft: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ score, total, timeLeft }) => {
  return (
    <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center text-xl font-medium">
      <div>SCORE {score}/{total}</div>
      <div>TIME LEFT {timeLeft}</div>
    </div>
  );
};