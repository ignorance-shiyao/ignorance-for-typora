import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync("advanced/ignorance.advanced/typora-extension.json", "utf8"));
const css = readFileSync("theme/src/theme.css", "utf8");
// Typora matches inline rules against the block text with markdown syntax characters replaced by spaces,
// so the markers around Rd in _~Rd~_ appear as two spaces on each side.
const rules = manifest.contributes.inlineRules.filter((r) => r.id.startsWith("vl-"));

test("every color code has a first and second position rule matching only the bare code", () => {
  const red1 = new RegExp(rules.find((r) => r.id === "vl-1-Rd").pattern);
  const gold2 = new RegExp(rules.find((r) => r.id === "vl-2-Gd").pattern);
  const first = (src) => src.match(new RegExp(red1, "u"))?.[0];
  assert.equal(first("**加粗**  Rd  ，"), "Rd");
  assert.equal(first("  BuRd  "), undefined);
  assert.equal(first("Rd 单独的文字"), undefined);
  assert.equal("  BnGd  ".match(new RegExp(gold2, "u"))?.[0], "Gd");
  assert.equal("  Gd  ".match(new RegExp(gold2, "u"))?.[0], undefined);
  assert.equal("  Bu!  ".match(new RegExp(rules.find((r) => r.id === "vl-bang").pattern, "u"))?.[0], "!");
});

test("theme hides the suffix and colors the previous element", () => {
  assert.match(css, /em:has\(> sub \[class\*="vl1-"\]\) \{ font-size: 0; \}/);
  assert.match(css, /--vl1: #d1242f/);
});
