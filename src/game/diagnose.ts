import { bookVariations } from '@/utils/bookValidation';
import type { GameMode } from './engine';

/**
 * Explains a missed answer: what the typed text would actually have opened and
 * what was missing, so the results table can teach rather than just mark wrong.
 * Lookup mirrors `validateInput`: an abbreviation opens exactly one book.
 */

export interface Issue {
  /** Short label for the results-table pill. */
  label: string;
  /** One-sentence explanation; `backticks` mark typed text. */
  detail: string;
}

export interface Diagnosis {
  issues: Issue[];
  /** Fewest keystrokes that would have scored, e.g. "2 ti 1 1". */
  fastest: string;
}

/** Chapter and verse counts from BookInfo.xml; undefined when the data isn't loaded. */
export interface BookData {
  chapterCount: (book: string) => number | undefined;
  verseCount: (book: string, chapter: number) => number | undefined;
}

const BOOKS = Object.keys(bookVariations) as (keyof typeof bookVariations)[];
const BOOK_ORDER = new Map<string, number>(BOOKS.map((b, i) => [b, i]));
const LOOKUP = new Map<string, string>(
  BOOKS.flatMap((book) => bookVariations[book].map((v) => [v, book] as const))
);

const resolveBook = (text: string) => LOOKUP.get(text);
const shortest = (book: string) => bookVariations[book as keyof typeof bookVariations]?.[0] ?? book.toLowerCase();

/** "2 Timothy" -> { number: "2", name: "timothy" }. */
const splitNumbered = (text: string) => {
  const m = /^([1-3])\s+(.+)$/.exec(text);
  return m ? { number: m[1], name: m[2] } : { number: '', name: text };
};

const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty', 'first', 'second', 'third',
];
const ORDINAL_DIGIT: Record<string, string> = { first: '1', second: '2', third: '3' };
const isDigits = (t: string) => /^\d+$/.test(t);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const COLON: Issue = {
  label: 'Typed a colon',
  detail: "Type without the `:`, it's faster. A space between chapter and verse is all you need.",
};

/** Issues with the book part of an answer. Empty when it opens the right book. */
function diagnoseBook(typed: string, target: string): Issue[] {
  if (!typed) return [{ label: 'Missing book', detail: `No book was typed. ${target} starts with \`${shortest(target)}\`.` }];

  const opened = resolveBook(typed);
  if (opened === target) return [];

  const t = splitNumbered(target.toLowerCase());
  const y = splitNumbered(typed);
  const opens = opened ? `\`${typed}\` opens **${opened}**` : `\`${typed}\` doesn't match any book`;

  // "2ti": the number needs its own space.
  const glued = /^([1-3])([a-z].*)$/.exec(typed);
  if (glued && resolveBook(`${glued[1]} ${glued[2]}`) === target) {
    return [{ label: 'Missing space', detail: `Put a space after the book number: \`${glued[1]} ${glued[2]}\`.` }];
  }

  if (t.number && !y.number && resolveBook(`${t.number} ${typed}`) === target) {
    return [{
      label: 'Missing book number',
      detail: `${target} needs its number first: \`${t.number} ${typed}\`.` +
        (opened ? ` On its own, \`${typed}\` opens **${opened}**.` : ''),
    }];
  }
  if (t.number && y.number && y.number !== t.number && resolveBook(`${t.number} ${y.name}`) === target) {
    return [{ label: 'Wrong book number', detail: `${opens}, not ${target}. Use \`${t.number}\`, not \`${y.number}\`.` }];
  }
  if (!t.number && y.number && (resolveBook(y.name) === target || target.toLowerCase().startsWith(y.name))) {
    const fix = resolveBook(y.name) === target ? y.name : shortest(target);
    return [{ label: 'Extra book number', detail: `${opens}. ${target} has no number: \`${fix}\`.` }];
  }

  const fix = `The shortest for ${target} is \`${shortest(target)}\`.`;
  if (!opened) return [{ label: 'Not a valid book', detail: `${opens}. ${fix}` }];

  // Typed the start of the right name, but another book owns that abbreviation.
  if (t.number === y.number && target.toLowerCase().startsWith(typed)) {
    const before = (BOOK_ORDER.get(opened) ?? 0) < (BOOK_ORDER.get(target) ?? 0);
    return [{
      label: 'Opens earlier book',
      detail: `${opens}, which ${before ? 'comes before' : 'takes priority over'} ${target}. Type at least \`${shortest(target)}\`.`,
    }];
  }
  return [{ label: 'Opens wrong book', detail: `${opens}, not ${target}. ${fix}` }];
}

/** Issues with chapter/verse numbers. `bookName` (the prompt's book) drives the "doesn't exist" checks. */
function diagnoseReference(
  refs: string[],
  chapter: string,
  verse: string,
  bookName: string | null,
  data: BookData | undefined,
): Issue[] {
  const where = bookName ? `${bookName} ` : '';
  if (refs.length === 0) {
    return [{ label: 'Missing chapter & verse', detail: `Only the book was typed. Add the chapter and verse: \`${chapter} ${verse}\`.` }];
  }
  if (refs.length === 1) {
    const [n] = refs;
    if (n === chapter) {
      return [{ label: 'Missing verse', detail: `Only the chapter was typed, so this opens ${bookName ? `${bookName} ${n}` : `chapter ${n}`}, not verse ${verse}. Add the verse: \`${chapter} ${verse}\`.` }];
    }
    return [{ label: 'Missing chapter or verse', detail: `\`${n}\` is read as chapter ${n}. Type both: \`${chapter} ${verse}\`.` }];
  }

  const issues: Issue[] = [];
  const [c, v, ...extra] = refs;
  if (c === verse && v === chapter && c !== v) {
    issues.push({ label: 'Chapter & verse swapped', detail: `\`${c} ${v}\` is ${where}${c}:${v}. Chapter comes first: \`${chapter} ${verse}\`.` });
  } else {
    if (c !== chapter) {
      const max = bookName ? data?.chapterCount(bookName) : undefined;
      issues.push(max !== undefined && Number(c) > max
        ? { label: "Chapter doesn't exist", detail: `${bookName} has only ${plural(max, 'chapter')}. The prompt was chapter ${chapter}.` }
        : { label: 'Wrong chapter', detail: `Typed chapter ${c}; the prompt was chapter ${chapter}.` });
    }
    if (v !== verse) {
      const max = bookName && c === chapter ? data?.verseCount(bookName, Number(c)) : undefined;
      issues.push(max !== undefined && Number(v) > max
        ? { label: "Verse doesn't exist", detail: `${bookName} ${c} has only ${plural(max, 'verse')}. The prompt was verse ${verse}.` }
        : { label: 'Wrong verse', detail: `Typed verse ${v}; the prompt was verse ${verse}.` });
    }
  }
  if (extra.length) {
    issues.push({ label: 'Extra numbers', detail: `Only a chapter and verse are needed; \`${extra.join(' ')}\` is extra.` });
  }
  return issues;
}

/** Number words typed where digits belong ("john three 16"). */
const numberWordIssue = (word: string): Issue => {
  const i = NUMBER_WORDS.indexOf(word);
  const digit = ORDINAL_DIGIT[word] ?? String(i);
  return { label: 'Not a number', detail: `\`${word}\` isn't a number. Use digits: \`${digit}\`.` };
};

function diagnoseClassic(raw: string, prompt: string, data?: BookData): Diagnosis {
  const splitAt = prompt.lastIndexOf(' ');
  const target = prompt.slice(0, splitAt);
  const [chapter, verse] = prompt.slice(splitAt + 1).split(':');
  const fastest = `${shortest(target)} ${chapter} ${verse}`;

  const issues: Issue[] = [];
  const hasColon = raw.includes(':');
  const tokens = raw.replace(/:/g, ' ').split(/\s+/).filter(Boolean);

  // Trailing digits are the reference; everything before is the book (which may itself start with a digit).
  let split = tokens.length;
  while (split > 0 && isDigits(tokens[split - 1])) split--;
  let bookTokens = tokens.slice(0, split);
  let refs = tokens.slice(split);
  // All digits ("3 16"): no book at all.
  if (bookTokens.length === 0) refs = tokens;

  // Number words and stray text between the book and the numbers.
  const wordIssues: Issue[] = [];
  while (bookTokens.length > 1) {
    const last = bookTokens[bookTokens.length - 1];
    if (NUMBER_WORDS.includes(last)) {
      wordIssues.unshift(numberWordIssue(last));
      bookTokens = bookTokens.slice(0, -1);
    } else break;
  }
  const typedBook = bookTokens.join(' ');

  const bookIssues = diagnoseBook(typedBook, target);
  issues.push(...bookIssues);
  // Garbage with no numbers at all: "not a valid book" says it; listing every missing part is noise.
  if (bookIssues[0]?.label === 'Not a valid book' && refs.length === 0 && !wordIssues.length) {
    return { issues: hasColon ? [...issues, COLON] : issues, fastest };
  }
  issues.push(...wordIssues);
  // Word-for-number answers already lost their reference slot; don't also call it missing.
  const refIssues = diagnoseReference(refs, chapter, verse, target, data);
  issues.push(...(wordIssues.length && refs.length < 2 ? refIssues.filter((i) => !i.label.startsWith('Missing')) : refIssues));
  if (hasColon) issues.push(COLON);

  return { issues, fastest };
}

function diagnoseChapterVerse(raw: string, prompt: string, data?: BookData): Diagnosis {
  const [chapter, verse] = prompt.split(':');
  const fastest = `${chapter} ${verse}`;
  const tokens = raw.replace(/:/g, ' ').split(/\s+/).filter(Boolean);
  const issues: Issue[] = [];

  const words = tokens.filter((t) => !isDigits(t));
  for (const w of words) {
    issues.push(NUMBER_WORDS.includes(w)
      ? numberWordIssue(w)
      : { label: 'Not a number', detail: `\`${w}\` isn't a number. Type the chapter and verse as digits: \`${fastest}\`.` });
  }
  const refs = tokens.filter(isDigits);
  if (refs.length || !words.length) issues.push(...diagnoseReference(refs, chapter, verse, null, data));
  if (raw.includes(':')) issues.push(COLON);
  return { issues, fastest };
}

function diagnoseWarmup(raw: string, prompt: string): Diagnosis {
  const toDigit = (s: string) => ORDINAL_DIGIT[s.toLowerCase()] ?? s;
  const want = toDigit(prompt);
  const got = toDigit(raw);
  const issues: Issue[] = /^\d+$/.test(got)
    ? [{ label: 'Wrong number', detail: `Typed ${got}; the prompt was ${prompt}, so \`${want}\`.` }]
    : [{ label: 'Not a number', detail: `\`${raw}\` isn't a number. ${prompt} is \`${want}\`.` }];
  return { issues, fastest: want };
}

export function diagnose(mode: GameMode, prompt: string, input: string, data?: BookData): Diagnosis {
  const raw = input.trim().toLowerCase();
  let result: Diagnosis;
  switch (mode) {
    case 'book':
      result = { issues: diagnoseBook(raw.replace(/\s+/g, ' '), prompt), fastest: shortest(prompt) };
      break;
    case 'chapter-verse':
      result = diagnoseChapterVerse(raw, prompt, data);
      break;
    case 'warmup':
      result = diagnoseWarmup(raw, prompt);
      break;
    default:
      result = diagnoseClassic(raw, prompt, data);
  }
  // Scoring and diagnosis should always agree; never leave a miss unexplained.
  if (!result.issues.length) {
    result.issues.push({ label: "Doesn't match", detail: `This doesn't match the prompt. Type \`${result.fastest}\`.` });
  }
  return result;
}
