// One-shot: convert the six PNG illustrations in src/assets/login/
// to WebP at 80% quality. Originals stay on disk so we can roll back
// or compare. Run with: node scripts/convert-login-assets.mjs
import sharp from "sharp";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { statSync } from "node:fs";

const DIR = "src/assets/login";

const entries = (await readdir(DIR)).filter((f) => f.endsWith(".png"));

let savedBefore = 0;
let savedAfter = 0;

for (const file of entries) {
  const inPath = join(DIR, file);
  const outPath = join(DIR, file.replace(/\.png$/i, ".webp"));
  await sharp(inPath).webp({ quality: 80, effort: 6 }).toFile(outPath);
  const before = statSync(inPath).size;
  const after = statSync(outPath).size;
  savedBefore += before;
  savedAfter += after;
  const pct = (((before - after) / before) * 100).toFixed(0);
  console.log(`${file.padEnd(32)} ${(before / 1024).toFixed(0).padStart(4)}KB → ${(after / 1024).toFixed(0).padStart(4)}KB  (-${pct}%)`);
}

const totalPct = (((savedBefore - savedAfter) / savedBefore) * 100).toFixed(0);
console.log(`\nTotal: ${(savedBefore / 1024).toFixed(0)}KB → ${(savedAfter / 1024).toFixed(0)}KB  (-${totalPct}%)`);
