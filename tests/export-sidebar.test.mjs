import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../theme/src/theme.css", import.meta.url), "utf8");

test("exported outline sidebar hides heading marks with a zero-width font", () => {
  const face = /@font-face\s*\{[^}]*font-family:\s*"ib-nomark"[^}]*\}/.exec(css);
  assert.ok(face, "ib-nomark @font-face exists");
  for (const code of ["U+0023", "U+002A", "U+0060", "U+007E"]) assert.ok(face[0].includes(code), code);
  assert.match(face[0], /size-adjust:\s*1%/);
  assert.match(css, /\.typora-export-sidebar\s*\{[^}]*font-family:\s*"ib-nomark"/);
});

test("exported outline sidebar overrides the exporter's level indents", () => {
  for (const level of [2, 3]) {
    assert.match(css, new RegExp(`\\.typora-export-sidebar \\.typora-export-outline-level-${level}\\s*\\{[^}]*padding-left:[^}]*!important`));
  }
});
