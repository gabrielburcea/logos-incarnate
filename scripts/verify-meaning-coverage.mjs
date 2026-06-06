// Whole-book coverage test for the meaning layer.
//
// For each verse of a book we replicate the runtime word-tagging logic
// (same tokenizer, same stop-words as wrap-meaning-words.ts) and measure:
//   • how many CONTENT words (non stop-words) get an alignment match
//   • of those, how many resolve to a lexicon entry (lemma found)
//   • of those, how many resolve to an inflected form (form-occurrences)
//   • the unique content words that MISS, so we can spot systematic gaps
//
// Run regularly after any change to scripts/build-meaning-bundle.mjs or the
// runtime tokenizer. Healthy numbers: KJV 95-99%, WEB 80-90%.
//
// Usage:
//   npm run verify:meaning -- RUT EPH         # KJV by default
//   TRANS=WEB npm run verify:meaning -- JHN   # switch translation
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TRANS = process.env.TRANS || "KJV";
const SRC = path.join(ROOT, "public/bibles", TRANS);
const M = path.join(ROOT, "public/meaning");

const BOOKS = process.argv.slice(2);
if (BOOKS.length === 0) BOOKS.push("RUT", "EPH");

// ---- Same stop-word list the runtime uses (wrap-meaning-words.ts) ----
const SKIP = new Set([
  "a","an","the","am","is","are","was","were","be","been","being","art","wast",
  "wert","have","has","had","do","does","did","doing","done","hast","hath",
  "doth","didst","shall","will","would","should","could","may","might","can",
  "must","ought","shalt","wilt","shouldst","wouldst","couldst","mayst",
  "mightst","canst","i","you","he","she","it","we","they","me","him","her",
  "us","them","my","your","his","its","our","their","mine","yours","hers",
  "ours","theirs","myself","yourself","himself","herself","itself","ourselves",
  "yourselves","themselves","this","that","these","those","who","whom","whose",
  "which","what","thou","thee","thy","thine","ye","thyself","of","in","on","at",
  "by","to","from","for","with","into","onto","upon","unto","out","off",
  "through","throughout","over","under","above","below","before","after",
  "between","among","amongst","against","without","within","about","around",
  "across","behind","beside","beyond","during","and","or","but","so","yet",
  "nor","if","as","because","when","while","whilst","then","than","though",
  "although","since","until","till","unless","where","wherein","whereby",
  "whence","whither","no","not","none","nay","never","all","any","some","many",
  "much","more","most","few","less","least","every","each","both","either",
  "neither","one","two","three","there","here","also","only","just","even",
  "very","ever","again","always","now","often","sometimes","yea","behold","lo",
  "oft","up","down",
]);

const align = JSON.parse(fs.readFileSync(path.join(M, "alignments/KJV.json"), "utf8"));
const heb = JSON.parse(fs.readFileSync(path.join(M, "hebrew-lexicon.json"), "utf8"));
const grk = JSON.parse(fs.readFileSync(path.join(M, "greek-lexicon.json"), "utf8"));
const formOcc = JSON.parse(fs.readFileSync(path.join(M, "form-occurrences.json"), "utf8"));

function lex(code) {
  return code?.[0] === "H" ? heb[code] : grk[code];
}

/** Strip heading paragraphs + footnotes, return chapter HTML ready to split. */
function cleanChapter(html) {
  return html
    .replace(/<p class="(mt\d?|ms\d?|s\d?|d|r|cl|cp)"[^>]*>[\s\S]*?<\/p>/g, " ")
    .replace(/<span[^>]*class="(f|x|fr|ft|xt|fk)"[^>]*>[\s\S]*?<\/span>/g, " ")
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/g, " ");
}

/** Split a chapter into [{ sid, text }] using the verse markers. */
function splitVerses(html) {
  const markerRe = /<span\b[^>]*\bclass="v"[^>]*>[\s\S]*?<\/span>/g;
  const markers = [];
  let m;
  while ((m = markerRe.exec(html)) !== null) {
    const sidM = m[0].match(/data-sid="([^"]+)"/);
    markers.push({ sid: sidM ? sidM[1] : null, start: m.index, end: m.index + m[0].length });
  }
  const out = [];
  for (let i = 0; i < markers.length; i++) {
    const segEnd = i + 1 < markers.length ? markers[i + 1].start : html.length;
    const raw = html.slice(markers[i].end, segEnd);
    const text = raw.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ");
    out.push({ sid: markers[i].sid, text });
  }
  return out;
}

function sidToRef(sid) {
  // "RUT 1:1" -> "RUT.1.1"
  return sid ? sid.replace(" ", ".").replace(":", ".") : null;
}

function tokenize(text) {
  return text.split(/(\b[A-Za-z'’]+\b)/).filter((p) => /^[A-Za-z'’]+$/.test(p));
}

function testBook(code) {
  const file = path.join(SRC, `${code}.json`);
  if (!fs.existsSync(file)) {
    console.log(`\n!! ${code}: book file not found`);
    return;
  }
  const book = JSON.parse(fs.readFileSync(file, "utf8"));
  let verses = 0;
  let contentTokens = 0;
  let matched = 0;
  let lemmaOk = 0;
  let formOk = 0;
  let noVerseInAlign = 0;
  const missCounts = new Map(); // unique miss word -> count
  const sampleResolved = [];

  for (const ch of book.chapters) {
    const html = cleanChapter(ch.content || ch.html || "");
    for (const v of splitVerses(html)) {
      const ref = sidToRef(v.sid);
      if (!ref) continue;
      verses++;
      const verseAlign = align[ref];
      if (!verseAlign) noVerseInAlign++;
      for (const tokRaw of tokenize(v.text)) {
        const w = tokRaw.toLowerCase();
        if (SKIP.has(w)) continue;
        contentTokens++;
        const codes = verseAlign?.[w];
        if (codes && codes.length > 0) {
          matched++;
          const code = codes[0];
          if (lex(code)) lemmaOk++;
          const byMorph = formOcc[code];
          let hasForm = false;
          if (byMorph) {
            for (const b of Object.values(byMorph)) {
              if (b.r.includes(ref)) { hasForm = true; break; }
            }
          }
          if (hasForm) formOk++;
          if (sampleResolved.length < 8 && lex(code)) {
            const e = lex(code);
            sampleResolved.push(`${ref} "${w}" → ${code} ${e.lemma} (${e.translit}) — ${e.definition}`);
          }
        } else {
          missCounts.set(w, (missCounts.get(w) || 0) + 1);
        }
      }
    }
  }

  const pct = (n) => ((n / contentTokens) * 100).toFixed(1) + "%";
  const testament = code === code.toUpperCase() && lex(Object.values(align[`${code}.1.1`] || {})[0]?.[0])?.lemma ? "" : "";
  void testament;

  console.log(`\n══════════════════════════════════════════════`);
  console.log(`  ${book.name}  (${code})`);
  console.log(`══════════════════════════════════════════════`);
  console.log(`  Verses parsed            ${verses}`);
  console.log(`  Verses missing in align  ${noVerseInAlign}`);
  console.log(`  Content words (no stops) ${contentTokens}`);
  console.log(`  ── matched to a Strong's ${matched}  (${pct(matched)})`);
  console.log(`     ↳ lemma resolved      ${lemmaOk}  (${pct(lemmaOk)})`);
  console.log(`     ↳ form resolved       ${formOk}  (${pct(formOk)})`);
  console.log(`  ── unmatched             ${contentTokens - matched}  (${pct(contentTokens - matched)})`);

  console.log(`\n  Sample resolutions:`);
  for (const s of sampleResolved) console.log(`    ${s}`);

  const misses = [...missCounts.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`\n  Top unmatched content words (${misses.length} unique):`);
  for (const [w, n] of misses.slice(0, 30)) {
    console.log(`    ${String(n).padStart(3)}×  ${w}`);
  }
}

console.log("Meaning-layer coverage test");
console.log("Books:", BOOKS.join(", "));
for (const b of BOOKS) testBook(b);
