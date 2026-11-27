// Aurora Squadron — the entrypoint (Node 22, standard library only). The game is
// this directory's game/ folder: plain static files a desktop browser loads
// offline (game/index.html and its ES modules, no library and no network
// request). The program hands the game in: it copies game/ and screenshots/
// from beside this file to /output and writes /output/dossier.json, the summary
// the judge reads, with the vendored make.fun library.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The entrypoint checks its own inputs before it copies anything: a missing
// game folder or an empty screenshots folder would hand in a broken entry, so
// it fails loudly instead, and it prints a short inventory of what went out.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error(`game/index.html is missing under ${gameDir}; nothing to hand in.`);
}
if (!existsSync(shotsDir) || readdirSync(shotsDir).filter((f) => /\.(jpg|jpeg|png)$/i.test(f)).length === 0) {
  throw new Error(`no screenshots under ${shotsDir}; the judge needs 3–4.`);
}

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of
// game files, in all, or a path under game/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// A short inventory, so a run can be checked at a glance.
function walk(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = walk(p);
      files += sub.files;
      bytes += sub.bytes;
    } else {
      files += 1;
      bytes += statSync(p).size;
    }
  }
  return { files, bytes };
}
const game = walk(join(out, 'game'));
const shots = readdirSync(join(out, 'screenshots'))
  .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
  .map((f) => `${f} ${statSync(join(out, 'screenshots', f)).size}B`)
  .join(', ');
console.log(`aurora-squadron: ${game.files} game files (${game.bytes} bytes); screenshots: ${shots}; dossier written to ${join(out, 'dossier.json')}`);
