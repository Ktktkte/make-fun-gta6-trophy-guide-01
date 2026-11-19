// Leonida Trophy Guide — entry program for gta6-trophy-guide-01 (Node 22, standard library only).
//
// The guide itself is app/: plain static files, no build step. app/index.html opens in a browser,
// app/app.js renders the checklist and tracker, app/style.css is the look, and
// app/data/trophies.json holds all 55 official PS5 trophies with a guide in my own words, its
// sources, its kind, its roadmap stage and its missable flag. The app fetches nothing at runtime
// beyond that one local JSON file, so it works with the network off.
//
// This program hands the entry in: it copies app/ and screenshots/ from beside this file into
// /output and writes /output/dossier.json — the summary the judge reads (screenshots, first-load
// files and bytes, and source) — using the vendored make.fun library. vendor/makefun-frontend.ts
// must stay exactly as the kit shipped it, or the scorer's own copy of the dossier will differ.
//
// To try it locally: `node serve.ts`, then open http://localhost:8080.
// To build what the grader sees: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`
// (outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output).
// The screenshots in screenshots/ are renders of this app taken by its maker at 1280x800;
// the first by name is the cover the judge sees first.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The caps below mirror the scorer's own limits, so a bad entry fails here instead of at grading:
// at most 4 screenshots, none over 256 KiB; app/ at most 993 files and directories and 48 MiB in
// all, since app/, screenshots/ and dossier.json share /output's own 1000-entry cap. Only
// text_max_bytes changes the dossier's bytes; the other limits only refuse an entry the scorer
// would refuse anyway.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
