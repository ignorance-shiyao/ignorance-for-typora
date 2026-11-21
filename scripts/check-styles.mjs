// Style guard: no one-sided accent bar (a coloured border on one side only,
// thicker than 1px) in the theme or the slides. Run by build-theme.sh and npm test.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const files = ["theme/src/theme.css", "advanced/ignorance.advanced/slides/slides.css"];
const SIDE = /border-(?:left|right|inline-start|inline-end)(?:-width)?\s*:\s*([^;}]+)/g;

export function findSideBars(css) {
  const hits = [];
  for (const m of css.matchAll(SIDE)) {
    const value = m[1].trim();
    if (/^(0|none|transparent)\b/.test(value)) continue;
    const width = /(\d*\.?\d+)(px|em|rem)/.exec(value);
    const px = width ? Number(width[1]) * (width[2] === "px" ? 1 : 16) : 1;
    if (px > 1) hits.push(m[0]);
  }
  return hits;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let failed = false;
  for (const file of files) {
    for (const hit of findSideBars(readFileSync(root + file, "utf8"))) {
      console.error(`${file}: one-sided accent bar: ${hit}`);
      failed = true;
    }
  }
  if (failed) process.exit(1);
  console.log("style check: no one-sided accent bars");
}
