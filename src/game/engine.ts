import { validateInput } from '@/utils/bookValidation';
import { speak, stop } from '@/lib/speech';
import { diagnose, type BookData, type Diagnosis } from './diagnose';

export const GAME_MODES = ['classic', 'chapter-verse', 'book', 'warmup'] as const;
export type GameMode = (typeof GAME_MODES)[number];

export interface MissedPrompt {
  id: number;
  prompt: string;
  userInput: string;
  /** Why it was wrong, for the results table. */
  diagnosis: Diagnosis;
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

/** Spoken in place of a book number: "2 Kings" is read "second Kings". */
const ORDINAL_WORDS = ['', 'First', 'Second', 'Third'];

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

  /** Chapter/verse counts for diagnosing misses. */
  private bookData(): BookData | undefined {
    const doc = this.doc;
    if (!doc) return undefined;
    const find = (book: string) =>
      Array.from(doc.getElementsByTagName('Book')).find((b) => b.getAttribute('ID') === book);
    return {
      chapterCount: (book) => find(book)?.getElementsByTagName('Chapter').length,
      verseCount: (book, chapter) => {
        const ch = Array.from(find(book)?.getElementsByTagName('Chapter') ?? [])
          .find((c) => c.getAttribute('Number') === String(chapter));
        return ch ? parseInt(ch.getAttribute('VerseCount') || '0') : undefined;
      },
    };
  }

  speakPrompt(text: string) {
    // Only a book number is read as an ordinal ("2 Kings" -> "second Kings"). Matching on
    // the raw prompt keeps Chapter–Verse's "2:21" as "2 verse 21", not "second verse 21".
    const spoken = text.replace(/^([1-3]) (?=[A-Za-z])/, (_, n: string) => `${ORDINAL_WORDS[Number(n)].toLowerCase()} `);
    speak(this, spoken.replace(':', ' verse '));
  }

  cancelSpeech() {
    stop(this);
  }

  /** Resets the round. Warm Up has no prompt until its first segment begins. */
  start() {
    this.points = 0;
    this.numPrompts = 0;
    this.incorrectInputs = [];
    this.bookUsageCounts.clear();
    this.lastBook = null;
    this.currentPrompt = '';
    if (this.mode !== 'warmup') this.generateNewPrompt();
  }

  /** Warm Up: start drilling `mode` with a fresh prompt. */
  beginSegment(mode: GameMode) {
    this.mode = mode;
    this.generateNewPrompt();
  }

  /** Warm Up: between segments there is no prompt, so answers are ignored. */
  pause() {
    this.currentPrompt = '';
    this.cancelSpeech();
  }

  /** Speak a segment title. Owned like prompts, so leaving the page silences it. */
  announce(text: string) {
    speak(this, text, 1.1);
  }

  generateNewPrompt() {
    if (this.mode === 'warmup' || !this.doc) return;

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
    if (!user || !this.currentPrompt) return;

    this.cancelSpeech();
    let correct = false;

    if (this.mode === 'classic') {
      correct = validateInput(user, this.currentPrompt);
    } else if (this.mode === 'chapter-verse') {
      // Spaces only: typing the colon is slower, so it's taught as a miss.
      correct = /^\d+\s+\d+$/.test(user) && user.replace(/\s+/, ':') === this.currentPrompt;
    } else if (this.mode === 'book') {
      const testInput = `${user} 1 1`;
      const testPrompt = `${this.currentPrompt} 1:1`;
      correct = validateInput(testInput, testPrompt);
    }

    if (correct) {
      this.points++;
      this.callbacks.onScore(this.points);
    } else {
      this.incorrectInputs = [
        ...this.incorrectInputs,
        {
          id: this.numPrompts,
          prompt: this.currentPrompt,
          userInput: input,
          diagnosis: diagnose(this.mode, this.currentPrompt, user, this.bookData()),
        },
      ];
      this.callbacks.onMissed(this.incorrectInputs);
    }
    this.callbacks.onResult(correct);

    this.numPrompts++;
    this.generateNewPrompt();
  }

  /**
   * Book mode submits on space (numbered books like "1 John" allow one space first).
   * Other modes type the space normally.
   */
  spaceAction(input: string): SpaceAction {
    if (this.mode === 'book') {
      const isNumberedBook = /^([1-3])\s/.test(this.currentPrompt);
      return isNumberedBook && !input.includes(' ') ? 'type' : 'submit';
    }
    return 'type';
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
}
