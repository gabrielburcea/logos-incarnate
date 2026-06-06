/**
 * Meaning service — loads the static JSON bundles in /public/meaning/ and
 * resolves Strong's-number → lexicon entry, English-word → Strong's, and
 * Strong's → occurrence list.
 *
 * Data layout (built by scripts/build-meaning-bundle.mjs):
 *   /meaning/hebrew-lexicon.json   H#### → { lemma, translit, definition }
 *   /meaning/greek-lexicon.json    G#### → { lemma, translit, definition }
 *   /meaning/verses/<BOOK>.json    "ch.vs" → ["H123", "H456", ...]
 *   /meaning/alignments/KJV.json   "BOOK.CH.VS" → { "english": ["H123"], ... }
 *   /meaning/occurrences.json      "H####" → ["BOOK.CH.VS", ...]
 *
 * Everything is loaded lazily and cached forever in module-level Maps.
 * No server, no API — just static fetches against the user's own host.
 */

export interface LexiconEntry {
  /** The original Hebrew or Greek word in its native script, e.g. עֵזֶר */
  lemma: string;
  /** The transliteration into Latin script, e.g. ʻêzer */
  translit: string;
  /** A concise English definition, e.g. "aid" */
  definition: string;
  /** Comma-list of KJV renderings, e.g. "finish, pay, accomplish". */
  kjvDef?: string;
  /** Number of verses the lemma appears in (precomputed at build time). */
  count?: number;
}

/** One inflected form of a word: its surface, translit, and the verses it appears in. */
export interface FormBucket {
  /** Surface form in the original script, e.g. τετέλεσται */
  f: string;
  /** Transliteration of the form, e.g. tetelestai */
  t: string;
  /** Verse refs where this exact form occurs, e.g. ["JHN.19.28", "JHN.19.30"] */
  r: string[];
}

/** strongs → morph-code → form bucket. */
export type FormOccurrences = Record<string, Record<string, FormBucket>>;

/** A resolved form for one clicked word, ready for the popover. */
export interface ResolvedForm {
  /** Surface form, e.g. τετέλεσται */
  form: string;
  /** Transliteration, e.g. tetelestai */
  translit: string;
  /** Raw morph code, e.g. "V-RPI-3S" (not shown to the user). */
  morph: string;
  /** Verses where THIS exact form occurs. */
  refs: string[];
  /** Plain-English note about the form's tense/aspect, or null. */
  note: string | null;
}

/** Per-verse alignment between English words (lowercase) and Strong's numbers. */
export type VerseAlignment = Record<string, string[]>;

// ---------- Module-level caches ----------------------------------------
let hebrewLexiconCache: Record<string, LexiconEntry> | null = null;
let hebrewLexiconPromise: Promise<Record<string, LexiconEntry>> | null = null;

let greekLexiconCache: Record<string, LexiconEntry> | null = null;
let greekLexiconPromise: Promise<Record<string, LexiconEntry>> | null = null;

let occurrencesCache: Record<string, string[]> | null = null;
let occurrencesPromise: Promise<Record<string, string[]>> | null = null;

const alignmentByTranslation = new Map<string, Promise<Record<string, VerseAlignment>>>();
const versesByBook = new Map<string, Promise<Record<string, string[]>>>();

// ---------- Fetch helpers ----------------------------------------------
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status}`);
  }
  return (await res.json()) as T;
}

// ---------- Public API --------------------------------------------------
/** Get the Hebrew lexicon. Loaded once; subsequent calls return the cache. */
export async function getHebrewLexicon(): Promise<Record<string, LexiconEntry>> {
  if (hebrewLexiconCache) return hebrewLexiconCache;
  if (!hebrewLexiconPromise) {
    hebrewLexiconPromise = fetchJson<Record<string, LexiconEntry>>(
      '/meaning/hebrew-lexicon.json',
    ).then((data) => {
      hebrewLexiconCache = data;
      return data;
    });
  }
  return hebrewLexiconPromise;
}

/** Get the Greek lexicon. Loaded once; subsequent calls return the cache. */
export async function getGreekLexicon(): Promise<Record<string, LexiconEntry>> {
  if (greekLexiconCache) return greekLexiconCache;
  if (!greekLexiconPromise) {
    greekLexiconPromise = fetchJson<Record<string, LexiconEntry>>(
      '/meaning/greek-lexicon.json',
    ).then((data) => {
      greekLexiconCache = data;
      return data;
    });
  }
  return greekLexiconPromise;
}

/**
 * Look up a single Strong's-number entry. Returns null if not found
 * (e.g. unrecognized number, or lexicon hasn't loaded yet — call
 * getHebrewLexicon()/getGreekLexicon() first if you need it synchronously).
 */
export async function getLexiconEntry(strongs: string): Promise<LexiconEntry | null> {
  if (!strongs) return null;
  const head = strongs[0]?.toUpperCase();
  if (head === 'H') {
    const lex = await getHebrewLexicon();
    return lex[strongs] ?? null;
  }
  if (head === 'G') {
    const lex = await getGreekLexicon();
    return lex[strongs] ?? null;
  }
  return null;
}

/**
 * Get the per-verse alignment for one translation. The KJV alignment is the
 * "anchor" — for any other translation, runtime fuzzy matching against KJV
 * is what powers the ⓘ icons (see findStrongsForWord below).
 */
export async function getAlignment(
  translation: 'KJV',
): Promise<Record<string, VerseAlignment>> {
  const cached = alignmentByTranslation.get(translation);
  if (cached) return cached;
  const promise = fetchJson<Record<string, VerseAlignment>>(
    `/meaning/alignments/${translation}.json`,
  );
  alignmentByTranslation.set(translation, promise);
  return promise;
}

/**
 * Get the per-verse Strong's lists for one book. Used to surface the verse
 * boundary even when no individual word can be matched.
 */
export async function getVerseStrongs(
  bookId: string,
): Promise<Record<string, string[]>> {
  const cached = versesByBook.get(bookId);
  if (cached) return cached;
  const promise = fetchJson<Record<string, string[]>>(
    `/meaning/verses/${bookId}.json`,
  );
  versesByBook.set(bookId, promise);
  return promise;
}

/**
 * Get the occurrence list for a single Strong's number — every verse in the
 * Bible where that original word appears.
 *
 * Returns refs in "BOOK.CH.VS" format, e.g. ["GEN.2.18", "GEN.2.20", ...].
 */
export async function getOccurrences(strongs: string): Promise<string[]> {
  if (!occurrencesCache) {
    if (!occurrencesPromise) {
      occurrencesPromise = fetchJson<Record<string, string[]>>(
        '/meaning/occurrences.json',
      ).then((data) => {
        occurrencesCache = data;
        return data;
      });
    }
    await occurrencesPromise;
  }
  return occurrencesCache?.[strongs] ?? [];
}

/**
 * Find the Strong's number for a given English word in a verse.
 *
 * - For KJV the alignment file gives an exact answer.
 * - For other translations (WEB today; ESV/NIV later if licensed) we use
 *   the KJV alignment as a "lemma bridge": if the same English word appears
 *   in the KJV alignment for the same verse, we trust that mapping. This
 *   covers ~70-85% of words; for the rest we silently return null rather
 *   than guessing wrong.
 *
 * @param verseRef   e.g. "GEN.2.18"
 * @param englishWord lowercase English word
 * @returns Strong's number, or null if no confident match
 */
export async function findStrongsForWord(
  verseRef: string,
  englishWord: string,
): Promise<string | null> {
  if (!englishWord) return null;
  const word = englishWord.toLowerCase();
  const kjv = await getAlignment('KJV');
  const verse = kjv[verseRef];
  if (!verse) return null;
  const codes = verse[word];
  if (codes && codes.length > 0) return codes[0];
  return null;
}

// ---------- Form occurrences (the τετέλεσται feature) -------------------
let formOccCache: FormOccurrences | null = null;
let formOccPromise: Promise<FormOccurrences> | null = null;

/** Load the form-occurrence index. ~8 MB; lazy, fetched on first hover. */
export async function getFormOccurrences(): Promise<FormOccurrences> {
  if (formOccCache) return formOccCache;
  if (!formOccPromise) {
    formOccPromise = fetchJson<FormOccurrences>(
      '/meaning/form-occurrences.json',
    ).then((data) => {
      formOccCache = data;
      return data;
    });
  }
  return formOccPromise;
}

/**
 * Resolve the exact inflected form for a clicked word.
 *
 * Given a Strong's number and the verse it was clicked in, we find which
 * morphological form is used *here* by locating the morph bucket whose verse
 * list contains this reference. That yields the surface form (τετέλεσται),
 * its transliteration (tetelestai), and the OTHER verses sharing that exact
 * form — e.g. for John 19:30 the perfect-passive appears only in John 19:28
 * and 19:30.
 */
export async function resolveForm(
  strongs: string,
  verseRef: string,
): Promise<ResolvedForm | null> {
  const all = await getFormOccurrences();
  const byMorph = all[strongs];
  if (!byMorph) return null;

  // Find the morph bucket whose verse list contains this reference.
  let chosenMorph: string | null = null;
  let chosenBucket: FormBucket | null = null;
  for (const [morph, bucket] of Object.entries(byMorph)) {
    if (bucket.r.includes(verseRef)) {
      chosenMorph = morph;
      chosenBucket = bucket;
      break;
    }
  }

  // Fallback: verse not catalogued for this Strong's (rare) — take the most
  // frequent form so the card still shows the lemma's typical surface.
  if (!chosenBucket) {
    for (const [morph, bucket] of Object.entries(byMorph)) {
      if (!chosenBucket || bucket.r.length > chosenBucket.r.length) {
        chosenMorph = morph;
        chosenBucket = bucket;
      }
    }
  }
  if (!chosenBucket || !chosenMorph) return null;

  return {
    form: chosenBucket.f,
    translit: chosenBucket.t,
    morph: chosenMorph,
    refs: chosenBucket.r,
    note: formNote(chosenMorph),
  };
}

// ---------- Tense / aspect notes ---------------------------------------
/**
 * Turn a raw morph code into one plain-English sentence about the form's
 * tense/aspect. Returns null for parts of speech where it doesn't apply
 * (nouns, particles) or codes we don't confidently parse.
 *
 * We deliberately avoid grammar jargon ("perfect passive indicative 3sg")
 * per the product's reading-first principle — just what it *means*.
 */
export function formNote(morph: string): string | null {
  if (!morph) return null;
  if (/^V-/.test(morph)) return greekVerbNote(morph); // Greek verb
  if (/^HV/.test(morph)) return hebrewVerbNote(morph); // Hebrew verb
  return null;
}

function greekVerbNote(morph: string): string | null {
  // "V-RPI-3S" → parts[1] = "RPI"; "V-2AAI-3S" → "2AAI".
  const parts = morph.split('-');
  if (parts.length < 2) return null;
  const tvm = parts[1].replace(/^[0-9]+/, ''); // strip 2nd-aorist marker
  const tense = tvm[0];
  const voice = tvm[1];
  switch (tense) {
    case 'P':
      return 'Present — pictures the action as ongoing or habitual.';
    case 'I':
      return 'Imperfect — continuous or repeated action in the past.';
    case 'F':
      return 'Future — action still to come.';
    case 'A':
      return 'Aorist — the action as a single, completed event.';
    case 'R':
      return voice === 'P'
        ? 'Perfect passive — a completed action whose result still stands.'
        : 'Perfect — a completed action with continuing results.';
    case 'L':
      return 'Pluperfect — a past action whose effects continued to a later point.';
    default:
      return null;
  }
}

function hebrewVerbNote(morph: string): string | null {
  // "HVqp3ms" → [0]H [1]V [2]stem [3]aspect. We only speak to aspect, and
  // only for the two we can read with confidence, to avoid wrong grammar.
  const aspect = morph[3];
  switch (aspect) {
    case 'p':
      return 'Hebrew perfect — views the action as a complete whole.';
    case 'i':
      return 'Hebrew imperfect — views the action as ongoing or unfinished.';
    default:
      return null;
  }
}
