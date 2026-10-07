/**
 * Song Formatter: turns raw copied lyrics into slide-ready text.
 *
 *   Title: <Clean Name>
 *
 *   [Group]
 *   line (max 25 chars)
 *   line
 *
 * Pre-processing: alignment dots become spaces, and chord-only lines are removed.
 * Rules: the first line is the title (trailing [..] / (..) metadata removed);
 * everything before the first recognised group label is dropped; group labels
 * (English, Spanish, abbreviations, typos, multipliers) map to a fixed set of
 * master groups; body lines wrap at word boundaries to 25 characters and are
 * split into chunks of 2–3 lines (keeping each lyric line's wrapped pieces
 * together where possible), each under its own copy of the group label.
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
      ['chorus', ['chorus', 'choruses', 'coro', 'coros', 'ch', 'cho', 'chor', 'chrs', 'chs', 'c', 'crs', 'chorous', 'chrous', 'chours', 'chorsu', 'corus', 'courus', 'cohrus', 'estribillo']],
      ['prechorus', ['prechorus', 'pre chorus', 'pre coro', 'precoro', 'pre estribillo', 'pc', 'pch', 'pre ch', 'pre', 'prechrous', 'pre chrous', 'pre chours', 'prechours', 'pre corus', 'pre chorous']],
      ['bridge', ['bridge', 'bridges', 'puente', 'br', 'brdg', 'brg', 'bdg', 'b', 'brige', 'brigde', 'bridg', 'birdge', 'bridgde', 'puenta', 'puemte']],
      ['tag', ['tag', 'tags', 'tg', 'end tag', 'final tag', 'tag final']],
      ['intro', ['intro', 'introduccion', 'introduction', 'entrada', 'int', 'itnro', 'inro', 'intor']],
      ['outro', ['outro', 'final', 'salida', 'ending', 'end', 'coda', 'out', 'outr', 'otro outro', 'ourto']],
      ['outroBridge', ['outro bridge', 'bridge outro', 'final bridge', 'ending bridge', 'puente final', 'outro puente']],
      ['blank', ['blank', 'instrumental', 'inst', 'interlude', 'interludio', 'break', 'solo', 'musica', 'music', 'pausa']],
      ['vamp', ['vamp', 'vamps', 'vamp out', 'vamping']],
      ['bridgeTag', ['bridge tag', 'tag bridge', 'puente tag', 'tag puente']],
      ['refrain', ['refrain', 'refran', 'refrian', 'refrains']],
    ] as [Base, string[]][]
  ).flatMap(([base, labels]) => labels.map((l) => [l, base] as const))
);

/**
 * Labels that are also ordinary words or letters. Only treated as a group when
 * the line looks like a label: [bracketed], (parenthesised), "Ending:", or ALL CAPS.
 */
const AMBIGUOUS = new Set(['v', 'c', 'b', 'end', 'final', 'out', 'break', 'solo', 'music', 'musica', 'pausa', 'entrada', 'salida']);

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
  ['estrofa', 'verse'], ['verso', 'verse'], ['estribillo', 'chorus'], ['interlude', 'blank'],
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
/** Bar lines and dashes that sit between chords on a chart. */
const CHORD_SPACER = /^[|/\-–—]+$/;

/**
 * Pre-processing 2: a line made only of chords and spacing ("G C/G",
 * "G/B Dsus", "Em C G") is a chord chart line, not lyrics. Run after
 * sanitizeDots so "G. C/G" is already "G C/G".
 */
export function isChordLine(line: string): boolean {
  const tokens = line.split(/\s+/).filter(Boolean).map((t) => t.replace(/^\((.*)\)$/, '$1'));
  return tokens.some((t) => CHORD.test(t)) && tokens.every((t) => CHORD.test(t) || CHORD_SPACER.test(t));
}

export interface Preprocessed {
  lines: string[];
  chordLines: number;
}

/** Both pre-processing passes, in order, before any formatting. */
export function preprocess(raw: string): Preprocessed {
  let chordLines = 0;
  const lines: string[] = [];
  for (const rawLine of raw.replace(/\r\n?/g, '\n').split('\n')) {
    const line = sanitizeDots(rawLine);
    if (line && isChordLine(line)) {
      chordLines++;
      continue;
    }
    lines.push(line);
  }
  return { lines, chordLines };
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
 * Wrap one lyric line to `max` characters at word boundaries. Words are never
 * split: a single word longer than `max` gets a line of its own (and is reported).
 */
export function wrapLine(line: string, max = MAX_LINE): { lines: string[]; longWord: string | null } {
  const words = line.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  let longWord: string | null = null;
  for (const word of words) {
    if (word.length > max) longWord ??= word;
    if (!current) current = word;
    else if (current.length + 1 + word.length <= max) current += ` ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return { lines, longWord };
}

/** Cost weights for chunking: fewest slides first, never a one-line slide if avoidable. */
const SPLIT_PHRASE_COST = 3;
const ONE_LINE_COST = 10;

/**
 * Split a section into chunks of 2 or 3 lines. `phrases` are the wrapped pieces
 * of each source line; a chunk boundary inside a phrase (one lyric line spread
 * over two slides) is avoided unless it is the only way to keep every chunk at
 * 2–3 lines. Among equal options, uses the fewest chunks.
 */
export function chunkPhrases(phrases: string[][]): string[][] {
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
      const cost = 1 + best[end] + (phraseEnds.has(end) ? 0 : SPLIT_PHRASE_COST) + (size === 1 ? ONE_LINE_COST : 0);
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

export interface FormatResult {
  text: string;
  title: string;
  /** Groups in output order, one entry per section in the source (before chunking). */
  groups: MasterGroup[];
  warnings: string[];
}

export function formatSong(raw: string): FormatResult {
  const { lines, chordLines } = preprocess(raw);
  const warnings: string[] = [];
  if (chordLines) warnings.push(`Removed ${chordLines} chord line${chordLines === 1 ? '' : 's'}.`);

  const titleIndex = lines.findIndex((l) => l.trim());
  if (titleIndex === -1) return { text: '', title: '', groups: [], warnings };
  const title = cleanTitle(lines[titleIndex]);

  // Sections: each recognised group label starts one; everything before the
  // first one (credits, keys, bpm, "Lyrics" headers) is metadata and dropped.
  const sections: { group: MasterGroup; body: string[] }[] = [];
  let purged = 0;
  for (const raw of lines.slice(titleIndex + 1)) {
    const line = raw.trim();
    const match = matchGroup(line);
    if (match && 'group' in match) {
      sections.push({ group: match.group, body: [] });
      continue;
    }
    const current = sections[sections.length - 1];
    if (!current) {
      if (line) purged++;
      continue;
    }
    if (match && 'unsupported' in match) {
      warnings.push(`"${line}" looks like ${match.unsupported}, which isn't one of the groups, so its lines stay under [${current.group}].`);
      continue;
    }
    if (!line) continue;
    // Bracketed notes that aren't groups ("[Spoken]", "(Key change)") are directions, not lyrics.
    if (/^[[(].*[\])]$/.test(line)) {
      warnings.push(`Removed the note "${line}" from [${current.group}].`);
      continue;
    }
    current.body.push(line.replace(/\s+/g, ' '));
  }

  if (!sections.length) {
    warnings.push('No group labels (Verse, Chorus, Coro, …) were found, so there is nothing to format below the title.');
  } else if (purged) {
    warnings.push(`Removed ${purged} line${purged === 1 ? '' : 's'} of metadata between the title and the first group.`);
  }

  const blocks: string[] = [];
  for (const { group, body } of sections) {
    const phrases: string[][] = [];
    for (const line of body) {
      const { lines: w, longWord } = wrapLine(line);
      if (longWord) warnings.push(`"${longWord}" is longer than ${MAX_LINE} characters; it has a line of its own rather than being split.`);
      phrases.push(w);
    }
    const chunks = chunkPhrases(phrases);
    if (chunks.some((c) => c.length === 1)) warnings.push(`[${group}] has a slide with only one line.`);
    if (!chunks.length) blocks.push(`[${group}]`);
    for (const chunk of chunks) blocks.push([`[${group}]`, ...chunk].join('\n'));
  }

  const text = [`Title: ${title}`, ...blocks].join('\n\n');
  return { text, title, groups: sections.map((s) => s.group), warnings };
}
