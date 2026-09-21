import { validateInput } from '@/utils/bookValidation';

export const GAME_MODES = ['classic', 'chapter-verse', 'book', 'warmup'] as const;
export type GameMode = (typeof GAME_MODES)[number];

export interface MissedPrompt {
  id: number;
  prompt: string;
  userInput: string;
}

export interface GameCallbacks {
  onPrompt: (prompt: string) => void;
  onScore: (score: number) => void;
  onMissed: (missed: MissedPrompt[]) => void;
}

export const parseMode = (value?: string): GameMode =>
  (GAME_MODES as readonly string[]).includes(value ?? '') ? (value as GameMode) : 'classic';

/** What the space bar should do in the current mode. */
export type SpaceAction = 'type' | 'submit';

export class BibleGame {
  private doc: Document | null = null;
  private points = 0;
  private numPrompts = 0;
  private incorrectInputs: MissedPrompt[] = [];
  private bookUsageCounts = new Map<string, number>();
  private currentSpeech: SpeechSynthesisUtterance | null = null;
  private speechSynth: SpeechSynthesis;
  private lastBook: string | null = null;
  private currentPrompt = '';
  private mode: GameMode;

  constructor(private callbacks: GameCallbacks, mode: GameMode) {
    this.speechSynth = window.speechSynthesis;
    this.mode = mode;
  }

  async loadXmlDocument(filePath: string) {
    try {
      const response = await fetch(filePath);
      const xmlText = await response.text();
      this.doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    } catch (error) {
      console.error('Error loading XML:', error);
    }
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
    this.bookUsageCounts.clear();
    this.lastBook = null;
    this.generateNewPrompt();
  }

  generateNewPrompt() {
    if (this.mode === 'warmup') {
      const isWord = Math.random() < 0.5;
      const n = Math.floor(Math.random() * 3) + 1;
      const words = ['', 'First', 'Second', 'Third'];
      this.setPrompt(isWord ? words[n] : String(n));
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

    this.setPrompt(
      this.mode === 'classic' ? `${bookId} ${chapterNum}:${randomVerse}` :
      this.mode === 'chapter-verse' ? `${chapterNum}:${randomVerse}` :
      /* book */ bookId
    );
  }

  private setPrompt(prompt: string) {
    this.currentPrompt = prompt;
    this.callbacks.onPrompt(prompt);
    this.speakPrompt(prompt);
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
      this.callbacks.onScore(this.points);
    } else {
      this.incorrectInputs = [
        ...this.incorrectInputs,
        { id: this.numPrompts, prompt: this.currentPrompt, userInput: input },
      ];
      this.callbacks.onMissed(this.incorrectInputs);
    }

    this.numPrompts++;
    this.generateNewPrompt();
  }

  /**
   * Book mode submits on space (numbered books like "1 John" allow one space first);
   * warm-up always submits on space. Other modes type the space normally.
   */
  spaceAction(input: string): SpaceAction {
    if (this.mode === 'book') {
      const isNumberedBook = /^([1-3])\s/.test(this.currentPrompt);
      return isNumberedBook && !input.includes(' ') ? 'type' : 'submit';
    }
    return this.mode === 'warmup' ? 'submit' : 'type';
  }

  getTotalPrompts(): number {
    return this.numPrompts;
  }

  getMode(): GameMode {
    return this.mode;
  }

  getCurrentPrompt(): string {
    return this.currentPrompt;
  }

  setMode(newMode: GameMode) {
    if (this.mode !== newMode) {
      this.mode = newMode;
      this.generateNewPrompt();
    }
  }
}
