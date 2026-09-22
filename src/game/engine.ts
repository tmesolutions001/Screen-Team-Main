import { validateInput } from '@/utils/bookValidation';
import { speak, stop } from '@/lib/speech';

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
  /** Fired once per submitted answer, for UI feedback. */
  onResult: (correct: boolean) => void;
}

export const MODE_LABEL: Record<GameMode, string> = {
  classic: 'Classic',
  'chapter-verse': 'Chapter–Verse',
  book: 'Book',
  warmup: 'Warm Up',
};

export const parseMode = (value?: string): GameMode =>
  (GAME_MODES as readonly string[]).includes(value ?? '') ? (value as GameMode) : 'classic';

/** What the space bar should do in the current mode. */
export type SpaceAction = 'type' | 'submit';

const ORDINAL_WORDS = ['', 'First', 'Second', 'Third'];

/** Warm-up answers: "second" and "2" are the same answer, as they are when typing "2 Kings". */
const normalizeOrdinal = (text: string) => {
  const t = text.trim().toLowerCase();
  const i = ORDINAL_WORDS.findIndex((w) => w.toLowerCase() === t);
  return i > 0 ? String(i) : t;
};

// One parsed copy of the book data shared by every round, so hopping between
// modes never waits on a fetch or races an unmount.
let bookDocPromise: Promise<Document | null> | null = null;
const loadBookDoc = (filePath: string) => {
  bookDocPromise ??= fetch(filePath)
    .then((r) => r.text())
    .then((xml) => new DOMParser().parseFromString(xml, 'text/xml'))
    .catch((error) => {
      console.error('Error loading XML:', error);
      bookDocPromise = null; // let the next round retry
      return null;
    });
  return bookDocPromise;
};

export class BibleGame {
  private doc: Document | null = null;
  private points = 0;
  private numPrompts = 0;
  private incorrectInputs: MissedPrompt[] = [];
  private bookUsageCounts = new Map<string, number>();
  private lastBook: string | null = null;
  private currentPrompt = '';
  private mode: GameMode;

  constructor(private callbacks: GameCallbacks, mode: GameMode) {
    this.mode = mode;
  }

  async loadXmlDocument(filePath: string) {
    this.doc = await loadBookDoc(filePath);
  }

  speakPrompt(text: string) {
    const speakText = text.replace(':', ' verse ');
    const formattedText = speakText.replace(/^(\d+)\s+/, (match, number) => {
      const n = parseInt(number, 10);
      if (n >= 1 && n <= 3) {
        return `${ORDINAL_WORDS[n].toLowerCase()} `;
      }
      return match; // keep numbers like 12 as-is
    });
    speak(this, formattedText);
  }

  cancelSpeech() {
    stop(this);
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
      this.setPrompt(isWord ? ORDINAL_WORDS[n] : String(n));
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

  /**
   * Score an answer and move to the next prompt.
   * Empty submissions (a stray Enter after Space already submitted) are ignored.
   */
  handleInput(input: string) {
    const user = input.trim();
    if (!user) return;

    this.cancelSpeech();
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
      correct = normalizeOrdinal(user) === normalizeOrdinal(this.currentPrompt);
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
    this.callbacks.onResult(correct);

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
