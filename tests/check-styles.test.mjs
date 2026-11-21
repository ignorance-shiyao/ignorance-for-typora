import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { findSideBars } from "../scripts/check-styles.mjs";

test("detects one-sided accent bars", () => {
  assert.equal(findSideBars(".a{border-inline-start:4px solid red}").length, 1);
  assert.equal(findSideBars(".a{border-left: .25em solid red}").length, 1);
  assert.equal(findSideBars(".a{border-inline-start-width:.25em}").length, 1);
});

test("allows hairlines and resets", () => {
  assert.equal(findSideBars(".a{border-inline-start:1px solid red;border-left:0;border-inline-start-width:1px}").length, 0);
});

test("theme and slides contain no one-sided accent bar", () => {
  for (const f of ["theme/src/theme.css", "advanced/ignorance.advanced/slides/slides.css"]) {
    assert.deepEqual(findSideBars(readFileSync(new URL("../" + f, import.meta.url), "utf8")), [], f);
  }
});
