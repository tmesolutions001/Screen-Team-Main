import { validateInput } from '@/utils/bookValidation';
import { speak, stop } from '@/lib/speech';
import { diagnose, type BookData, type Diagnosis } from './diagnose';
import { BOOK_SETS, type BookSet, type Lang } from './books';

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

export const parseMode = (value?: string): GameMode =>
  (GAME_MODES as readonly string[]).includes(value ?? '') ? (value as GameMode) : 'classic';

/** What the space bar should do in the current mode. */
export type SpaceAction = 'type' | 'submit';

// One parsed copy of each language's book data, shared by every round, so
// hopping between modes never waits on a fetch or races an unmount.
const bookDocs = new Map<string, Promise<Document | null>>();
const loadBookDoc = (filePath: string) => {
  let doc = bookDocs.get(filePath);
  if (!doc) {
    doc = fetch(filePath)
      .then((r) => r.text())
      .then((xml) => new DOMParser().parseFromString(xml, 'text/xml'))
      .catch((error) => {
        console.error('Error loading XML:', error);
        bookDocs.delete(filePath); // let the next round retry
        return null;
      });
    bookDocs.set(filePath, doc);
  }
  return doc;
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

  /** The language's books, abbreviations and speech. */
  private books: BookSet;

  constructor(private callbacks: GameCallbacks, mode: GameMode, lang: Lang = 'en') {
    this.mode = mode;
    this.books = BOOK_SETS[lang];
  }

  /** Book data for the round's language. */
  async loadXmlDocument() {
    this.doc = await loadBookDoc(this.books.file);
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
    // Each language reads references its own way ("second Kings 6 verse 3",
    // "Primera de Reyes 6, versículo 3"); only a book number becomes an ordinal.
    speak(this, this.books.spoken(text), this.books.speechRate, this.books.speechLang);
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
    speak(this, text, 1.1, this.books.speechLang);
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
      correct = validateInput(user, this.currentPrompt, this.books.variations);
    } else if (this.mode === 'chapter-verse') {
      // Spaces only: typing the colon is slower, so it's taught as a miss.
      correct = /^\d+\s+\d+$/.test(user) && user.replace(/\s+/, ':') === this.currentPrompt;
    } else if (this.mode === 'book') {
      const testInput = `${user} 1 1`;
      const testPrompt = `${this.currentPrompt} 1:1`;
      correct = validateInput(testInput, testPrompt, this.books.variations);
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
          diagnosis: diagnose(this.mode, this.currentPrompt, user, this.bookData(), this.books.lang),
        },
      ];
      this.callbacks.onMissed(this.incorrectInputs);
    }
    this.callbacks.onResult(correct);

    this.numPrompts++;
    this.generateNewPrompt();
  }

  /**
   * Book mode submits on space, after as many spaces as the book's shortest
   * abbreviation needs: one for numbered books ("1 john") and for Spanish
   * Gospels ("s. mat"), none otherwise. Other modes type the space normally.
   */
  spaceAction(input: string): SpaceAction {
    if (this.mode === 'book') {
      const needed = (this.books.variations[this.currentPrompt]?.[0].match(/ /g) ?? []).length;
      const typed = (input.trim().match(/\s+/g) ?? []).length;
      return typed < needed ? 'type' : 'submit';
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
