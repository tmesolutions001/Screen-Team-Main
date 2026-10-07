import { bookVariations } from '@/utils/bookValidation';
import { SAINT_PREFIX, SAINT_PREFIXED_BOOKS, bookVariationsEs } from '@/utils/bookValidationEs';

/** Simulator language. Only the simulator (menu, rounds, results) follows it. */
export type Lang = 'en' | 'es';

/**
 * Everything about the Bible a round needs in one language: the chapter and
 * verse data, the abbreviations ProPresenter accepts, and how a reference is
 * read aloud. Scoring and miss diagnosis both read `variations`.
 */
export interface BookSet {
  lang: Lang;
  /** Book/chapter/verse-count XML in public/. */
  file: string;
  /** Book name -> every abbreviation that opens it; the first is the shortest. */
  variations: Readonly<Record<string, readonly string[]>>;
  /** Books typed with a fixed prefix in ProPresenter ("s. " for the Spanish Gospels). */
  requiredPrefix: (book: string) => string;
  /** BCP 47 language for speech; undefined keeps the browser's default voice. */
  speechLang?: string;
  /** Speech rate for prompts. */
  speechRate: number;
  /** A prompt ("2 Kings 6:3", "3:16", "Hosea") as the narrator reads it. */
  spoken: (prompt: string) => string;
}

const EN_ORDINALS = ['', 'first', 'second', 'third'];
const ES_ORDINALS = ['', 'Primera de', 'Segunda de', 'Tercera de'];

/** "2 Kings 6:3" -> book "2 Kings", reference "6:3"; "3:16" -> no book; "Hosea" -> no reference. */
const splitPrompt = (prompt: string) => {
  const m = /^(.*?)\s*(\d+:\d+)?$/.exec(prompt) ?? [prompt, prompt, undefined];
  return { book: m[1], ref: m[2] };
};

const english: BookSet = {
  lang: 'en',
  file: '/BookInfo.xml',
  variations: bookVariations,
  requiredPrefix: () => '',
  speechRate: 1.5,
  // "2 Kings 6:3" -> "second Kings 6 verse 3". Only a book number is an ordinal.
  spoken: (prompt) =>
    prompt
      .replace(/^([1-3]) (?=[A-Za-z])/, (_, n: string) => `${EN_ORDINALS[Number(n)]} `)
      .replace(':', ' verse '),
};

const spanish: BookSet = {
  lang: 'es',
  file: '/BookInfoEs.xml',
  variations: bookVariationsEs,
  requiredPrefix: (book) => (SAINT_PREFIXED_BOOKS.has(book) ? SAINT_PREFIX : ''),
  speechLang: 'es-MX',
  speechRate: 1.3,
  // "1 Reyes 6:3" -> "Primera de Reyes 6, versículo 3"; "3:16" -> "3, versículo 16".
  spoken: (prompt) => {
    const { book, ref } = splitPrompt(prompt);
    const name = book.replace(/^([1-3]) (?=[A-Za-z])/, (_, n: string) => `${ES_ORDINALS[Number(n)]} `);
    if (!ref) return name;
    const [chapter, verse] = ref.split(':');
    return `${name ? `${name} ` : ''}${chapter}, versículo ${verse}`;
  },
};

export const BOOK_SETS: Record<Lang, BookSet> = { en: english, es: spanish };
