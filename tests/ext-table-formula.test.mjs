import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateTable } from "../advanced/ignorance.table-tools/format/table-formula.js";

test("calculates row expressions and aggregate ranges referencing calculated cells", () => {
  const rows = [["甲", "2", "3", ""], ["乙", "4", "5", ""], ["合计", "", "", ""]];
  const result = calculateTable(rows, "$4 = $2 * $3; @>$4 = sum(@2..@-1)");
  assert.deepEqual(result.rows, [["甲", "2", "3", "6"], ["乙", "4", "5", "20"], ["合计", "", "", "26"]]);
  assert.deepEqual(result.errors, []);
  assert.equal(rows[0][3], "");
});

test("marks invalid references and circular dependencies with errors", () => {
  const missing = calculateTable([["3", ""]], "$2 = $4");
  assert.deepEqual(missing.rows, [["3", "#ERR"]]);
  assert.match(missing.errors.join(" "), /\$2 = \$4.*列/);
  const cycle = calculateTable([["", ""]], "$1 = $2; $2 = $1");
  assert.deepEqual(cycle.rows, [["#ERR", "#ERR"]]);
  assert.match(cycle.errors.join(" "), /循环/);
});

test("reports the error position for invalid expressions and supports operator precedence", () => {
  assert.match(calculateTable([[""]], "$1 = 1 + )").errors.join(" "), /第 \d+ 字符/);
  assert.deepEqual(calculateTable([[""]], "$1 = -(2 + 3 * 4) / 2").rows, [["-7"]]);
});

test("aggregates values and resolves absolute and last-row references", () => {
  const original = [["2", ""], ["7", ""], ["11", ""]];
  assert.deepEqual(calculateTable(original, "@>$2 = avg(@2$1..@-1$1) + min(8, 6) + max(3, 4) + count(8, 9)").rows,
    [["2", ""], ["7", ""], ["11", "16.5"]]);
});
