// main.ts — hands this guide in: copies app/ and screenshots/ to the output
// directory and writes output/dossier.json with the kit's buildDossier.
// Written for this entry. The output directory itself is never removed: the
// grader bind-mounts it, so deleting it would fail with a permission error.
import { buildDossier } from './vendor/makefun-frontend.ts';
import {
  cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// Where the dossier goes: MAKEFUN_OUTPUT_DIR outside the grader, /output in it.
function outputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv && fromEnv.length > 0) return resolve(fromEnv);
  return '/output';
}

// Copy one tree into the output dir, creating directories as needed.
function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    const src = join(from, entry);
    const dst = join(to, entry);
    if (statSync(src).isDirectory()) copyTree(src, dst);
    else cpSync(src, dst);
  }
}

// Clear only the three entries this program owns inside the output dir, so a
// second run over the same directory cannot leave stale files behind. The
// output directory itself is left alone.
function clearOwned(out: string): void {
  for (const name of ['app', 'screenshots', 'dossier.json']) {
    const target = join(out, name);
    if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  }
}

// The gate's caps for this competition: text at most 163,840 bytes, 3–4
// screenshots of at most 262,144 bytes each, app/ at most 993 files and
// 48 MiB, paths at most 1,000 bytes.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function main(): void {
  const out = outputDir();
  mkdirSync(out, { recursive: true });
  clearOwned(out);
  copyTree(join(HERE, 'app'), join(out, 'app'));
  copyTree(join(HERE, 'screenshots'), join(out, 'screenshots'));
  const dossier = buildDossier(out, CAPS);
  writeFileSync(join(out, 'dossier.json'), dossier);
  const size = statSync(join(out, 'dossier.json')).size;
  const shotCount = readdirSync(join(out, 'screenshots')).length;
  console.log(`wrote ${join(out, 'dossier.json')} (${size} bytes, ${shotCount} screenshots)`);
  // A sanity read: the dossier must parse back as the file we just wrote.
  JSON.parse(readFileSync(join(out, 'dossier.json'), 'utf-8'));
}

main();
