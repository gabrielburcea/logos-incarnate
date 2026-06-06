#!/usr/bin/env node
/**
 * Build the meaning bundle from raw source data.
 *
 * Reads:  data/meaning-raw/{strongs,morphhb,STEPBible-Data}/
 * Writes: public/meaning/{
 *           hebrew-lexicon.json   ← H#### → { lemma, translit, definition }
 *           greek-lexicon.json    ← G#### → { lemma, translit, definition }
 *           verses/<BOOK>.json    ← per-verse Strong's lists (universal)
 *           alignments/KJV.json   ← per-verse English-word → Strong's[] map
 *           occurrences.json      ← Strong's # → [BOOK.CH.VS, ...]
 *         }
 *
 * Words skipped (no original-language equivalent):
 *   - English helper words ("a", "the", auxiliary "is/are") — never get ⓘ
 *   - STEPBible particle tags (H9000-H9999) — Hebrew prefixes/suffixes/markers
 *     that aren't real lexicon entries
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const RAW = path.join(ROOT, 'data', 'meaning-raw');
const OUT = path.join(ROOT, 'public', 'meaning');

// ────────── Book name maps ──────────
// morphhb XML filename → our USFM 3-letter code
const MORPHHB_TO_USFM = {
  Gen: 'GEN', Exod: 'EXO', Lev: 'LEV', Num: 'NUM', Deut: 'DEU',
  Josh: 'JOS', Judg: 'JDG', Ruth: 'RUT',
  '1Sam': '1SA', '2Sam': '2SA', '1Kgs': '1KI', '2Kgs': '2KI',
  '1Chr': '1CH', '2Chr': '2CH', Ezra: 'EZR', Neh: 'NEH', Esth: 'EST',
  Job: 'JOB', Ps: 'PSA', Prov: 'PRO', Eccl: 'ECC', Song: 'SNG',
  Isa: 'ISA', Jer: 'JER', Lam: 'LAM', Ezek: 'EZK', Dan: 'DAN',
  Hos: 'HOS', Joel: 'JOL', Amos: 'AMO', Obad: 'OBA', Jonah: 'JON',
  Mic: 'MIC', Nah: 'NAM', Hab: 'HAB', Zeph: 'ZEP', Hag: 'HAG',
  Zech: 'ZEC', Mal: 'MAL',
};

// STEPBible book ref → our USFM 3-letter code
const STEP_TO_USFM = {
  // OT (TAHOT)
  Gen: 'GEN', Exo: 'EXO', Lev: 'LEV', Num: 'NUM', Deu: 'DEU',
  Jos: 'JOS', Jdg: 'JDG', Rut: 'RUT',
  '1Sa': '1SA', '2Sa': '2SA', '1Ki': '1KI', '2Ki': '2KI',
  '1Ch': '1CH', '2Ch': '2CH', Ezr: 'EZR', Neh: 'NEH', Est: 'EST',
  Job: 'JOB', Psa: 'PSA', Pro: 'PRO', Ecc: 'ECC', Sng: 'SNG',
  Isa: 'ISA', Jer: 'JER', Lam: 'LAM', Ezk: 'EZK', Dan: 'DAN',
  Hos: 'HOS', Jol: 'JOL', Amo: 'AMO', Oba: 'OBA', Jon: 'JON',
  Mic: 'MIC', Nah: 'NAM', Hab: 'HAB', Zep: 'ZEP', Hag: 'HAG',
  Zec: 'ZEC', Mal: 'MAL',
  // NT (TAGNT)
  Mat: 'MAT', Mrk: 'MRK', Luk: 'LUK', Jhn: 'JHN', Act: 'ACT',
  Rom: 'ROM', '1Co': '1CO', '2Co': '2CO', Gal: 'GAL', Eph: 'EPH',
  Php: 'PHP', Col: 'COL', '1Th': '1TH', '2Th': '2TH',
  '1Ti': '1TI', '2Ti': '2TI', Tit: 'TIT', Phm: 'PHM',
  Heb: 'HEB', Jas: 'JAS', '1Pe': '1PE', '2Pe': '2PE',
  '1Jn': '1JN', '2Jn': '2JN', '3Jn': '3JN', Jud: 'JUD', Rev: 'REV',
};

// ────────── Helpers ──────────

/**
 * Normalize a Strong's reference to canonical "H#" or "G#" form.
 * Returns null for particle-only tags that have no lexicon entry.
 *   "1254"      → "H1254"   (morphhb leaves off the H)
 *   "1254 a"    → "H1254"   (morphhb may append a homograph letter)
 *   "H0905H"    → "H905"    (STEPBible adds disambiguation suffix)
 *   "G2316"     → "G2316"
 *   "H9001"     → null      (Hebrew prefix marker — not a real word)
 *   "H9033"     → null      (suffix marker)
 */
function normalizeStrongs(raw, defaultPrefix = 'H') {
  if (!raw) return null;
  const m = String(raw).match(/^([HG])?0*(\d+)/i);
  if (!m) return null;
  const prefix = (m[1] || defaultPrefix).toUpperCase();
  const num = parseInt(m[2], 10);
  // STEPBible reserves H9000-H9999 for grammatical tags (not real Hebrew words)
  if (prefix === 'H' && num >= 9000) return null;
  return `${prefix}${num}`;
}

/**
 * Extract all Strong's tokens from a raw lemma/strongs string.
 * morphhb uses space- or slash-separated; STEPBible uses braces and slashes.
 */
function extractStrongs(raw, defaultPrefix = 'H') {
  if (!raw) return [];
  const out = [];
  const matches = String(raw).match(/[HG]?\d+/gi) || [];
  for (const m of matches) {
    const norm = normalizeStrongs(m, defaultPrefix);
    if (norm) out.push(norm);
  }
  return out;
}

/** Strip curly-brace placeholders from a definition string. */
function cleanDef(def) {
  if (!def) return '';
  return String(def).replace(/^\{/, '').replace(/\}$/, '').trim();
}

/** Read a .js Strong's dictionary and return the trimmed JSON-like object. */
async function trimLexicon(jsPath, varName) {
  const src = await fs.readFile(jsPath, 'utf8');
  // Find: var <varName> = { ... };
  // The closing `};` may be followed by a `module.exports = ...` line.
  const m = src.match(
    new RegExp(`var\\s+${varName}\\s*=\\s*(\\{[\\s\\S]+\\})\\s*;`)
  );
  if (!m) throw new Error(`Could not parse ${jsPath} — no '${varName}' assignment`);
  // Lexicon is JSON-compatible JS object literal — eval inside a Function
  // (the source is fully trusted, public-domain Strong's data).
  const dict = new Function(`return ${m[1]}`)();
  const trimmed = {};
  for (const [key, entry] of Object.entries(dict)) {
    if (!entry || typeof entry !== 'object') continue;
    const def = cleanDef(entry.strongs_def) || cleanDef(entry.kjv_def) || '';
    trimmed[key] = {
      lemma: entry.lemma || '',
      // Hebrew lexicon uses `xlit`, Greek lexicon uses `translit` — accept both.
      translit: entry.xlit || entry.translit || '',
      definition: def,
    };
  }
  return trimmed;
}

// ────────── Step 1 + 2: lexicons ──────────
async function buildLexicons() {
  console.log('• Hebrew lexicon');
  const hebrew = await trimLexicon(
    path.join(RAW, 'strongs/hebrew/strongs-hebrew-dictionary.js'),
    'strongsHebrewDictionary'
  );
  await fs.writeFile(
    path.join(OUT, 'hebrew-lexicon.json'),
    JSON.stringify(hebrew)
  );
  console.log(`  ✓ ${Object.keys(hebrew).length} entries`);

  console.log('• Greek lexicon');
  const greek = await trimLexicon(
    path.join(RAW, 'strongs/greek/strongs-greek-dictionary.js'),
    'strongsGreekDictionary'
  );
  await fs.writeFile(
    path.join(OUT, 'greek-lexicon.json'),
    JSON.stringify(greek)
  );
  console.log(`  ✓ ${Object.keys(greek).length} entries`);
  return { hebrew, greek };
}

// ────────── Step 3: morphhb (OT verses) ──────────
async function parseMorphhb() {
  console.log('• Parsing morphhb (OT verses)');
  const wlcDir = path.join(RAW, 'morphhb/wlc');
  const files = (await fs.readdir(wlcDir)).filter((f) => f.endsWith('.xml'));
  const out = {}; // { GEN: { '1:1': ['H7225','H1254',...], ... }, ... }
  for (const f of files) {
    const morphName = f.replace('.xml', '');
    const usfm = MORPHHB_TO_USFM[morphName];
    if (!usfm) {
      console.log(`  skip ${morphName} (unknown book)`);
      continue;
    }
    const xml = await fs.readFile(path.join(wlcDir, f), 'utf8');
    const verses = {};
    const verseRe = /<verse[^>]*osisID="([^"]+)"[^>]*>([\s\S]*?)<\/verse>/g;
    let vm;
    while ((vm = verseRe.exec(xml)) !== null) {
      const osisId = vm[1];
      const body = vm[2];
      const parts = osisId.split('.');
      if (parts.length < 3) continue;
      const ref = `${parts[1]}.${parts[2]}`;
      const lemmaRe = /<w[^>]+lemma="([^"]+)"/g;
      const codes = [];
      let wm;
      while ((wm = lemmaRe.exec(body)) !== null) {
        codes.push(...extractStrongs(wm[1], 'H'));
      }
      if (codes.length > 0) verses[ref] = codes;
    }
    out[usfm] = verses;
    process.stdout.write(`  ${usfm.padEnd(4)} ${Object.keys(verses).length} verses\n`);
  }
  return out;
}

// ────────── Step 4: STEPBible (NT verses + KJV alignment) ──────────
async function parseStepBible() {
  console.log('• Parsing STEPBible (NT verses + KJV alignment)');
  const stepDir = path.join(RAW, 'STEPBible-Data/Translators Amalgamated OT+NT');
  const files = (await fs.readdir(stepDir)).filter(
    (f) => f.endsWith('.txt') && (f.startsWith('TAHOT') || f.startsWith('TAGNT'))
  );

  const verseLemmas = {}; // { BOOK: { 'ch:vs': [strongs...] } }
  const alignment = {}; // { 'BOOK.ch.vs': { englishWord: Set<strongs> } }

  // Lines that begin a verse start with the reference, e.g. "Gen.2.18#11=L<TAB>...".
  const refRe = /^([1-3]?[A-Z][a-z]{1,3})\.(\d+)\.(\d+)/;

  for (const f of files) {
    const isNT = f.startsWith('TAGNT');
    const defaultPrefix = isNT ? 'G' : 'H';
    process.stdout.write(`  ${f.split(' - ')[0]}\n`);
    const text = await fs.readFile(path.join(stepDir, f), 'utf8');
    let lineCount = 0;
    let dataLineCount = 0;

    // Field layout differs between the two file types (verified by inspection):
    //   TAHOT (OT)  fields[0]=ref  fields[3]=English  fields[8]=Strong's root
    //   TAGNT (NT)  fields[0]=ref  fields[9]=English  fields[11]=Strong's root
    //                              (fields[2] is contextual English with [the]/etc.
    //                               fields[9] is the bare lexical gloss — better
    //                               for English-word alignment.)
    const ENGLISH_IDX = isNT ? 9 : 3;
    const STRONGS_IDX = isNT ? 11 : 8;

    for (const line of text.split('\n')) {
      lineCount++;
      const m = line.match(refRe);
      if (!m) continue;
      const stepBook = m[1];
      const usfm = STEP_TO_USFM[stepBook];
      if (!usfm) continue;
      const ch = m[2];
      const vs = m[3];
      const ref = `${ch}.${vs}`;
      const fullRef = `${usfm}.${ch}.${vs}`;

      const fields = line.split('\t');
      if (fields.length <= STRONGS_IDX) continue;
      dataLineCount++;

      const english = (fields[ENGLISH_IDX] || '').trim();
      const rootField = (fields[STRONGS_IDX] || '').trim();

      const codes = extractStrongs(rootField, defaultPrefix);
      if (codes.length === 0) continue;

      // Per-verse list (used for occurrence index + verse-level ⓘ fallback).
      // Only fill if morphhb didn't already produce this book (NT only).
      if (isNT) {
        if (!verseLemmas[usfm]) verseLemmas[usfm] = {};
        if (!verseLemmas[usfm][ref]) verseLemmas[usfm][ref] = [];
        verseLemmas[usfm][ref].push(...codes);
      }

      // KJV alignment: extract real English tokens from the gloss field.
      // Strip annotation noise: <implied>, [supplied], slashes, punctuation,
      // and » / @ separators that STEPBible uses for cross-references.
      if (english) {
        const tokens = english
          .replace(/<[^>]*>/g, ' ')
          .replace(/\[[^\]]*\]/g, ' ')
          .replace(/[\u00bb@\/|]/g, ' ')
          .replace(/\b\d+(?:[.:]\d+)?\b/g, ' ') // strip stray refs
          .toLowerCase()
          .split(/[\s,;.()!?"]+/)
          .filter((w) => /^[a-z'-]{2,}$/.test(w));
        for (const ew of tokens) {
          if (!alignment[fullRef]) alignment[fullRef] = {};
          if (!alignment[fullRef][ew]) alignment[fullRef][ew] = new Set();
          for (const c of codes) alignment[fullRef][ew].add(c);
        }
      }
    }
    process.stdout.write(`     ${dataLineCount.toLocaleString()} word entries / ${lineCount.toLocaleString()} lines\n`);
  }

  // Sets → arrays
  for (const ref of Object.keys(alignment)) {
    for (const w of Object.keys(alignment[ref])) {
      alignment[ref][w] = [...alignment[ref][w]];
    }
  }

  return { verseLemmas, alignment };
}

// ────────── Step 5: write per-book verse files ──────────
async function writeVerses(stepNTVerses, morphhbVerses) {
  console.log('• Writing per-verse Strong\'s lists');
  const merged = { ...morphhbVerses, ...stepNTVerses };
  await fs.mkdir(path.join(OUT, 'verses'), { recursive: true });
  for (const [book, verses] of Object.entries(merged)) {
    // Dedupe codes per verse (a verse can contain the same lemma multiple times)
    const cleaned = {};
    for (const [ref, codes] of Object.entries(verses)) {
      cleaned[ref] = [...new Set(codes)];
    }
    await fs.writeFile(
      path.join(OUT, 'verses', `${book}.json`),
      JSON.stringify(cleaned)
    );
  }
  console.log(`  ✓ ${Object.keys(merged).length} books written`);
  return merged;
}

// ────────── Step 6: occurrence index ──────────
async function buildOccurrences(allVerses) {
  console.log('• Building occurrence index');
  const occ = {}; // { 'H5828': ['GEN.2.18', 'GEN.2.20', ...], ... }
  for (const [book, verses] of Object.entries(allVerses)) {
    for (const [ref, codes] of Object.entries(verses)) {
      const [ch, vs] = ref.split(':');
      const fullRef = `${book}.${ch}.${vs}`;
      const seen = new Set();
      for (const c of codes) {
        if (seen.has(c)) continue;
        seen.add(c);
        if (!occ[c]) occ[c] = [];
        occ[c].push(fullRef);
      }
    }
  }
  await fs.writeFile(
    path.join(OUT, 'occurrences.json'),
    JSON.stringify(occ)
  );
  console.log(`  ✓ ${Object.keys(occ).length} unique Strong's numbers indexed`);
  return occ;
}

// ────────── Main ──────────
(async () => {
  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(path.join(OUT, 'alignments'), { recursive: true });

  console.log('=== Building meaning bundle ===\n');

  const { hebrew, greek } = await buildLexicons();

  const morphhbVerses = await parseMorphhb();
  const { verseLemmas: stepVerses, alignment } = await parseStepBible();

  const allVerses = await writeVerses(stepVerses, morphhbVerses);

  console.log('• Writing KJV alignment');
  await fs.writeFile(
    path.join(OUT, 'alignments/KJV.json'),
    JSON.stringify(alignment)
  );
  console.log(`  ✓ ${Object.keys(alignment).length} verses with English-word maps`);

  await buildOccurrences(allVerses);

  // ─── summary ───
  console.log('\n=== Output sizes ===');
  async function sizeOf(rel) {
    const stat = await fs.stat(path.join(OUT, rel));
    return stat.size;
  }
  async function dirSize(rel) {
    const dir = path.join(OUT, rel);
    const files = await fs.readdir(dir);
    let total = 0;
    for (const f of files) total += (await fs.stat(path.join(dir, f))).size;
    return total;
  }
  const sizes = {
    'hebrew-lexicon.json': await sizeOf('hebrew-lexicon.json'),
    'greek-lexicon.json': await sizeOf('greek-lexicon.json'),
    'verses/ (per-book)': await dirSize('verses'),
    'alignments/KJV.json': await sizeOf('alignments/KJV.json'),
    'occurrences.json': await sizeOf('occurrences.json'),
  };
  let total = 0;
  for (const [k, v] of Object.entries(sizes)) {
    console.log(`  ${k.padEnd(28)} ${(v / 1024).toFixed(1).padStart(8)} KB`);
    total += v;
  }
  console.log(`  ${'─'.repeat(28)} ─────────`);
  console.log(`  ${'TOTAL'.padEnd(28)} ${(total / 1024 / 1024).toFixed(2).padStart(7)} MB`);

  // Sanity check: prove the famous H5828 lookup works end-to-end
  console.log('\n=== Sanity check: H5828 (helper) ===');
  if (hebrew.H5828) {
    console.log(`  Lemma:       ${hebrew.H5828.lemma}`);
    console.log(`  Translit:    ${hebrew.H5828.translit}`);
    console.log(`  Definition:  ${hebrew.H5828.definition}`);
  }
  const occ = JSON.parse(
    await fs.readFile(path.join(OUT, 'occurrences.json'), 'utf8')
  );
  if (occ.H5828) {
    console.log(`  Occurrences: ${occ.H5828.length} verses`);
    console.log(`               ${occ.H5828.slice(0, 8).join(' · ')}${occ.H5828.length > 8 ? ' …' : ''}`);
  }
})();
