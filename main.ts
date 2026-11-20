// GTA 6 trophy guide entry (Node 22, standard library only).
//
// The guide itself is plain static files under app/: an index page, a
// stylesheet, the tracker script and the trophy data. No build step, no
// network at runtime — a browser opens app/index.html and the checklist
// just works from those files.
//
// This program hands the guide in. It copies app/ and screenshots/ from
// beside this file into the output folder and writes dossier.json there,
// the summary the judge reads (the screenshots, the first load's files and
// bytes, and the source), using the vendored make.fun library. Leave
// vendor/makefun-frontend.ts exactly as it is: the scorer requires the
// dossier to be byte for byte what its own copy of the library writes.
//
// Serve the guide locally with `node serve.ts`, then open
// http://localhost:8080 to try it in a browser.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The folder this file lives in, and the folder the dossier goes to.
const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the whole guide, then the screenshots, into the output folder.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Write the dossier the judge reads. The caps below are the scorer's own
// (reference/gate.json): only text_max_bytes shapes the bytes; the others
// refuse an entry the scorer would refuse — more than 4 screenshots or one
// over 256 KiB, more than 993 files and directories in app/ or 48 MiB of
// app files. app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json, so the guide is kept small on purpose.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
