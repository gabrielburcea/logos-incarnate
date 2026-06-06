#!/usr/bin/env node
/**
 * Build the meaning bundle from raw source data.
 *
 * Reads:  data/meaning-raw/{strongs,morphhb,STEPBible-Data,crosswire-kjv}/
 * Writes: public/meaning/{
 *           hebrew-lexicon.json   ← H#### → { lemma, translit, definition }
 *           greek-lexicon.json    ← G#### → { lemma, translit, definition }
 *           verses/<BOOK>.json    ← per-verse Strong's lists (universal)
 *           alignments/KJV.json   ← per-verse English-word → Strong's[] map
 *                                   (anchored on the CrossWire KJV2003 text)
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
import zlib from 'node:zlib';
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

// Canonical 66-book order (KJV v11n), OT first 39 then NT 27 — drives the
// positional walk of the CrossWire ztext verse index.
const KJV_USFM_ORDER = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
  'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
  'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH',
  'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS',
  '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV',
];

// Grammatical-only Strong's numbers that never deserve a meaning card:
//   H853  = אֵת direct-object marker      G3588 = ὁ/ἡ/τό definite article
// CrossWire co-tags these onto the real word ("the vinegar" → G3588 + G3690),
// so when a real lemma is present it wins; a standalone marker maps only to a
// stop-word and is dropped. This keeps the reader "never wrong, just silent".
const GRAMMATICAL_STRONGS = new Set(['H853', 'G3588']);

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

/**
 * Pull clean lowercase English word tokens out of a STEPBible English cell.
 * Hyphenated amalgams ("kinsman-redeemer") are split into their parts so each
 * piece maps to the same Strong's — this widens coverage for modern wordings.
 */
function collectEnglishTokens(raw, set) {
  if (!raw) return;
  const cleaned = String(raw)
    .replace(/<[^>]*>/g, ' ')      // <implied>
    .replace(/\[[^\]]*\]/g, ' ')   // [supplied]
    .replace(/\{[^}]*\}/g, ' ')    // {braces}
    .replace(/[\u00bb@|\/-]/g, ' ') // » @ | / -  (separators + hyphen amalgams)
    .replace(/\b\d+(?:[.:]\d+)?\b/g, ' ') // stray refs
    .toLowerCase();
  for (const w of cleaned.split(/[\s,;.()!?’']+/)) {
    if (/^[a-z']{2,}$/.test(w) && !BUILD_STOPWORDS.has(w)) set.add(w);
  }
}

/**
 * Function words we never want as alignment keys. Mirrors the runtime
 * SKIP_WORDS so the reader never gets a meaning card on "the / of / and".
 * Filtering here also shrinks the shipped alignment file substantially.
 */
const BUILD_STOPWORDS = new Set([
  'a','an','the','am','is','are','was','were','be','been','being',
  'art','wast','wert','have','has','had','do','does','did','doing','done',
  'hast','hath','doth','didst','shall','will','would','should','could','may',
  'might','can','must','ought','shalt','wilt','i','you','he','she','it','we',
  'they','me','him','her','us','them','my','your','his','its','our','their',
  'mine','yours','hers','ours','theirs','myself','yourself','himself',
  'herself','itself','ourselves','yourselves','themselves','this','that',
  'these','those','who','whom','whose','which','what','thou','thee','thy',
  'thine','ye','thyself','of','in','on','at','by','to','from','for','with',
  'into','onto','upon','unto','out','off','through','throughout','over',
  'under','above','below','before','after','between','among','amongst',
  'against','without','within','about','around','across','behind','beside',
  'beyond','during','and','or','but','so','yet','nor','if','as','because',
  'when','while','whilst','then','than','though','although','since','until',
  'till','unless','where','wherein','whereby','whence','whither','no','not',
  'none','nay','never','all','any','some','many','much','more','most','few',
  'less','least','every','each','both','either','neither','one','two','three',
  'there','here','also','only','just','even','very','ever','again','always',
  'now','often','sometimes','yea','behold','lo','oft','up','down',
]);

/** For OT the gloss sits inside braces: "{H5828=עֵ֫זֶר=helper}" → "helper". */
function extractGloss(raw, isNT) {
  if (!raw) return '';
  let s = String(raw).trim();
  if (!isNT && s.includes('{')) {
    s = s.replace(/[{}]/g, '');
    const parts = s.split('=');
    return parts[parts.length - 1];
  }
  return s;
}

/** Extract the original-language surface form + its transliteration. */
function parseSurface(fields, isNT) {
  if (isNT) {
    // [1] e.g. "τετέλεσται. (tetelestai)"
    const raw = (fields[1] || '').trim();
    const mt = raw.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
    let form = mt ? mt[1] : raw;
    const translit = mt ? mt[2].trim() : '';
    form = form.replace(/[.,;:·]+$/g, '').trim();
    return { form, translit };
  }
  // OT: [1] Hebrew surface, [2] transliteration with syllable dots.
  const form = (fields[1] || '').replace(/[\u05BE\/|]+$/g, '').trim();
  const translit = (fields[2] || '').replace(/\./g, '').trim();
  return { form, translit };
}

/** Normalize a morph code: NT "G5055=V-RPI-3S" → "V-RPI-3S"; OT "HNcmsa". */
function parseMorph(raw, isNT) {
  if (!raw) return '';
  let s = String(raw).trim();
  if (isNT) {
    const eq = s.indexOf('=');
    if (eq >= 0) s = s.slice(eq + 1);
  }
  return s.split(/\s/)[0];
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
      // The comma-list of KJV renderings ("finish, pay, accomplish, …").
      // Public-domain; powers the popover's "range of meaning" line.
      kjvDef: cleanDef(entry.kjv_def) || '',
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

  const verseLemmas = {}; // { BOOK: { 'ch.vs': [strongs...] } } (NT only)
  const formOcc = {};     // { strongs: { morph: { f, t, r:Set<fullRef> } } }
  // Cross-translation English coverage (modern wordings the KJV text lacks).
  // Merged UNDER the authoritative CrossWire KJV alignment in main().
  const alignment = {};   // { 'BOOK.ch.vs': { english: Set<strongs> } }

  // Lines that begin a verse-word start with the reference, e.g.
  // "Gen.2.18#11=L<TAB>...".
  const refRe = /^([1-3]?[A-Z][a-z]{1,3})\.(\d+)\.(\d+)/;

  for (const f of files) {
    const isNT = f.startsWith('TAGNT');
    const defaultPrefix = isNT ? 'G' : 'H';
    process.stdout.write(`  ${f.split(' - ')[0]}\n`);
    const text = await fs.readFile(path.join(stepDir, f), 'utf8');
    let lineCount = 0;
    let dataLineCount = 0;

    // Field layout (verified by dumping real lines — see _inspect-fields.mjs):
    //
    //   TAGNT (NT)                        TAHOT (OT)
    //   [1] τετέλεσται. (tetelestai)     [1] עֵזֶר           surface
    //   [2] It has been finished.  ←Eng   [2] 'E.zer          translit
    //   [3] G5055=V-RPI-3S    ←Strong+morph [3] a helper   ←Eng
    //   [9] to finish          ←gloss     [5] HNcmsa     ←morph
    //                                     [8] H5828      ←Strong
    //                                     [11] {H5828=עֵזֶר=helper} ←gloss
    //
    // CrossWire (parseCrosswireKJV) is the authoritative KJV alignment; here we
    // also collect STEPBible's contextual + gloss English as a cross-translation
    // fallback (modern wordings the KJV text doesn't contain), alongside the
    // Strong's column and the surface/morph fields used for lemma lists + forms.
    const CTX_IDX = isNT ? 2 : 3;
    const GLOSS_IDX = isNT ? 9 : 11;
    const minLen = isNT ? 3 : 8;

    for (const line of text.split('\n')) {
      lineCount++;
      const m = line.match(refRe);
      if (!m) continue;
      const usfm = STEP_TO_USFM[m[1]];
      if (!usfm) continue;
      const ref = `${m[2]}.${m[3]}`;
      const fullRef = `${usfm}.${ref}`;

      const fields = line.split('\t');
      if (fields.length <= minLen) continue;

      // Strong's: NT from [3] ("G5055=..."), OT from the clean [8] column.
      const strongsRaw = isNT
        ? (fields[3] || '').split('=')[0]
        : (fields[8] || '');
      const codes = extractStrongs(strongsRaw, defaultPrefix);
      if (codes.length === 0) continue;
      dataLineCount++;
      const primary = codes[0];

      // Per-verse lemma list (NT only; OT comes from morphhb).
      if (isNT) {
        if (!verseLemmas[usfm]) verseLemmas[usfm] = {};
        if (!verseLemmas[usfm][ref]) verseLemmas[usfm][ref] = [];
        verseLemmas[usfm][ref].push(...codes);
      }

      // Cross-translation English = contextual ∪ gloss (split into tokens).
      const tokens = new Set();
      collectEnglishTokens(fields[CTX_IDX], tokens);
      collectEnglishTokens(extractGloss(fields[GLOSS_IDX], isNT), tokens);
      for (const ew of tokens) {
        if (!alignment[fullRef]) alignment[fullRef] = {};
        if (!alignment[fullRef][ew]) alignment[fullRef][ew] = new Set();
        for (const c of codes) alignment[fullRef][ew].add(c);
      }

      // Form data (surface + translit + morph), folded straight into the
      // form-occurrence index so we ship ONE file, not a 36 MB per-verse dump.
      // The popover resolves a clicked word's morph by finding which morph
      // bucket for this Strong's contains the current verse.
      const { form, translit } = parseSurface(fields, isNT);
      const morph = parseMorph(isNT ? (fields[3] || '') : (fields[5] || ''), isNT);
      if (morph) {
        if (!formOcc[primary]) formOcc[primary] = {};
        if (!formOcc[primary][morph]) {
          formOcc[primary][morph] = { f: form, t: translit, r: new Set() };
        }
        formOcc[primary][morph].r.add(fullRef);
      }
    }
    process.stdout.write(`     ${dataLineCount.toLocaleString()} word entries / ${lineCount.toLocaleString()} lines\n`);
  }

  // Sets → arrays.
  for (const ref of Object.keys(alignment)) {
    for (const w of Object.keys(alignment[ref])) {
      alignment[ref][w] = [...alignment[ref][w]];
    }
  }
  for (const s of Object.keys(formOcc)) {
    for (const mo of Object.keys(formOcc[s])) {
      formOcc[s][mo].r = [...formOcc[s][mo].r];
    }
  }

  return { verseLemmas, formOcc, alignment };
}

// ────────── Step 4b: CrossWire KJV2003 (English-word → Strong's alignment) ──────────
//
// The alignment anchor. STEPBible's "amalgamated" English diverges from KJV
// wording (kinsman-redeemer vs kinsman, fathered vs begat), which silently
// dropped 30-40% of content words. Anchoring on the actual KJV text with its
// embedded Strong's numbers lifts content-word coverage to ~95%+ while keeping
// every match correct.
//
// Source: CrossWire KJV2003 SWORD module (ztext/OSIS). The KJV text and the
// Strong's numbers are both public domain; CrossWire grants a general public
// license to use the text for any purpose.
function readZBlock(bzs, bzz, blockNum) {
  const o = blockNum * 12;
  const off = bzs.readUInt32LE(o);
  const compSize = bzs.readUInt32LE(o + 4);
  return zlib.inflateSync(bzz.subarray(off, off + compSize));
}

async function parseCrosswireKJV() {
  console.log('• Parsing CrossWire KJV2003 (English-word → Strong\'s alignment)');
  const ztextDir = path.join(RAW, 'crosswire-kjv', 'modules', 'texts', 'ztext', 'kjv');
  const { books } = JSON.parse(
    await fs.readFile(path.join(RAW, 'crosswire-kjv', 'KJV.json'), 'utf8')
  );
  books.forEach((b, i) => (b.usfm = KJV_USFM_ORDER[i]));

  const alignment = {}; // { 'BOOK.ch.vs': { english: [strongs...] } }
  let verseCount = 0;
  let mismatches = 0;

  const tokenize = (s) =>
    s.replace(/<[^>]+>/g, ' ').toLowerCase().match(/[a-z]+/g) || [];
  const plain = (s) =>
    s.replace(/<[^>]+>/g, ' ').replace(/[^a-z]+/gi, ' ').trim().toLowerCase();

  // Each testament's verse index is a fixed canonical enumeration: 2 leading
  // heading slots, then per book a book-intro slot, and per chapter a
  // chapter-intro slot followed by one slot per verse. Walking it positionally
  // (driven by the canonical verse counts) is deterministic and self-checking.
  const testaments = [
    ['ot', books.slice(0, 39)],
    ['nt', books.slice(39)],
  ];

  for (const [prefix, bookList] of testaments) {
    const bzs = await fs.readFile(path.join(ztextDir, `${prefix}.bzs`));
    const bzv = await fs.readFile(path.join(ztextDir, `${prefix}.bzv`));
    const bzz = await fs.readFile(path.join(ztextDir, `${prefix}.bzz`));
    const blocks = new Map();
    const block = (n) =>
      blocks.get(n) ?? blocks.set(n, readZBlock(bzs, bzz, n)).get(n);
    const slot = (i) => {
      const o = i * 10;
      const bn = bzv.readUInt32LE(o);
      const st = bzv.readUInt32LE(o + 4);
      const sz = bzv.readUInt16LE(o + 8);
      return sz === 0 ? '' : block(bn).subarray(st, st + sz).toString('utf8');
    };

    let idx = 2; // skip the 2 leading heading slots
    for (const b of bookList) {
      idx++; // book-intro slot
      for (const ch of b.chapters) {
        idx++; // chapter-intro slot
        for (const v of ch.verses) {
          const osis = slot(idx++);
          const ref = `${b.usfm}.${ch.chapter}.${v.verse}`;
          verseCount++;

          // Drop reordered/empty word tags (<w .../>): they carry an article or
          // a supplied word with NO English text, and would otherwise let the
          // paired-tag regex swallow the next real word (e.g. "Paul" inheriting
          // a preceding article's G3588).
          const body = osis.replace(/<w\b[^>]*\/>/g, ' ');

          const wRe = /<w\s+lemma="([^"]*)"[^>]*>([\s\S]*?)<\/w>/g;
          let wm;
          while ((wm = wRe.exec(body)) !== null) {
            const strongs = [];
            for (const sx of wm[1].matchAll(/strong:([GH]\d+)/g)) {
              const norm = normalizeStrongs(sx[1]);
              if (norm) strongs.push(norm);
            }
            if (strongs.length === 0) continue;
            // Prefer the real word over a co-tagged article / object marker.
            let pool = strongs.filter((s) => !GRAMMATICAL_STRONGS.has(s));
            if (pool.length === 0) pool = strongs;
            const code = pool[0];
            for (const w of tokenize(wm[2])) {
              if (w.length < 2 || BUILD_STOPWORDS.has(w)) continue;
              if (!alignment[ref]) alignment[ref] = {};
              if (!alignment[ref][w]) alignment[ref][w] = new Set();
              alignment[ref][w].add(code);
            }
          }

          // Integrity guard: the stripped OSIS must match the canonical KJV
          // verse (same translation). A low overlap means the positional walk
          // has desynced and the build should not be trusted.
          const got = new Set(plain(osis).split(/\s+/));
          const exp = plain(v.text).split(/\s+/).filter(Boolean);
          const hit = exp.filter((w) => got.has(w)).length;
          if (exp.length === 0 || hit / exp.length < 0.6) mismatches++;
        }
      }
    }
  }

  // Sets → arrays for JSON.
  for (const ref of Object.keys(alignment)) {
    for (const w of Object.keys(alignment[ref])) {
      alignment[ref][w] = [...alignment[ref][w]];
    }
  }

  console.log(
    `  ✓ ${verseCount.toLocaleString()} verses aligned · ${mismatches} text mismatch(es)`
  );
  if (verseCount !== 31102) {
    console.warn(`  ⚠ expected 31,102 verses, got ${verseCount} — versification drift?`);
  }
  if (mismatches > 0) {
    console.warn(`  ⚠ ${mismatches} verses failed KJV text validation — alignment may be off`);
  }
  return { alignment };
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
      const [ch, vs] = ref.split('.');
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
  const { verseLemmas: stepVerses, formOcc, alignment: crossTransAlign } =
    await parseStepBible();
  const { alignment: kjvAlign } = await parseCrosswireKJV();

  // Two-layer alignment. CrossWire KJV is authoritative — exact KJV words,
  // ~98% coverage, every match correct. STEPBible's amalgamated English is the
  // fallback layer underneath, supplying modern wordings for other translations
  // (e.g. WEB) where the KJV text differs. CrossWire wins on any shared word.
  const alignment = crossTransAlign;
  for (const ref of Object.keys(kjvAlign)) {
    if (!alignment[ref]) alignment[ref] = {};
    Object.assign(alignment[ref], kjvAlign[ref]);
  }

  const allVerses = await writeVerses(stepVerses, morphhbVerses);

  console.log('• Writing KJV alignment');
  await fs.writeFile(
    path.join(OUT, 'alignments/KJV.json'),
    JSON.stringify(alignment)
  );
  console.log(`  ✓ ${Object.keys(alignment).length} verses with English-word maps`);

  console.log('• Writing form-occurrence index');
  await fs.writeFile(
    path.join(OUT, 'form-occurrences.json'),
    JSON.stringify(formOcc)
  );
  console.log(`  ✓ ${Object.keys(formOcc).length} Strong's numbers with form breakdown`);

  const occIndex = await buildOccurrences(allVerses);

  // Patch lemma occurrence counts into the lexicons so the popover can show
  // "appears in N places" without ever loading the multi-MB occurrence index.
  for (const [code, refs] of Object.entries(occIndex)) {
    if (hebrew[code]) hebrew[code].count = refs.length;
    else if (greek[code]) greek[code].count = refs.length;
  }
  await fs.writeFile(path.join(OUT, 'hebrew-lexicon.json'), JSON.stringify(hebrew));
  await fs.writeFile(path.join(OUT, 'greek-lexicon.json'), JSON.stringify(greek));
  console.log('  ✓ lemma counts patched into lexicons');

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
    'form-occurrences.json': await sizeOf('form-occurrences.json'),
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

  // Sanity check: prove the τετέλεσται lookup works end-to-end
  console.log('\n=== Sanity check: τετέλεσται (G5055) ===');
  const align = JSON.parse(
    await fs.readFile(path.join(OUT, 'alignments/KJV.json'), 'utf8')
  );
  console.log(`  JHN.19.30 "finished" → ${JSON.stringify(align['JHN.19.30']?.finished)}`);
  const fo = JSON.parse(
    await fs.readFile(path.join(OUT, 'form-occurrences.json'), 'utf8')
  );
  const rpi = fo['G5055'] && fo['G5055']['V-RPI-3S'];
  if (rpi) {
    console.log(`  Form: ${rpi.f} (${rpi.t})`);
    console.log(`  Perfect-passive occurs in: ${rpi.r.join(', ')}`);
  }
  if (greek.G5055) {
    console.log(`  Lemma: ${greek.G5055.lemma} · ${greek.G5055.translit}`);
    console.log(`  Def:   ${greek.G5055.definition}`);
    console.log(`  KJV:   ${greek.G5055.kjvDef}`);
  }
})();
