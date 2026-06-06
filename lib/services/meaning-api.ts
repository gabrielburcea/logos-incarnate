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
