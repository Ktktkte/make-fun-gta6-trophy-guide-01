// Leonida Trophy Guide — submission program.
//
// Hands the guide in: copies app/ and screenshots/ from this repository into the
// output directory and writes output/dossier.json with buildDossier from
// vendor/makefun-frontend.ts, the kit's dossier library.
//
//   node main.ts            writes to /output (the grader's directory)
//   MAKEFUN_OUTPUT_DIR=dir node main.ts
//                           writes to dir instead (local runs)
//
// The output directory itself is never removed: on the grader it is a mount, and
// deleting it fails. This program only clears the three entries it owns inside
// it (app/, screenshots/, dossier.json) and then copies fresh, so running it
// twice over the same directory still produces byte-identical output.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

// The dossier caps are the competition gate's own limits (competition.yaml).
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function outputDir() {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv && fromEnv.trim().length > 0) return resolve(fromEnv);
  return "/output";
}

function repoDir() {
  return resolve(dirname(fileURLToPath(import.meta.url)));
}

function clearOwnedEntries(outDir: string) {
  // Only the three entries this program owns. Anything else in the directory
  // is left alone.
  for (const name of ["app", "screenshots", "dossier.json"]) {
    const target = join(outDir, name);
    if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  }
}

function handIn() {
  const repo = repoDir();
  const out = outputDir();
  mkdirSync(out, { recursive: true });
  clearOwnedEntries(out);
  cpSync(join(repo, "app"), join(out, "app"), { recursive: true });
  cpSync(join(repo, "screenshots"), join(out, "screenshots"), { recursive: true });
  const dossier = buildDossier(out, DOSSIER_CAPS);
  writeFileSync(join(out, "dossier.json"), dossier);
  console.log(`wrote ${out}/dossier.json (${dossier.length} bytes)`);
}

handIn();
