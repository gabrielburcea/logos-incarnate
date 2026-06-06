#!/usr/bin/env node
/**
 * Download raw original-language source data for building meaning cards.
 *
 * This script ONLY downloads — it does not process. After it finishes you
 * can inspect the raw data in `data/meaning-raw/`, then run the (separate)
 * build script to produce the trimmed JSON bundles in `public/meaning/`.
 *
 * Sources (all public-domain or CC-BY 4.0):
 *   - openscriptures/strongs       Strong's Hebrew + Greek lexicons (JSON)
 *   - openscriptures/morphhb       WLC Hebrew OT, tagged with Strong's
 *   - STEPBible/STEPBible-Data     TAHOT (Hebrew OT) + TAGNT (Greek NT) — used
 *                                  for original-language forms + morphology
 *   - CrossWire KJV2003            KJV (1769) with embedded Strong's numbers —
 *                                  the English-word → Strong's alignment anchor
 *
 * Approximate disk usage after download: ~200 MB
 * Time: ~2–5 minutes depending on network
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'data', 'meaning-raw');

const SOURCES = [
  {
    name: 'strongs',
    url: 'https://github.com/openscriptures/strongs.git',
    description: "Strong's Hebrew + Greek lexicons (lemma, transliteration, definition)",
    license: 'Public domain',
  },
  {
    name: 'morphhb',
    url: 'https://github.com/openscriptures/morphhb.git',
    description: 'Westminster Leningrad Codex Hebrew OT — every word tagged with Strong\'s number and lemma',
    license: 'CC-BY 4.0',
  },
  {
    name: 'STEPBible-Data',
    url: 'https://github.com/STEPBible/STEPBible-Data.git',
    description: 'TAHOT + TAGNT — Hebrew/Greek surface forms + morphology (powers the per-form word study)',
    license: 'CC-BY 4.0',
  },
];

function run(cmd, cwd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function clone(source) {
  const target = path.join(RAW_DIR, source.name);
  if (await exists(target)) {
    console.log(`  ✓ already cloned — skipping (delete the folder to force a refresh)`);
    return;
  }
  // --depth 1 = grab only the latest commit, skip full git history.
  run(`git clone --depth 1 ${source.url} ${source.name}`, RAW_DIR);
}

/**
 * The CrossWire KJV2003 module ships as a SWORD ztext archive inside the
 * scrollmapper/bible_databases repo. We sparse-checkout just that one zip plus
 * the plain-text KJV.json (used as the canonical versification AND a per-verse
 * integrity check), unzip the module, and keep both under
 * data/meaning-raw/crosswire-kjv/.
 */
async function cloneCrosswireKJV() {
  const target = path.join(RAW_DIR, 'crosswire-kjv');
  if (await exists(target)) {
    console.log('  ✓ already present — skipping (delete the folder to force a refresh)');
    return;
  }
  const tmp = path.join(RAW_DIR, 'crosswire-kjv-tmp');
  await fs.rm(tmp, { recursive: true, force: true });
  run(
    'git clone --no-checkout --depth 1 --filter=blob:none ' +
      'https://github.com/scrollmapper/bible_databases.git crosswire-kjv-tmp',
    RAW_DIR
  );
  run(
    'git sparse-checkout set --no-cone /sources/en/KJV/KJV.zip /sources/en/KJV/KJV.json',
    tmp
  );
  run('git checkout', tmp);
  await fs.mkdir(target, { recursive: true });
  run(`unzip -o "sources/en/KJV/KJV.zip" -d "${target}"`, tmp);
  await fs.copyFile(
    path.join(tmp, 'sources/en/KJV/KJV.json'),
    path.join(target, 'KJV.json')
  );
  await fs.rm(tmp, { recursive: true, force: true });
  console.log('  ✓ crosswire-kjv ready (ztext module + KJV.json)');
}

async function ensureGitignore() {
  const gitignore = path.join(ROOT, '.gitignore');
  let gi = '';
  try {
    gi = await fs.readFile(gitignore, 'utf8');
  } catch {
    /* file may not exist — that's fine */
  }
  if (!gi.includes('data/meaning-raw')) {
    const addition =
      (gi.endsWith('\n') || gi === '' ? '' : '\n') +
      '\n# Raw meaning sources (regenerate with `npm run download:meaning`)\n' +
      'data/meaning-raw/\n';
    await fs.writeFile(gitignore, gi + addition);
    console.log('  ✓ Added data/meaning-raw to .gitignore');
  }
}

(async () => {
  await fs.mkdir(RAW_DIR, { recursive: true });
  console.log('=== Downloading meaning source data ===\n');
  console.log(`Target: ${RAW_DIR}\n`);

  for (const source of SOURCES) {
    console.log(`\n--- ${source.name} ---`);
    console.log(`  ${source.description}`);
    console.log(`  License: ${source.license}`);
    try {
      await clone(source);
    } catch (err) {
      console.error(`  ✗ Failed to clone ${source.name}:`, err.message);
      console.error('    You can retry by re-running this script.');
    }
  }

  console.log('\n--- crosswire-kjv ---');
  console.log('  KJV (1769) with embedded Strong\'s numbers — English-word → Strong\'s anchor');
  console.log('  License: Public domain (KJV text + Strong\'s); CrossWire grants a general public license');
  try {
    await cloneCrosswireKJV();
  } catch (err) {
    console.error('  ✗ Failed to fetch crosswire-kjv:', err.message);
    console.error('    You can retry by re-running this script.');
  }

  console.log('\n--- gitignore ---');
  await ensureGitignore();

  console.log('\n=== Done ===');
  console.log(`Raw data is at: ${RAW_DIR}\n`);
  console.log('What each folder contains:');
  console.log('  strongs/          JSON lexicons — keys are H#### / G####, values include');
  console.log('                    lemma (Hebrew/Greek), translit, definition, gloss.');
  console.log('  morphhb/          OSIS XML — one file per OT book. Every <w> element tags');
  console.log('                    the Hebrew word with lemma="…/Strong\'s/…" and gloss.');
  console.log('  STEPBible-Data/   Tabular text files. TAHOT_*.txt (Hebrew) and TAGNT_*.txt');
  console.log('                    (Greek) supply original-language surface forms + morphology.');
  console.log('  crosswire-kjv/    CrossWire KJV2003 SWORD module (ztext) + KJV.json. Every');
  console.log('                    KJV word is tagged with its Strong\'s number — this is the');
  console.log('                    English-word → Strong\'s alignment anchor.');
  console.log('\nNext step: inspect, then we write the build script that reads from here');
  console.log('and emits trimmed JSON into `public/meaning/`.');
})();
