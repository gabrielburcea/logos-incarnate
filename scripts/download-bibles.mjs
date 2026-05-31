#!/usr/bin/env node
/**
 * Pre-fetch public-domain / freely-licensed Bible translations from API.Bible
 * and write them into `public/bibles/<ABBR>/` so the app can read them as
 * static assets at runtime (instant loads, no rate limits, works offline).
 *
 * Usage:
 *   1) Make sure NEXT_PUBLIC_BIBLE_API_KEY is set in .env.local (it already is).
 *   2) `npm run download:bibles`
 *
 * Output layout:
 *   public/bibles/KJV/manifest.json    (list of books)
 *   public/bibles/KJV/GEN.json         (all chapters of Genesis)
 *   public/bibles/KJV/EXO.json
 *   ...
 *   public/bibles/WEB/...
 *   public/bibles/BSB/...
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_ROOT = path.join(ROOT, 'public', 'bibles');

// ---- Configuration ---------------------------------------------------------
// Try a small chain of candidate IDs per translation, since different
// API.Bible accounts have access to different versions. The first ID that
// returns books successfully wins.
const TRANSLATIONS = [
  {
    abbr: 'KJV',
    name: 'King James Version',
    candidates: ['de4e12af7f28f599-02', 'de4e12af7f28f599-01'],
  },
  {
    abbr: 'WEB',
    name: 'World English Bible',
    candidates: ['9879dbb7cfe39e4d-04', '9879dbb7cfe39e4d-01'],
  },
  // BSB (Berean Standard Bible) is intentionally omitted here — it isn't
  // distributed through this API.Bible account. To bundle BSB, fetch it from
  // https://bereanbible.com (CC0) and emit the same on-disk shape.
];

// Optional CLI filter: `npm run download:bibles -- KJV` runs only KJV.
const ONLY = process.argv.slice(2).map((a) => a.toUpperCase());
const SELECTED = ONLY.length
  ? TRANSLATIONS.filter((t) => ONLY.includes(t.abbr))
  : TRANSLATIONS;

const API_BASE = 'https://rest.api.bible/v1';

// Light reader of .env.local so we don't require dotenv.
async function loadEnvLocal() {
  if (process.env.NEXT_PUBLIC_BIBLE_API_KEY) return;
  try {
    const env = await fs.readFile(path.join(ROOT, '.env.local'), 'utf8');
    for (const line of env.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
      if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {
    /* fine — assume env already populated */
  }
}

await loadEnvLocal();

const API_KEY =
  process.env.NEXT_PUBLIC_BIBLE_API_KEY ||
  process.env.BIBLE_API_KEY ||
  '';

if (!API_KEY) {
  console.error('Missing API key. Set NEXT_PUBLIC_BIBLE_API_KEY in .env.local.');
  process.exit(1);
}

// ---- HTTP helpers ----------------------------------------------------------
const headers = () => ({
  'api-key': process.env.NEXT_PUBLIC_BIBLE_API_KEY || API_KEY,
  Accept: 'application/json',
});

async function getJson(url) {
  const r = await fetch(url, { headers: headers() });
  if (!r.ok) {
    throw new Error(`${r.status} ${r.statusText} — ${url}`);
  }
  return r.json();
}

async function withRetry(fn, attempts = 3, delayMs = 600) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((res) => setTimeout(res, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

async function pickValidId(translation) {
  for (const id of translation.candidates) {
    try {
      const data = await getJson(`${API_BASE}/bibles/${id}/books`);
      if (data?.data?.length > 0) return id;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function getBooks(bibleId) {
  const data = await getJson(`${API_BASE}/bibles/${bibleId}/books`);
  return data.data || [];
}

async function getChapters(bibleId, bookId) {
  const data = await getJson(`${API_BASE}/bibles/${bibleId}/books/${bookId}/chapters`);
  return (data.data || []).filter((c) => c.number !== 'intro');
}

async function getChapter(bibleId, chapterId) {
  const data = await getJson(
    `${API_BASE}/bibles/${bibleId}/chapters/${chapterId}` +
      `?content-type=html&include-notes=false&include-titles=true` +
      `&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`
  );
  return data.data;
}

async function getIntro(bibleId, bookId) {
  try {
    return await getChapter(bibleId, `${bookId}.intro`);
  } catch {
    return null;
  }
}

// ---- Concurrency-limited mapper -------------------------------------------
async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

// ---- Main per-translation processor ---------------------------------------
async function processTranslation(translation) {
  console.log(`\n=== ${translation.abbr} (${translation.name}) ===`);
  const id = await pickValidId(translation);
  if (!id) {
    console.warn(
      `  Skipped: no accessible bible id (your API key may not include ${translation.abbr}).`
    );
    return false;
  }
  console.log(`  Using API.Bible id: ${id}`);

  const outDir = path.join(OUT_ROOT, translation.abbr);
  await fs.mkdir(outDir, { recursive: true });

  const books = await getBooks(id);
  console.log(`  Books: ${books.length}`);

  let totalChapters = 0;
  for (const book of books) {
    const bookId = book.id;
    const bookOutPath = path.join(outDir, `${bookId}.json`);
    // Resume support: skip books already on disk.
    try {
      const existing = await fs.readFile(bookOutPath, 'utf8');
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
        totalChapters += parsed.chapters.length;
        process.stdout.write(`    ${bookId.padEnd(4)} ${book.name.padEnd(22)} ${parsed.chapters.length}ch (cached)\n`);
        continue;
      }
    } catch { /* not cached — fetch it */ }

    const chapters = await getChapters(id, bookId);
    if (chapters.length === 0) {
      console.warn(`    ${bookId}: no chapters`);
      continue;
    }

    const intro = await getIntro(id, bookId);

    // Pull chapters concurrently (gentle on the API).
    const chapterDocs = await mapLimit(chapters, 6, async (ch) => {
      const full = await withRetry(() => getChapter(id, ch.id));
      let content = full.content || '';
      if (intro && ch.number === '1') {
        content = (intro.content || '') + content;
      }
      return {
        id: ch.id,
        number: ch.number,
        reference: ch.reference,
        content,
        verseCount: full.verseCount || 0,
      };
    });

    const bookDoc = {
      id: bookId,
      name: book.name,
      nameLong: book.nameLong || book.name,
      copyright: '',
      chapters: chapterDocs,
    };

    await fs.writeFile(
      bookOutPath,
      JSON.stringify(bookDoc)
    );
    totalChapters += chapterDocs.length;
    process.stdout.write(`    ${bookId.padEnd(4)} ${book.name.padEnd(22)} ${chapterDocs.length}ch\n`);
  }

  const manifest = {
    id: `local:${translation.abbr}`,
    name: translation.name,
    abbreviation: translation.abbr,
    description: `${translation.name} (bundled)`,
    language: { id: 'eng', name: 'English' },
    books: books.map((b) => ({
      id: b.id,
      name: b.name,
      nameLong: b.nameLong || b.name,
      abbreviation: b.abbreviation || b.id,
    })),
  };
  await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`  ✓ ${translation.abbr}: ${books.length} books, ${totalChapters} chapters`);
  return true;
}

// ---- Entry -----------------------------------------------------------------
(async () => {
  await fs.mkdir(OUT_ROOT, { recursive: true });

  let succeeded = 0;
  for (const t of SELECTED) {
    try {
      const ok = await processTranslation(t);
      if (ok) succeeded++;
    } catch (err) {
      console.error(`  ✗ ${t.abbr} failed:`, err.message);
    }
  }

  console.log(`\nDone. ${succeeded}/${SELECTED.length} translations bundled.`);
  if (succeeded < SELECTED.length) {
    console.log(
      'Tip: missing translations usually mean your API.Bible account does not have access ' +
        'to that specific version. Request it on https://scripture.api.bible/account.'
    );
  }
})();
