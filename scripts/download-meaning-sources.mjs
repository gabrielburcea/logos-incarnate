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
 *   - STEPBible/STEPBible-Data     TAHOT (Hebrew OT) + TAGNT (Greek NT) with
 *                                  KJV word-level alignment
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
    description: 'TAHOT + TAGNT — Hebrew/Greek text aligned to KJV English words (the anchor for cross-translation matching)',
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

  console.log('\n--- gitignore ---');
  await ensureGitignore();

  console.log('\n=== Done ===');
  console.log(`Raw data is at: ${RAW_DIR}\n`);
  console.log('What each folder contains:');
  console.log('  strongs/          JSON lexicons — keys are H#### / G####, values include');
  console.log('                    lemma (Hebrew/Greek), translit, definition, gloss.');
  console.log('  morphhb/          OSIS XML — one file per OT book. Every <w> element tags');
  console.log('                    the Hebrew word with lemma="…/Strong\'s/…" and gloss.');
  console.log('  STEPBible-Data/   Tabular text files. TAHOT_*.txt aligns Hebrew→KJV.');
  console.log('                    TAGNT_*.txt aligns Greek→KJV. This is the anchor that');
  console.log('                    lets us extend ⓘ icons to other translations.');
  console.log('\nNext step: inspect, then we write the build script that reads from here');
  console.log('and emits trimmed JSON into `public/meaning/`.');
})();
