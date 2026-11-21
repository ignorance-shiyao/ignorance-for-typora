import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const toml = readFileSync(new URL("../theme/ignorance/theme.toml", import.meta.url), "utf8");
const css = readFileSync(new URL("../theme/src/theme.css", import.meta.url), "utf8");

// Typora's diagram renderer reads --color-muted-bg and --color-code-border from the computed style and
// only accepts plain colors, so every palette needs hex values for both modes.
test("every palette defines hex diagram colors for light and dark", () => {
  const blocks = toml.split(/^\[variants\.palette\.choices\.[a-z]+\.vars\.(?:light|dark)\]$/m).slice(1);
  assert.equal(blocks.length, 16);
  for (const block of blocks) {
    assert.match(block, /^diagram-fill = "#[0-9A-F]{6}"$/m);
    assert.match(block, /^diagram-border = "#[0-9A-F]{6}"$/m);
  }
});

test("theme.css feeds the diagram colors to the renderer without color-mix", () => {
  assert.match(css, /--color-muted-bg:\s*var\(--theme-diagram-fill\)/);
  assert.match(css, /--color-code-border:\s*var\(--theme-diagram-border\)/);
});
