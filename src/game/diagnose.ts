import { BOOK_SETS, type BookSet, type Lang } from './books';
import type { GameMode } from './engine';

/**
 * Explains a missed answer: what the typed text would actually have opened and
 * what was missing, so the results table can teach rather than just mark wrong.
 * Lookup mirrors `validateInput`: an abbreviation opens exactly one book.
 * The logic is shared; only the wording (MESSAGES) differs per language.
 */

export type IssueCode =
  | 'missing-book' | 'missing-space' | 'missing-number' | 'wrong-number' | 'extra-number' | 'invalid-book'
  | 'earlier-book' | 'wrong-book' | 'missing-prefix' | 'prefix-period' | 'prefix-space'
  | 'missing-ref' | 'missing-verse' | 'missing-chapter-or-verse' | 'swapped' | 'no-chapter' | 'wrong-chapter'
  | 'no-verse' | 'wrong-verse' | 'extra-numbers' | 'not-a-number' | 'colon' | 'no-match';

export interface Issue {
  /** Language-independent kind, for logic. */
  code: IssueCode;
  /** Short label for the results-table pill. */
  label: string;
  /** One-sentence explanation; `backticks` mark typed text, **stars** a book. */
  detail: string;
}

export interface Diagnosis {
  issues: Issue[];
  /** Fewest keystrokes that would have scored, e.g. "2 ti 1 1". */
  fastest: string;
}

/** Chapter and verse counts from the book XML; undefined when the data isn't loaded. */
export interface BookData {
  chapterCount: (book: string) => number | undefined;
  verseCount: (book: string, chapter: number) => number | undefined;
}

const code = (s: string) => `\`${s}\``;

/** Every message, per language. Functions take what the sentence needs. */
const MESSAGES = {
  en: {
    opens: (typed: string, book: string) => `${code(typed)} opens **${book}**`,
    noMatch: (typed: string) => `${code(typed)} doesn't match any book`,
    shortestFor: (book: string, s: string) => `The shortest for ${book} is ${code(s)}.`,
    missingBook: (book: string, s: string) => ['Missing book', `No book was typed. ${book} starts with ${code(s)}.`],
    missingSpace: (fix: string) => ['Missing space', `Put a space after the book number: ${code(fix)}.`],
    missingNumber: (book: string, fix: string, typed: string, opened?: string) => [
      'Missing book number',
      `${book} needs its number first: ${code(fix)}.` + (opened ? ` On its own, ${code(typed)} opens **${opened}**.` : ''),
    ],
    wrongNumber: (opens: string, book: string, want: string, got: string) => ['Wrong book number', `${opens}, not ${book}. Use ${code(want)}, not ${code(got)}.`],
    extraNumber: (opens: string, book: string, fix: string) => ['Extra book number', `${opens}. ${book} has no number: ${code(fix)}.`],
    invalidBook: (opens: string, fix: string) => ['Not a valid book', `${opens}. ${fix}`],
    earlierBook: (opens: string, book: string, before: boolean, s: string) => [
      'Opens earlier book',
      `${opens}, which ${before ? 'comes before' : 'takes priority over'} ${book}. Type at least ${code(s)}.`,
    ],
    wrongBook: (opens: string, book: string, fix: string) => ['Opens wrong book', `${opens}, not ${book}. ${fix}`],
    missingPrefix: (book: string, prefix: string, fix: string, typed: string, opened?: string) => [
      `Missing "${prefix.trim().toUpperCase()}"`,
      `${book} needs ${code(prefix.trim().toUpperCase())} in front: ${code(fix)}.` +
        (opened ? ` Without it, ${code(typed)} opens **${opened}**.` : ` Without it, ${code(typed)} doesn't open any book.`),
    ],
    prefixPeriod: (prefix: string, fix: string) => ['Missing period', `Type ${code(prefix.trim().toUpperCase())} with its period: ${code(fix)}.`],
    prefixSpace: (prefix: string, fix: string) => ['Missing space', `Put a space after ${code(prefix.trim().toUpperCase())}: ${code(fix)}.`],
    missingRef: (fix: string) => ['Missing chapter & verse', `Only the book was typed. Add the chapter and verse: ${code(fix)}.`],
    missingVerse: (opensWhat: string, verse: string, fix: string) => [
      'Missing verse',
      `Only the chapter was typed, so this opens ${opensWhat}, not verse ${verse}. Add the verse: ${code(fix)}.`,
    ],
    chapterOnly: (n: string) => `chapter ${n}`,
    missingChapterOrVerse: (n: string, fix: string) => ['Missing chapter or verse', `${code(n)} is read as chapter ${n}. Type both: ${code(fix)}.`],
    swapped: (typed: string, where: string, fix: string) => ['Chapter & verse swapped', `${code(typed)} is ${where}. Chapter comes first: ${code(fix)}.`],
    noChapter: (book: string, max: number, chapter: string) => [
      "Chapter doesn't exist",
      `${book} has only ${max} chapter${max === 1 ? '' : 's'}. The prompt was chapter ${chapter}.`,
    ],
    wrongChapter: (typed: string, chapter: string) => ['Wrong chapter', `Typed chapter ${typed}; the prompt was chapter ${chapter}.`],
    noVerse: (where: string, max: number, verse: string) => [
      "Verse doesn't exist",
      `${where} has only ${max} verse${max === 1 ? '' : 's'}. The prompt was verse ${verse}.`,
    ],
    wrongVerse: (typed: string, verse: string) => ['Wrong verse', `Typed verse ${typed}; the prompt was verse ${verse}.`],
    extraNumbers: (extra: string) => ['Extra numbers', `Only a chapter and verse are needed; ${code(extra)} is extra.`],
    numberWord: (word: string, digit: string) => ['Not a number', `${code(word)} isn't a number. Use digits: ${code(digit)}.`],
    notNumber: (word: string, fix: string) => ['Not a number', `${code(word)} isn't a number. Type the chapter and verse as digits: ${code(fix)}.`],
    colon: () => ['Typed a colon', `Type without the ${code(':')}, it's faster. A space between chapter and verse is all you need.`],
    noMatchAnswer: (fix: string) => ["Doesn't match", `This doesn't match the prompt. Type ${code(fix)}.`],
  },
  es: {
    opens: (typed: string, book: string) => `${code(typed)} abre **${book}**`,
    noMatch: (typed: string) => `${code(typed)} no coincide con ningún libro`,
    shortestFor: (book: string, s: string) => `Lo más corto para ${book} es ${code(s)}.`,
    missingBook: (book: string, s: string) => ['Falta el libro', `No escribiste ningún libro. ${book} empieza con ${code(s)}.`],
    missingSpace: (fix: string) => ['Falta un espacio', `Pon un espacio después del número del libro: ${code(fix)}.`],
    missingNumber: (book: string, fix: string, typed: string, opened?: string) => [
      'Falta el número del libro',
      `${book} necesita su número primero: ${code(fix)}.` + (opened ? ` Por sí solo, ${code(typed)} abre **${opened}**.` : ''),
    ],
    wrongNumber: (opens: string, book: string, want: string, got: string) => [
      'Número de libro incorrecto',
      `${opens}, no ${book}. Usa ${code(want)}, no ${code(got)}.`,
    ],
    extraNumber: (opens: string, book: string, fix: string) => ['Número de libro de más', `${opens}. ${book} no lleva número: ${code(fix)}.`],
    invalidBook: (opens: string, fix: string) => ['No es un libro válido', `${opens}. ${fix}`],
    earlierBook: (opens: string, book: string, before: boolean, s: string) => [
      'Abre un libro anterior',
      `${opens}, que ${before ? 'va antes que' : 'tiene prioridad sobre'} ${book}. Escribe al menos ${code(s)}.`,
    ],
    wrongBook: (opens: string, book: string, fix: string) => ['Abre otro libro', `${opens}, no ${book}. ${fix}`],
    missingPrefix: (book: string, prefix: string, fix: string, typed: string, opened?: string) => [
      `Falta "${prefix.trim().toUpperCase()}"`,
      `${book} necesita ${code(prefix.trim().toUpperCase())} delante: ${code(fix)}.` +
        (opened ? ` Sin eso, ${code(typed)} abre **${opened}**.` : ` Sin eso, ${code(typed)} no abre ningún libro.`),
    ],
    prefixPeriod: (prefix: string, fix: string) => ['Falta el punto', `Escribe ${code(prefix.trim().toUpperCase())} con su punto: ${code(fix)}.`],
    prefixSpace: (prefix: string, fix: string) => ['Falta un espacio', `Pon un espacio después de ${code(prefix.trim().toUpperCase())}: ${code(fix)}.`],
    missingRef: (fix: string) => ['Faltan capítulo y versículo', `Solo escribiste el libro. Añade el capítulo y el versículo: ${code(fix)}.`],
    missingVerse: (opensWhat: string, verse: string, fix: string) => [
      'Falta el versículo',
      `Solo escribiste el capítulo, así que esto abre ${opensWhat}, no el versículo ${verse}. Añade el versículo: ${code(fix)}.`,
    ],
    chapterOnly: (n: string) => `el capítulo ${n}`,
    missingChapterOrVerse: (n: string, fix: string) => [
      'Falta capítulo o versículo',
      `${code(n)} se lee como el capítulo ${n}. Escribe ambos: ${code(fix)}.`,
    ],
    swapped: (typed: string, where: string, fix: string) => [
      'Capítulo y versículo al revés',
      `${code(typed)} es ${where}. El capítulo va primero: ${code(fix)}.`,
    ],
    noChapter: (book: string, max: number, chapter: string) => [
      'El capítulo no existe',
      `${book} solo tiene ${max} capítulo${max === 1 ? '' : 's'}. La referencia era el capítulo ${chapter}.`,
    ],
    wrongChapter: (typed: string, chapter: string) => ['Capítulo incorrecto', `Escribiste el capítulo ${typed}; la referencia era el capítulo ${chapter}.`],
    noVerse: (where: string, max: number, verse: string) => [
      'El versículo no existe',
      `${where} solo tiene ${max} versículo${max === 1 ? '' : 's'}. La referencia era el versículo ${verse}.`,
    ],
    wrongVerse: (typed: string, verse: string) => ['Versículo incorrecto', `Escribiste el versículo ${typed}; la referencia era el versículo ${verse}.`],
    extraNumbers: (extra: string) => ['Números de más', `Solo hacen falta capítulo y versículo; ${code(extra)} sobra.`],
    numberWord: (word: string, digit: string) => ['No es un número', `${code(word)} no es un número. Usa dígitos: ${code(digit)}.`],
    notNumber: (word: string, fix: string) => ['No es un número', `${code(word)} no es un número. Escribe el capítulo y el versículo con dígitos: ${code(fix)}.`],
    colon: () => ['Escribiste dos puntos', `Escribe sin los ${code(':')}, es más rápido. Basta un espacio entre capítulo y versículo.`],
    noMatchAnswer: (fix: string) => ['No coincide', `No coincide con la referencia. Escribe ${code(fix)}.`],
  },
} satisfies Record<Lang, Record<string, unknown>>;

type Messages = (typeof MESSAGES)['en'];

/** Number words typed where digits belong ("john three 16", "juan tres 16"), in either language. */
const NUMBER_WORDS: Record<string, string> = {
  ...Object.fromEntries(
    ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
      'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'].map((w, i) => [w, String(i)])
  ),
  ...Object.fromEntries(
    ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece',
      'catorce', 'quince', 'dieciseis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'].map((w, i) => [w, String(i)])
  ),
  first: '1', second: '2', third: '3',
  primero: '1', primera: '1', primer: '1', segundo: '2', segunda: '2', tercero: '3', tercera: '3', tercer: '3',
};
const isDigits = (t: string) => /^\d+$/.test(t);
const unaccent = (text: string) => text.replace(/[áéíóúü]/g, (c) => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' })[c] ?? c);

/** "2 Timothy" -> { number: "2", name: "timothy" }. */
const splitNumbered = (text: string) => {
  const m = /^([1-3])\s+(.+)$/.exec(text);
  return m ? { number: m[1], name: m[2] } : { number: '', name: text };
};

/** A diagnoser for one language: its abbreviation table and its wording. */
function makeDiagnoser(set: BookSet, m: Messages) {
  const books = Object.keys(set.variations);
  const order = new Map<string, number>(books.map((b, i) => [b, i]));
  const lookup = new Map<string, string>(books.flatMap((book) => set.variations[book].map((v) => [v, book] as const)));
  const resolveBook = (text: string) => lookup.get(text);
  const shortest = (book: string) => set.variations[book]?.[0] ?? book.toLowerCase();
  const issue = (c: IssueCode, [label, detail]: string[]): Issue => ({ code: c, label, detail });

  /** Issues with the book part of an answer. Empty when it opens the right book. */
  function diagnoseBook(typed: string, target: string): Issue[] {
    if (!typed) return [issue('missing-book', m.missingBook(target, shortest(target)))];

    const opened = resolveBook(typed);
    if (opened === target) return [];
    const opens = opened ? m.opens(typed, opened) : m.noMatch(typed);

    // Books that need a fixed prefix in ProPresenter ("s. mat"): missing, missing its period, or glued on.
    const prefix = set.requiredPrefix(target);
    if (prefix) {
      const letter = prefix.trim().replace(/\.$/, ''); // "s"
      const withPrefix = (rest: string) => `${prefix}${rest}`;
      if (resolveBook(withPrefix(typed)) === target) {
        return [issue('missing-prefix', m.missingPrefix(target, prefix, withPrefix(typed), typed, opened))];
      }
      const noPeriod = new RegExp(`^${letter}\\s+(.+)$`).exec(typed);
      if (noPeriod && resolveBook(withPrefix(noPeriod[1])) === target) {
        return [issue('prefix-period', m.prefixPeriod(prefix, withPrefix(noPeriod[1])))];
      }
      const glued = new RegExp(`^${letter}\\.(\\S.*)$`).exec(typed);
      if (glued && resolveBook(withPrefix(glued[1])) === target) {
        return [issue('prefix-space', m.prefixSpace(prefix, withPrefix(glued[1])))];
      }
    }

    const t = splitNumbered(target.toLowerCase());
    const y = splitNumbered(typed);

    // "2ti": the number needs its own space.
    const glued = /^([1-3])([a-z].*)$/.exec(typed);
    if (glued && resolveBook(`${glued[1]} ${glued[2]}`) === target) {
      return [issue('missing-space', m.missingSpace(`${glued[1]} ${glued[2]}`))];
    }
    if (t.number && !y.number && resolveBook(`${t.number} ${typed}`) === target) {
      return [issue('missing-number', m.missingNumber(target, `${t.number} ${typed}`, typed, opened))];
    }
    if (t.number && y.number && y.number !== t.number && resolveBook(`${t.number} ${y.name}`) === target) {
      return [issue('wrong-number', m.wrongNumber(opens, target, t.number, y.number))];
    }
    if (!t.number && y.number && (resolveBook(y.name) === target || target.toLowerCase().startsWith(y.name))) {
      const fix = resolveBook(y.name) === target ? y.name : shortest(target);
      return [issue('extra-number', m.extraNumber(opens, target, fix))];
    }

    const fix = m.shortestFor(target, shortest(target));
    if (!opened) return [issue('invalid-book', m.invalidBook(opens, fix))];

    // Typed the start of the right name, but another book owns that abbreviation.
    if (t.number === y.number && `${prefix}${target.toLowerCase()}`.startsWith(typed)) {
      const before = (order.get(opened) ?? 0) < (order.get(target) ?? 0);
      return [issue('earlier-book', m.earlierBook(opens, target, before, shortest(target)))];
    }
    return [issue('wrong-book', m.wrongBook(opens, target, fix))];
  }

  /** Issues with chapter/verse numbers. `bookName` (the prompt's book) drives the "doesn't exist" checks. */
  function diagnoseReference(refs: string[], chapter: string, verse: string, bookName: string | null, data: BookData | undefined): Issue[] {
    const where = (c: string, v?: string) => `${bookName ? `${bookName} ` : ''}${c}${v ? `:${v}` : ''}`;
    if (refs.length === 0) return [issue('missing-ref', m.missingRef(`${chapter} ${verse}`))];
    if (refs.length === 1) {
      const [n] = refs;
      if (n === chapter) {
        return [issue('missing-verse', m.missingVerse(bookName ? where(n) : m.chapterOnly(n), verse, `${chapter} ${verse}`))];
      }
      return [issue('missing-chapter-or-verse', m.missingChapterOrVerse(n, `${chapter} ${verse}`))];
    }

    const issues: Issue[] = [];
    const [c, v, ...extra] = refs;
    if (c === verse && v === chapter && c !== v) {
      issues.push(issue('swapped', m.swapped(`${c} ${v}`, where(c, v), `${chapter} ${verse}`)));
    } else {
      if (c !== chapter) {
        const max = bookName ? data?.chapterCount(bookName) : undefined;
        issues.push(
          max !== undefined && Number(c) > max
            ? issue('no-chapter', m.noChapter(bookName!, max, chapter))
            : issue('wrong-chapter', m.wrongChapter(c, chapter))
        );
      }
      if (v !== verse) {
        const max = bookName && c === chapter ? data?.verseCount(bookName, Number(c)) : undefined;
        issues.push(
          max !== undefined && Number(v) > max
            ? issue('no-verse', m.noVerse(where(c), max, verse))
            : issue('wrong-verse', m.wrongVerse(v, verse))
        );
      }
    }
    if (extra.length) issues.push(issue('extra-numbers', m.extraNumbers(extra.join(' '))));
    return issues;
  }

  const numberWordIssue = (word: string) => issue('not-a-number', m.numberWord(word, NUMBER_WORDS[word]));
  const colonIssue = () => issue('colon', m.colon());

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

    // Number words between the book and the numbers.
    const wordIssues: Issue[] = [];
    while (bookTokens.length > 1) {
      const last = bookTokens[bookTokens.length - 1];
      if (last in NUMBER_WORDS) {
        wordIssues.unshift(numberWordIssue(last));
        bookTokens = bookTokens.slice(0, -1);
      } else break;
    }
    const typedBook = bookTokens.join(' ');

    const bookIssues = diagnoseBook(typedBook, target);
    issues.push(...bookIssues);
    // Garbage with no numbers at all: "not a valid book" says it; listing every missing part is noise.
    if (bookIssues[0]?.code === 'invalid-book' && refs.length === 0 && !wordIssues.length) {
      return { issues: hasColon ? [...issues, colonIssue()] : issues, fastest };
    }
    issues.push(...wordIssues);
    // Word-for-number answers already lost their reference slot; don't also call it missing.
    const refIssues = diagnoseReference(refs, chapter, verse, target, data);
    const missing: IssueCode[] = ['missing-ref', 'missing-verse', 'missing-chapter-or-verse'];
    issues.push(...(wordIssues.length && refs.length < 2 ? refIssues.filter((i) => !missing.includes(i.code)) : refIssues));
    if (hasColon) issues.push(colonIssue());

    return { issues, fastest };
  }

  function diagnoseChapterVerse(raw: string, prompt: string, data?: BookData): Diagnosis {
    const [chapter, verse] = prompt.split(':');
    const fastest = `${chapter} ${verse}`;
    const tokens = raw.replace(/:/g, ' ').split(/\s+/).filter(Boolean);
    const issues: Issue[] = [];

    const words = tokens.filter((t) => !isDigits(t));
    for (const w of words) issues.push(w in NUMBER_WORDS ? numberWordIssue(w) : issue('not-a-number', m.notNumber(w, fastest)));
    const refs = tokens.filter(isDigits);
    if (refs.length || !words.length) issues.push(...diagnoseReference(refs, chapter, verse, null, data));
    if (raw.includes(':')) issues.push(colonIssue());
    return { issues, fastest };
  }

  return function diagnose(mode: GameMode, prompt: string, input: string, data?: BookData): Diagnosis {
    const raw = unaccent(input.trim().toLowerCase());
    let result: Diagnosis;
    switch (mode) {
      case 'book':
        result = { issues: diagnoseBook(raw.replace(/\s+/g, ' '), prompt), fastest: shortest(prompt) };
        break;
      case 'chapter-verse':
        result = diagnoseChapterVerse(raw, prompt, data);
        break;
      default:
        result = diagnoseClassic(raw, prompt, data);
    }
    // Scoring and diagnosis should always agree; never leave a miss unexplained.
    if (!result.issues.length) result.issues.push(issue('no-match', m.noMatchAnswer(result.fastest)));
    return result;
  };
}

const DIAGNOSERS = {
  en: makeDiagnoser(BOOK_SETS.en, MESSAGES.en),
  es: makeDiagnoser(BOOK_SETS.es, MESSAGES.es),
};

/** Why `input` didn't score for `prompt`, worded in `lang` (English by default). */
export function diagnose(mode: GameMode, prompt: string, input: string, data?: BookData, lang: Lang = 'en'): Diagnosis {
  return DIAGNOSERS[lang](mode, prompt, input, data);
}
