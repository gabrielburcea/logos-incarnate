import fs from 'node:fs';
const PUB = 'public/meaning';
const heb = JSON.parse(fs.readFileSync(PUB + '/hebrew-lexicon.json'));
const gr  = JSON.parse(fs.readFileSync(PUB + '/greek-lexicon.json'));
const occ = JSON.parse(fs.readFileSync(PUB + '/occurrences.json'));
const kjv = JSON.parse(fs.readFileSync(PUB + '/alignments/KJV.json'));

function show(name, code, lex) {
  const entry = lex[code];
  if (!entry) { console.log('  X ' + code + ' missing'); return; }
  console.log('  ' + name);
  console.log('    Lemma:    ' + entry.lemma);
  console.log('    Translit: ' + entry.translit);
  console.log('    Def:      ' + entry.definition);
  if (occ[code]) console.log('    Verses:   ' + occ[code].length);
}

console.log('=== A few famous OT words ===');
show('H5828 (ezer / helper)',  'H5828', heb);
show('H1254 (bara / created)', 'H1254', heb);
show('H120  (adam / man)',     'H120',  heb);
show('H3068 (YHWH)',           'H3068', heb);

console.log('\n=== A few famous NT words ===');
show('G2316 (theos / God)',    'G2316', gr);
show('G3056 (logos / word)',   'G3056', gr);
show('G26   (agape / love)',   'G26',   gr);
show('G5547 (christos)',       'G5547', gr);

console.log('\n=== KJV alignment: Gen 2:18 (the helper verse) ===');
const gen218 = kjv['GEN.2.18'] || {};
for (const [eng, codes] of Object.entries(gen218)) {
  console.log('  ' + eng.padEnd(14) + ' -> ' + codes.join(', '));
}

console.log('\n=== KJV alignment: John 3:16 ===');
const jhn316 = kjv['JHN.3.16'] || {};
for (const [eng, codes] of Object.entries(jhn316)) {
  console.log('  ' + eng.padEnd(14) + ' -> ' + codes.join(', '));
}
