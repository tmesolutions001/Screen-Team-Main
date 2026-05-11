
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameHeader } from '@/components/GameHeader';
import { validateInput } from '@/utils/bookValidation';
import { Progress } from '@/components/ui/progress';
import { Timer } from 'lucide-react';

const Game = () => {
  const navigate = useNavigate();
  const { mode } = useParams<{ mode?: string }>();
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [prompt, setPrompt] = useState('');
  const [game, setGame] = useState<BibleGame | null>(null);
  const [missedPrompts, setMissedPrompts] = useState<Array<{prompt: string, userInput: string}>>([]);
  const [showScore, setShowScore] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef(0);
  useEffect(() => {
    const initializeGame = async () => {
      const newGame = new BibleGame(setPrompt, setScore, setMissedPrompts, mode);
      await newGame.loadXmlDocument('/BookInfo.xml');
      setGame(newGame);
      newGame.start();
    };

    initializeGame();
  }, [mode]);

  useEffect(() => {
    inputRef.current?.focus();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowScore(true);
          return 0;
        }
        const next = prev - 1;

        // Warm-up timed mode switching: 15s each segment
        if (mode === 'warmup' && game) {
          if (next === 45) {
            game.setMode('book');
          } else if (next === 30) {
            game.setMode('chapter-verse');
          } else if (next === 15) {
            game.setMode('classic');
          }
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, score, missedPrompts, game, mode]);

  useEffect(() => {
    if (showScore && timeLeft === 0) {
      const transitionTimer = setTimeout(() => {
        navigate('/end', { 
          state: { 
            score, 
            missedPrompts,
            totalPrompts: game?.getTotalPrompts() || 0,
            hasErrors: missedPrompts.length > 0
          } 
        });
      }, 3000); // Wait 3 seconds before transitioning to the end page
      return () => clearTimeout(transitionTimer);
    }
  }, [showScore, timeLeft, navigate, score, missedPrompts, game]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (game) {
      game.handleInput(input);
      setInput('');
    }
  };

  const progressValue = ((60 - timeLeft) / 60) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <GameHeader
        score={score}
        total={game?.getTotalPrompts() || 0}
        timeLeft={formatTime(timeLeft)}
      />
      
      <div className="fixed top-12 left-0 right-0 px-4">
        <div className="flex items-center gap-2 mb-1">
          <Timer size={16} />
          <span className="text-sm">Time Remaining: {formatTime(timeLeft)}</span>
        </div>
        <Progress 
          value={progressValue} 
          className="w-full h-2 bg-gray-700 overflow-hidden"
        />
      </div>
      
      {showScore ? (
        <div className="text-center space-y-8 max-w-xl w-full animate-fade-in">
          <h2 className="text-8xl font-bold gradient-text">
            {score}/{game?.getTotalPrompts() || 0}
          </h2>
        </div>
      ) : (
        <div className="text-center space-y-8 max-w-xl w-full">
          {/* Hidden visually but available for screen readers */}
          <h2 className="sr-only">{prompt}</h2>
          <form onSubmit={handleSubmit} className="w-full">
            <div
              className="relative w-full custom-caret"
              style={{ ['--caret-ch' as any]: `${input.length}ch` }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (!game) return;
                  const currentMode = game.getMode();
                  if (currentMode === 'book' && e.key === ' ') {
                    const prompt = game.getCurrentPrompt();
                    const isNumberedBook = /^([1-3])\s/.test(prompt);
                    const hasSpaceAlready = input.includes(' ');

                    if (isNumberedBook) {
                      // First space: allow typing to continue; Second space: submit
                      if (!hasSpaceAlready) {
                        return; // do not preventDefault -> insert first space
                      }
                      e.preventDefault();
                      game.handleInput(input);
                      setInput('');
                      return;
                    }

                    // Non-numbered books: submit on first space
                    e.preventDefault();
                    game.handleInput(input);
                    setInput('');
                  }
                  if (currentMode === 'warmup' && e.key === ' ') {
                    e.preventDefault();
                    game.handleInput(input);
                    setInput('');
                  }
                }}
                className="w-full px-6 py-3 text-6xl font-bold font-mono bg-transparent rounded-full gradient-border focus:outline-none gradient-text caret-transparent"
                aria-label="Type the answer for the prompt"
              />
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

class BibleGame {
  private doc: Document | null = null;
  private points = 0;
  private numPrompts = 0;
  private incorrectInputs: Array<{prompt: string, userInput: string}> = [];
  private startTime = 0;
  private bookUsageCounts = new Map<string, number>();
  private currentSpeech: SpeechSynthesisUtterance | null = null;
  private speechSynth: SpeechSynthesis;
  private lastBook: string | null = null;
  private setPrompt: (prompt: string) => void;
  private setScore: (score: number) => void;
  private setMissedPrompts: (prompts: Array<{prompt: string, userInput: string}>) => void;
  private currentPrompt: string = '';
  private mode: 'classic' | 'chapter-verse' | 'book' | 'warmup' = 'classic';

  constructor(
    setPrompt: (prompt: string) => void,
    setScore: (score: number) => void,
    setMissedPrompts: (prompts: Array<{prompt: string, userInput: string}>) => void,
    modeParam?: string
  ) {
    this.speechSynth = window.speechSynthesis;
    this.setPrompt = setPrompt;
    this.setScore = setScore;
    this.setMissedPrompts = setMissedPrompts;
    const allowed = ['classic', 'chapter-verse', 'book', 'warmup'] as const;
    this.mode = (allowed as readonly string[]).includes(modeParam || '') ? (modeParam as any) : 'classic';
  }

  async loadXmlDocument(filePath: string) {
    try {
      const response = await fetch(filePath);
      const xmlText = await response.text();
      const parser = new DOMParser();
      this.doc = parser.parseFromString(xmlText, 'text/xml');
    } catch (error) {
      console.error('Error loading XML:', error);
    }
  }

  formatBookName(bookId: string): string {
    const numberMatch = bookId.match(/^(\d+)\s+(.+)/);
    if (numberMatch) {
      const [, number, name] = numberMatch;
      const numberWords = ['', 'First', 'Second', 'Third'];
      return `${numberWords[parseInt(number)]} ${name}`;
    }
    return bookId;
  }

  speakPrompt(text: string) {
    if (this.currentSpeech) {
      this.speechSynth.cancel();
    }

    const speakText = text.replace(':', ' verse ');
    const formattedText = speakText.replace(/^(\d+)\s+/, (match, number) => {
      const n = parseInt(number, 10);
      if (n >= 1 && n <= 3) {
        const numberWords = ['', 'first', 'second', 'third'];
        return `${numberWords[n]} `;
      }
      return match; // keep numbers like 12 as-is
    });

    const utterance = new SpeechSynthesisUtterance(formattedText);
    utterance.rate = 1.5;
    this.currentSpeech = utterance;
    this.speechSynth.speak(utterance);
  }

  cancelSpeech() {
    if (this.currentSpeech) {
      this.speechSynth.cancel();
      this.currentSpeech = null;
    }
  }

  start() {
    this.points = 0;
    this.numPrompts = 0;
    this.incorrectInputs = [];
    this.startTime = Date.now();
    this.bookUsageCounts.clear();
    this.lastBook = null;
    this.generateNewPrompt();
  }

  generateNewPrompt() {
    if (this.mode === 'warmup') {
      const isWord = Math.random() < 0.5;
      const n = Math.floor(Math.random() * 3) + 1;
      const words = ['', 'First', 'Second', 'Third'];
      const prompt = isWord ? words[n] : String(n);
      this.currentPrompt = prompt;
      this.setPrompt(prompt);
      this.speakPrompt(prompt);
      return;
    }

    if (!this.doc) return;

    const books = Array.from(this.doc.getElementsByTagName('Book'));
    let availableBooks = books.filter(book => {
      const bookId = book.getAttribute('ID') || '';
      const usageCount = this.bookUsageCounts.get(bookId) || 0;
      return usageCount < 4 && bookId !== this.lastBook;
    });

    if (availableBooks.length === 0) {
      this.bookUsageCounts.clear();
      availableBooks = books;
    }

    const randomBook = availableBooks[Math.floor(Math.random() * availableBooks.length)];
    const bookId = randomBook.getAttribute('ID') || '';
    const chapters = randomBook.getElementsByTagName('Chapter');
    const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];
    const chapterNum = randomChapter.getAttribute('Number') || '';
    const verseCount = parseInt(randomChapter.getAttribute('VerseCount') || '1');
    const randomVerse = Math.floor(Math.random() * verseCount) + 1;

    this.lastBook = bookId;
    this.bookUsageCounts.set(bookId, (this.bookUsageCounts.get(bookId) || 0) + 1);

    const classicPrompt = `${bookId} ${chapterNum}:${randomVerse}`;
    const prompt =
      this.mode === 'classic' ? classicPrompt :
      this.mode === 'chapter-verse' ? `${chapterNum}:${randomVerse}` :
      /* book */ bookId;

    this.currentPrompt = prompt;
    this.setPrompt(prompt);
    this.speakPrompt(prompt);
  }

  validateInput(input: string, prompt: string): boolean {
    const normalizeInput = (text: string) => {
      return text.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/^(\d+)(?=\s)/, (match, number) => {
          const numberWords = ['', 'first', 'second', 'third'];
          return number;
        })
        .trim();
    };

    return normalizeInput(input) === normalizeInput(prompt);
  }

  handleInput(input: string) {
    this.cancelSpeech();

    const user = input.trim();
    let correct = false;

    if (this.mode === 'classic') {
      correct = validateInput(user, this.currentPrompt);
    } else if (this.mode === 'chapter-verse') {
      const normalized = user.replace(/\s+/, ':');
      correct = normalized === this.currentPrompt;
    } else if (this.mode === 'book') {
      const testInput = `${user} 1 1`;
      const testPrompt = `${this.currentPrompt} 1:1`;
      correct = validateInput(testInput, testPrompt);
    } else if (this.mode === 'warmup') {
      correct = user.toLowerCase() === this.currentPrompt.toLowerCase();
    }

    if (correct) {
      this.points++;
      this.setScore(this.points);
    } else {
      this.incorrectInputs.push({
        prompt: this.currentPrompt,
        userInput: input
      });
      this.setMissedPrompts(this.incorrectInputs);
    }

    this.numPrompts++;
    this.generateNewPrompt();
  }

  getTotalPrompts(): number {
    return this.numPrompts;
  }

  getMode(): 'classic' | 'chapter-verse' | 'book' | 'warmup' {
    return this.mode;
  }

  getCurrentPrompt(): string {
    return this.currentPrompt;
  }

  setMode(newMode: 'classic' | 'chapter-verse' | 'book' | 'warmup') {
    if (this.mode !== newMode) {
      this.mode = newMode;
      this.generateNewPrompt();
    }
  }
}

export default Game;
