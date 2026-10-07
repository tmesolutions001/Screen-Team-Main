/**
 * Song Formatter: turns raw copied lyrics into slide-ready text.
 *
 *   Title: <Clean Name>
 *
 *   [Blank]
 *   .
 *
 *   [Group]
 *   line (max 25 chars)
 *   line
 *
 *   line
 *   line
 *
 * Pre-processing: alignment dots become spaces, repeat markers (x2, (x4), ×4)
 * are removed from labels and lyrics, and chord-only lines are removed.
 * Rules: the first line is the title (trailing [..] / (..) metadata removed);
 * obvious metadata lines (bracketed, bpm, 4/4, key, credits) are dropped;
 * lyrics before any group label start [Verse 1]; group labels
 * (English, Spanish, abbreviations, typos, multipliers) map to a fixed set of
 * master groups; body lines wrap at word boundaries to 25 characters, balanced
 * so no line is left with a stray word, and are
 * split into chunks of 2–3 lines (keeping each lyric line's wrapped pieces
 * together where possible). Each group's tag is written once, with chunks
 * separated by a blank line; groups with no lyrics are dropped; the song opens
 * with a [Blank] group holding "."; the whole result is in capitals.
 */

export const MAX_LINE = 25;

export const MASTER_GROUPS = [
  'Verse 1', 'Verse 2', 'Verse 3', 'Verse 4', 'Verse 5',
  'Chorus', 'Chorus 1', 'Chorus 2', 'Chorus 3', 'Chorus 4',
  'Bridge', 'Bridge 1', 'Bridge 2', 'Bridge 3',
  'PreChorus', 'Tag', 'Intro', 'Outro', 'Outro Bridge', 'Blank', 'Vamp', 'Bridge Tag', 'Refrain',
] as const;
export type MasterGroup = (typeof MASTER_GROUPS)[number];

type Base =
  | 'verse' | 'chorus' | 'bridge' | 'prechorus' | 'tag' | 'intro'
  | 'outro' | 'outroBridge' | 'blank' | 'vamp' | 'bridgeTag' | 'refrain';

/**
 * Normalised label (lowercase, accents/punctuation/multipliers removed, number
 * removed) -> base group. Multi-word keys are matched whole.
 */
export const GROUP_DICTIONARY: Record<string, Base> = Object.fromEntries(
  (
    [
      ['verse', ['verse', 'verses', 'vers', 'verso', 'versos', 'v', 'vs', 'vr', 'vrs', 'vse', 'estrofa', 'estrofas', 'vesre', 'vrese', 'verese', 'verce', 'versee']],
      ['chorus', ['chorus', 'choruses', 'coro', 'coros', 'ch', 'cho', 'chor', 'chrs', 'chs', 'c', 'crs', 'chorous', 'chrous', 'chours', 'chorsu', 'corus', 'courus', 'cohrus']],
      ['prechorus', ['prechorus', 'pre chorus', 'pre coro', 'precoro', 'pre estribillo', 'pc', 'pch', 'pre ch', 'pre', 'prechrous', 'pre chrous', 'pre chours', 'prechours', 'pre corus', 'pre chorous']],
      ['bridge', ['bridge', 'bridges', 'puente', 'br', 'brdg', 'brg', 'bdg', 'b', 'brige', 'brigde', 'bridg', 'birdge', 'bridgde', 'puenta', 'puemte']],
      ['tag', ['tag', 'tags', 'tg', 'end tag', 'final tag', 'tag final', 'etiqueta', 'etiquetas']],
      ['intro', ['intro', 'introduccion', 'introduction', 'entrada', 'int', 'itnro', 'inro', 'intor']],
      ['outro', ['outro', 'final', 'salida', 'ending', 'end', 'coda', 'out', 'outr', 'otro outro', 'ourto']],
      ['outroBridge', ['outro bridge', 'bridge outro', 'final bridge', 'ending bridge', 'puente final', 'outro puente']],
      ['blank', ['blank', 'instrumental', 'inst', 'interlude', 'interludio', 'break', 'solo', 'musica', 'music', 'pausa']],
      ['vamp', ['vamp', 'vamps', 'vamp out', 'vamping']],
      ['bridgeTag', ['bridge tag', 'tag bridge', 'puente tag', 'tag puente']],
      ['refrain', ['refrain', 'refran', 'refrian', 'refrains', 'estribillo', 'estribillos']],
    ] as [Base, string[]][]
  ).flatMap(([base, labels]) => labels.map((l) => [l, base] as const))
);

/**
 * Spanish -> English, as charts label them (numbers carry over: "Verso 1" ->
 * Verse 1, "Coro 2" -> Chorus 2): Verso -> Verse, Coro -> Chorus, Puente ->
 * Bridge, Pre-Coro / Precoro -> PreChorus, Final / Salida -> Outro, Etiqueta ->
 * Tag, Estribillo -> Refrain. All are in GROUP_DICTIONARY above.
 */

/**
 * Labels that are also ordinary words or letters. Only treated as a group when
 * the line looks like a label: [bracketed], (parenthesised), "Ending:", or ALL CAPS.
 */
const AMBIGUOUS = new Set(['v', 'c', 'b', 'end', 'out', 'break', 'solo', 'music', 'musica', 'pausa', 'entrada']);

/** Bases that carry a number, and which numbers exist for them. */
const NUMBERED: Partial<Record<Base, { label: string; max: number; unnumbered: MasterGroup | null }>> = {
  verse: { label: 'Verse', max: 5, unnumbered: 'Verse 1' },
  chorus: { label: 'Chorus', max: 4, unnumbered: 'Chorus' },
  bridge: { label: 'Bridge', max: 3, unnumbered: 'Bridge' },
};

const UNNUMBERED: Record<Exclude<Base, 'verse' | 'chorus' | 'bridge'>, MasterGroup> = {
  prechorus: 'PreChorus', tag: 'Tag', intro: 'Intro', outro: 'Outro', outroBridge: 'Outro Bridge',
  blank: 'Blank', vamp: 'Vamp', bridgeTag: 'Bridge Tag', refrain: 'Refrain',
};

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
  '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5,
  uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  primer: 1, primero: 1, primera: 1, segundo: 2, segunda: 2, tercer: 3, tercero: 3, tercera: 3,
  cuarto: 4, cuarta: 4, quinto: 5, quinta: 5,
  '1er': 1, '1ro': 1, '1ra': 1, '2do': 2, '2da': 2, '3er': 3, '3ro': 3, '3ra': 3, '4to': 4, '4ta': 4, '5to': 5, '5ta': 5,
  i: 1, ii: 2, iii: 3, iv: 4,
};

const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Multipliers and repeat notes: x2, ×4, 2x, (x3), *2, "2 veces", "repeat", "rep". */
const MULTIPLIER = /(?<![a-z0-9])(?:[x×*]\s*\d+|\d+\s*[x×]|\d+\s*veces|repeat|repetir|repite|rep)(?![a-z0-9])/gi;

/** Short labels where the number is glued on: "v1", "ch2", "coro2", "verse1". */
const GLUED = /^([a-z]+?)(\d)$/;

export interface GroupMatch {
  group: MasterGroup;
}

export interface UnsupportedGroup {
  /** e.g. "Verse 6": recognisably a group, but not one of the master groups. */
  unsupported: string;
}

/** Recognise a group label line. Returns null for lyrics. */
export function matchGroup(rawLine: string): GroupMatch | UnsupportedGroup | null {
  const line = rawLine.trim();
  if (!line || line.length > 40) return null;

  const labelLike = /^[[({<].*[\])}>]:?$/.test(line) || /:$/.test(line) || (line === line.toUpperCase() && /[A-Z]/.test(line));

  let s = stripAccents(line.toLowerCase())
    .replace(MULTIPLIER, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return null;

  // Pull out one number: trailing ("verse 2", "verse two", "verse ii"), leading
  // ("2nd verse", "segundo verso") or glued ("v2").
  let num: number | null = null;
  const tokens = s.split(' ');
  const last = tokens[tokens.length - 1];
  const first = tokens[0];
  const asNumber = (t: string) => (/^\d+$/.test(t) ? Number(t) : NUMBER_WORDS[t] ?? null);
  if (tokens.length > 1 && asNumber(last) !== null) {
    num = asNumber(last);
    tokens.pop();
  } else if (tokens.length > 1 && asNumber(first) !== null) {
    num = asNumber(first);
    tokens.shift();
  } else if (tokens.length === 1) {
    const glued = GLUED.exec(tokens[0]);
    if (glued) {
      tokens[0] = glued[1];
      num = Number(glued[2]);
    }
  }
  s = tokens.join(' ');

  const base = GROUP_DICTIONARY[s] ?? fuzzyBase(s);
  if (!base) return null;
  if (AMBIGUOUS.has(s) && !labelLike && num === null) return null;

  const numbered = NUMBERED[base];
  if (numbered) {
    if (num === null) return { group: numbered.unnumbered! };
    if (num >= 1 && num <= numbered.max) return { group: `${numbered.label} ${num}` as MasterGroup };
    return { unsupported: `${numbered.label} ${num}` };
  }
  return { group: UNNUMBERED[base as keyof typeof UNNUMBERED] };
}

/** One-typo tolerance for the longer English/Spanish names ("chrorus", "brigde"). */
const FUZZY_TARGETS: [string, Base][] = [
  ['chorus', 'chorus'], ['bridge', 'bridge'], ['verse', 'verse'], ['prechorus', 'prechorus'],
  ['intro', 'intro'], ['outro', 'outro'], ['refrain', 'refrain'], ['puente', 'bridge'],
  ['estrofa', 'verse'], ['verso', 'verse'], ['estribillo', 'refrain'], ['etiqueta', 'tag'], ['interlude', 'blank'],
  ['instrumental', 'blank'],
];

function fuzzyBase(s: string): Base | null {
  if (s.length < 5 || s.includes(' ')) return null;
  for (const [target, base] of FUZZY_TARGETS) {
    if (Math.abs(target.length - s.length) <= 1 && editDistance(s, target) <= 1) return base;
  }
  return null;
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/**
 * Pre-processing 1: alignment dots. Raw charts pad with periods instead of
 * spaces ("........The.Lord.bless"); every period becomes a space, then runs of
 * whitespace collapse and the line is trimmed.
 */
export function sanitizeDots(line: string): string {
  return line.replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * One chord: root A-G, optional accidental (# or b), optional quality and
 * extensions (m, min, maj, sus, dim, aug, add, with numbers: Dsus4, Cmaj7, G7,
 * and alterations: F#m7b5, E7#9),
 * optional bass note after a slash (C/G, G/B). Case-sensitive: roots are capitals.
 */
const CHORD = /^[A-G][#b]?(?:maj|min|m|sus|dim|aug|add|M|\+|°|ø)?\d*(?:(?:maj|sus|dim|aug|add|[#b])\d*)*(?:\/[A-G][#b]?)?$/;
/** "No chord" (N.C., NC, N C), normalised; a line of only this is removed like any chord line. */
const NO_CHORD = 'NC';
/** Bar lines and dashes that sit between chords on a chart. */
const CHORD_SPACER = /^[|/\-–—]+$/;

/**
 * Pre-processing 2: a line made only of chords and spacing ("G C/G",
 * "G/B Dsus", "Em C G", "N.C.") is a chord chart line, not lyrics. Run after
 * sanitizeDots so "G. C/G" is already "G C/G".
 */
export function isChordLine(line: string): boolean {
  const tokens = line
    .replace(/[()[\]]/g, ' ')
    // "No chord": N.C. arrives here as "N C" (dots are already spaces), or as NC.
    .replace(/(?<![A-Za-z])N\s?C(?![A-Za-z])/gi, ' NC ')
    .split(/\s+/)
    .filter(Boolean);
  const isChord = (t: string) => CHORD.test(t) || t === NO_CHORD;
  return tokens.some(isChord) && tokens.every((t) => isChord(t) || CHORD_SPACER.test(t));
}

const UNACCENTED: Record<string, string> = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u',
  Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U',
};

/**
 * Pre-processing: accented Spanish vowels lose their accent (á -> a, É -> E).
 * Only these ten characters change: ñ and Ñ are kept exactly as they are.
 */
export function stripVowelAccents(line: string): string {
  return line.replace(/[áéíóúÁÉÍÓÚ]/g, (c) => UNACCENTED[c]);
}

/** Repeat markers in their own brackets: (x4), [x2], (2x), [×3]. */
const BRACKETED_MULTIPLIER = /[[(]\s*(?:[x×]\s*\d+|\d+\s*[x×])\s*[\])]/gi;
/** Bare repeat markers: x2, ×4, 2x (never part of a word: "max2" and "x2y" are left alone). */
const BARE_MULTIPLIER = /(?<![\p{L}\p{N}])(?:[x×]\s?\d+|\d+\s?[x×])(?![\p{L}\p{N}])/giu;

/**
 * Pre-processing 3: repeat markers are removed from labels and lyrics alike
 * ("Lorem ipsum (x4)" -> "Lorem ipsum"). Returns the cleaned line and how many
 * markers were removed.
 */
export function stripMultipliers(line: string): { line: string; removed: number } {
  let removed = 0;
  const count = () => {
    removed++;
    return ' ';
  };
  const cleaned = line.replace(BRACKETED_MULTIPLIER, count).replace(BARE_MULTIPLIER, count);
  return { line: removed ? cleaned.replace(/\s+/g, ' ').trim() : line, removed };
}

export interface Preprocessed {
  lines: string[];
  chordLines: number;
  multipliers: number;
}

/**
 * The pre-processing passes, per line, before any formatting: vowel accents,
 * alignment dots, repeat markers (so "G C (x2)" is recognisably a chord line),
 * then chord lines. A line left empty is kept as a blank line.
 */
export function preprocess(raw: string): Preprocessed {
  let chordLines = 0;
  let multipliers = 0;
  const lines: string[] = [];
  for (const rawLine of raw.replace(/\r\n?/g, '\n').split('\n')) {
    const { line, removed } = stripMultipliers(sanitizeDots(stripVowelAccents(rawLine)));
    multipliers += removed;
    if (line && isChordLine(line)) {
      chordLines++;
      continue;
    }
    lines.push(line);
  }
  return { lines, chordLines, multipliers };
}

/**
 * Obvious metadata, removed wherever it appears (unless the line is a group
 * label), before the [Verse 1] fallback ever sees it: a line fully in
 * [brackets] or (parentheses); one carrying tempo, time-signature, key or
 * credit details ("] by …", "Words and Music by …"); or a roadmap (see
 * isRoadmapLine). Everything else is kept as lyrics.
 */
const METADATA_PATTERNS: RegExp[] = [
  /^\[.*\]$/, // [Default Arrangement], [Lyrics], [Spoken]
  /^\(.*\)$/, // (Key change)
  /\bbpm\b/i, // 70 bpm
  /(?<![\d/])(?:[1-9]|1[0-2])\/(?:2|4|8|16)(?![\d/])/, // 4/4, 6/8, 12/8 (not 24/7)
  /\btempo\b/i,
  /\btime signature\b/i,
  /\bkey\s*:/i, // "Key: G"
  /\bccli\b/i,
  /©|\bcopyright\b/i,
  // Credits: a closing bracket followed by "by" ("[Lorem] by Ipsum Dolor"), or a credit phrase.
  /[\])]\s*by\b/i,
  /\b(?:written|words|music|lyrics|letra|musica|arranged|arr|composed|produced|translated|traducido|adapted)(?:\s+(?:and|&|y)\s+\w+)?\s+by\b/i,
  /\bwords and music\b/i,
  // Spanish credits, only at the start of a line so lyrics like "... musica por ti" stay.
  /^(?:letra|m[uú]sica|arreglos?|autor(?:es)?|traducci[oó]n)(?:\s+(?:y|&)\s+\p{L}+)?\s*:?\s+por(?!\p{L})/iu,
  /[\])]\s*por\b/i,
];

/** "C×2", "B1x2", "V2(x3)": a section abbreviation with a glued repeat marker. */
const GLUED_MULTIPLIER = /\s*\(?\s*[x×]\s*\d+\s*\)?$/i;

/**
 * A roadmap: the arrangement written as a comma-separated list of sections
 * ("Intro, V1, V2, C, V3, C×2, Vamp, B1×2"). At least three items, and nearly
 * all of them (a stray word or "..." is allowed) read as group labels once their
 * repeat markers are removed.
 */
export function isRoadmapLine(line: string): boolean {
  const items = line
    .split(/\s*[,;|/→>]\s*|\s+-\s+/)
    .map((item) => item.replace(GLUED_MULTIPLIER, '').trim())
    .filter(Boolean);
  if (items.length < 3) return false;
  // Labels in a roadmap are short codes ("C", "B1"), so judge each as a label, not as lyrics.
  const sections = items.filter((item) => matchGroup(item.toUpperCase()) !== null).length;
  return sections >= Math.max(3, Math.ceil(items.length * 0.8));
}

export function isMetadataLine(line: string): boolean {
  if (line === '' || matchGroup(line) !== null) return false;
  return METADATA_PATTERNS.some((re) => re.test(line)) || isRoadmapLine(line);
}

/** Title: first line with trailing bracketed metadata ("[Lyrics, 139 bpm]") removed. */
export function cleanTitle(line: string): string {
  let t = line.trim();
  let prev;
  do {
    prev = t;
    t = t.replace(/\s*[[(][^\])[(]*[\])]\s*$/, '').trim();
  } while (t !== prev);
  return t.replace(/\s+/g, ' ');
}

/**
 * Wrap one lyric line to `max` characters at word boundaries, balanced: it
 * uses the fewest lines that fit, then spreads the words so those lines are as
 * even as possible (a 28-character line becomes 14 + 13, not 24 + 4). Words are
 * never split: a single word longer than `max` gets a line of its own (and is reported).
 */
export function wrapLine(line: string, max = MAX_LINE): { lines: string[]; longWord: string | null } {
  const words = line.trim().split(/\s+/).filter(Boolean);
  const n = words.length;
  const longWord = words.find((w) => w.length > max) ?? null;
  if (!n) return { lines: [], longWord };

  // Length of words[a..b) joined by single spaces; a lone over-long word is allowed.
  const prefix = [0];
  for (const w of words) prefix.push(prefix[prefix.length - 1] + w.length);
  const width = (a: number, b: number) => prefix[b] - prefix[a] + (b - a - 1);
  const fits = (a: number, b: number) => width(a, b) <= max || b - a === 1;

  // Fewest lines possible: a greedy fill finds the count (not the breaks).
  let lineCount = 1;
  for (let a = 0, b = 1; b <= n; b++) {
    if (!fits(a, b)) {
      lineCount++;
      a = b - 1;
    }
  }
  if (lineCount === 1) return { lines: [words.join(' ')], longWord };

  // Exactly lineCount lines, minimising the sum of squared lengths: the most even split.
  // cost[k][i]: best cost for words[0..i) on k lines; from[k][i]: where line k starts.
  const cost = Array.from({ length: lineCount + 1 }, () => new Array<number>(n + 1).fill(Infinity));
  const from = Array.from({ length: lineCount + 1 }, () => new Array<number>(n + 1).fill(0));
  cost[0][0] = 0;
  for (let k = 1; k <= lineCount; k++) {
    for (let i = 1; i <= n; i++) {
      for (let a = i - 1; a >= 0 && fits(a, i); a--) {
        const c = cost[k - 1][a] + width(a, i) ** 2;
        // <= keeps the earliest start among ties, so when two splits are equally even the extra word goes below.
        if (c <= cost[k][i]) {
          cost[k][i] = c;
          from[k][i] = a;
        }
      }
    }
  }
  const lines: string[] = [];
  for (let k = lineCount, i = n; k > 0; k--) {
    const a = from[k][i];
    lines.unshift(words.slice(a, i).join(' '));
    i = a;
  }
  return { lines, longWord };
}

/** Cost weights for chunking: fewest slides first, never a one-line slide if avoidable. */
const SPLIT_PHRASE_COST = 3;
/** Two stanzas on one slide: allowed, but a separate slide per stanza is preferred. */
const STANZA_CROSS_COST = 2;
const ONE_LINE_COST = 10;

/**
 * Split a section into chunks of 2 or 3 lines. `phrases` are the wrapped pieces
 * of each source line; a chunk boundary inside a phrase (one lyric line spread
 * over two slides) is avoided unless it is the only way to keep every chunk at
 * 2–3 lines. `stanzaStarts` (line indexes) are preferred chunk boundaries: a
 * slide mixing two stanzas costs a little. Among equal options, uses the fewest chunks.
 */
export function chunkPhrases(phrases: string[][], stanzaStarts: ReadonlySet<number> = new Set()): string[][] {
  const lines = phrases.flat();
  const n = lines.length;
  if (n <= 3) return n ? [lines] : [];

  // Line indexes where a phrase ends: chunk boundaries there keep phrases whole.
  const phraseEnds = new Set<number>();
  let at = 0;
  for (const p of phrases) phraseEnds.add((at += p.length));

  // best[i]: cheapest way to chunk lines[i..]; next[i]: size of the chunk starting at i.
  const best = new Array<number>(n + 1).fill(Infinity);
  const next = new Array<number>(n + 1).fill(0);
  best[n] = 0;
  for (let i = n - 1; i >= 0; i--) {
    for (const size of [3, 2, 1]) {
      const end = i + size;
      if (end > n) continue;
      let crossesStanza = false;
      for (let k = i + 1; k < end; k++) if (stanzaStarts.has(k)) crossesStanza = true;
      const cost =
        1 +
        best[end] +
        (phraseEnds.has(end) ? 0 : SPLIT_PHRASE_COST) +
        (crossesStanza ? STANZA_CROSS_COST : 0) +
        (size === 1 ? ONE_LINE_COST : 0);
      if (cost < best[i]) {
        best[i] = cost;
        next[i] = size;
      }
    }
  }
  const out: string[][] = [];
  for (let i = 0; i < n; i += next[i]) out.push(lines.slice(i, i + next[i]));
  return out;
}

/**
 * Every song opens on a blank slide. ProPresenter drops an empty group, so it
 * carries a single period, which the operator removes after importing.
 */
export const OPENING_BLANK = '[Blank]\n.';

export interface FormatOptions {
  /**
   * Only used when the title is missing (the first line is a group label):
   * a typed title to use instead, or null to leave the Title line out.
   */
  title?: string | null;
}

export interface FormatResult {
  text: string;
  title: string;
  /**
   * The first line is a group label, so the song has no title line. Nothing is
   * formatted until the caller passes `title` (a typed title, or null to skip).
   */
  missingTitle: boolean;
  /** Groups in output order, one entry per section in the source (before chunking). */
  groups: MasterGroup[];
  warnings: string[];
}

/** True when a line is a group label (Verse 1, Coro, …), not a song title. */
const isGroupLabel = (line: string) => matchGroup(line) !== null;

/** A typed title gets the same treatment as one read from the text. */
const cleanTypedTitle = (title: string) => stripVowelAccents(title).replace(/\s+/g, ' ').trim();

export function formatSong(raw: string, options: FormatOptions = {}): FormatResult {
  const { lines, chordLines, multipliers } = preprocess(raw);
  const warnings: string[] = [];
  if (chordLines) warnings.push(`Removed ${chordLines} chord line${chordLines === 1 ? '' : 's'}.`);
  if (multipliers) warnings.push(`Removed ${multipliers} repeat marker${multipliers === 1 ? '' : 's'} (x2, ×4, …).`);

  const firstIndex = lines.findIndex((l) => l.trim());
  if (firstIndex === -1) return { text: '', title: '', missingTitle: false, groups: [], warnings };

  // A first line that reads as a group label means the title is missing: that
  // line is the song's first section, not a title to strip.
  const missingTitle = isGroupLabel(lines[firstIndex]);
  if (missingTitle && options.title === undefined) {
    return { text: '', title: '', missingTitle, groups: [], warnings };
  }
  const title = missingTitle ? (options.title ? cleanTypedTitle(options.title) : '') : cleanTitle(lines[firstIndex]);
  const titleIndex = missingTitle ? firstIndex - 1 : firstIndex;

  // Sections: each recognised group label starts one; everything before the
  // first one (credits, keys, bpm, "Lyrics" headers) is metadata and dropped.
  // Read top to bottom. A group label starts a section; lyrics before any label
  // start [Verse 1]; blank lines mark stanza breaks inside the current section;
  // obvious metadata (see isMetadataLine) is dropped wherever it appears.
  const sections: Section[] = [];
  let metadata = 0;
  let fellBack = false;
  let stanzaBreak = false;
  for (const raw of lines.slice(titleIndex + 1)) {
    const line = raw.trim().replace(/\s+/g, ' ');
    const match = matchGroup(line);
    const current = sections[sections.length - 1];
    if (match && 'group' in match) {
      // The same group labelled again straight away ("Chorus" ... "Chorus x2")
      // continues it: one tag per group, not per stanza.
      if (current?.group !== match.group) sections.push({ group: match.group, body: [] });
      stanzaBreak = true;
      continue;
    }
    if (!line) {
      stanzaBreak = true;
      continue;
    }
    if (match && 'unsupported' in match) {
      warnings.push(
        `"${line}" looks like ${match.unsupported}, which isn't one of the groups, so its lines stay under [${current?.group ?? 'Verse 1'}].`
      );
      stanzaBreak = true;
      continue;
    }
    if (isMetadataLine(line)) {
      metadata++;
      continue;
    }
    let section = current;
    if (!section) {
      // Lyrics before any group label: they start the song as [Verse 1].
      section = { group: 'Verse 1', body: [] };
      sections.push(section);
      fellBack = true;
    }
    if (stanzaBreak && section.body.length) section.body.push(STANZA_BREAK);
    stanzaBreak = false;
    section.body.push(line);
  }

  if (fellBack) warnings.push('Lyrics came before any group label, so they start under [Verse 1].');
  if (metadata) warnings.push(`Removed ${metadata} line${metadata === 1 ? '' : 's'} of metadata (brackets, bpm, 4/4, key, credits, roadmap).`);
  if (!sections.length) warnings.push('No lyrics were found below the title.');

  const kept = pruneEmptyGroups(sections);
  for (const group of kept.removed) warnings.push(`Removed [${group}]: it had no lyrics under it.`);

  // The inserted opening [Blank] is added here, after pruning, so it is never pruned.
  const blocks: string[] = [OPENING_BLANK];
  for (const { group, body } of kept.sections) {
    const phrases: string[][] = [];
    // Wrapped-line indexes where a new stanza begins, so chunks prefer not to straddle stanzas.
    const stanzaStarts = new Set<number>();
    let lineCount = 0;
    for (const line of body) {
      if (line === STANZA_BREAK) {
        stanzaStarts.add(lineCount);
        continue;
      }
      const { lines: w, longWord } = wrapLine(line);
      if (longWord) warnings.push(`"${longWord}" is longer than ${MAX_LINE} characters; it has a line of its own rather than being split.`);
      phrases.push(w);
      lineCount += w.length;
    }
    const chunks = chunkPhrases(phrases, stanzaStarts);
    if (chunks.some((c) => c.length === 1)) warnings.push(`[${group}] has a slide with only one line.`);
    // Tag once; chunks after the first are separated by a blank line only.
    blocks.push([`[${group}]`, chunks.map((c) => c.join('\n')).join('\n\n')].filter(Boolean).join('\n'));
  }

  // Absolute last step: everything in capitals. toUpperCase keeps ñ as Ñ.
  // Skipped title: no Title line at all, the song opens on [Blank].
  const text = [...(title ? [`Title: ${title}`] : []), ...blocks].join('\n\n').toUpperCase();
  return { text, title, missingTitle, groups: kept.sections.map((s) => s.group), warnings };
}

/** Marks a stanza break (a blank line in the source) inside a section's body. */
const STANZA_BREAK = '';

interface Section {
  group: MasterGroup;
  /** Lyric lines, with STANZA_BREAK between stanzas. */
  body: string[];
}

/**
 * Drop every group with no lyric lines under it (a stray [Tag] at the end, an
 * [Instrumental] label). Two sections of the same group left side by side
 * then merge, so the tag still appears once. Runs on the song's own groups
 * only: the opening [Blank] and its period are added afterwards.
 */
export function pruneEmptyGroups(sections: Section[]): { sections: Section[]; removed: MasterGroup[] } {
  const removed: MasterGroup[] = [];
  const out: Section[] = [];
  for (const section of sections) {
    if (!section.body.some((l) => l !== STANZA_BREAK)) {
      removed.push(section.group);
      continue;
    }
    const prev = out[out.length - 1];
    if (prev?.group === section.group) prev.body.push(STANZA_BREAK, ...section.body);
    else out.push({ group: section.group, body: [...section.body] });
  }
  return { sections: out, removed };
}
