import { test } from "node:test";
import assert from "node:assert/strict";
import { parseNaturalDate, formatNaturalDate } from "../advanced/ignorance.advanced/format/natural-date.js";

const baseline = "2026-11-22";
const cases = [
  ["明天", "2026-11-23"],
  ["后天", "2026-11-24"],
  ["下周一", "2026-11-23"],
  ["本周五", "2026-11-20", 1],
  ["本周五", "2026-11-27", 0],
  ["三天后", "2026-11-25"],
  ["两周后", "2026-12-06"],
  ["下个月 5 号", "2026-12-05"],
  ["12 月 1 日", "2026-12-01"],
  ["下个月 31 号", "2026-12-31"],
  ["tomorrow", "2026-11-23"],
];
for (const [input, expected, weekStart] of cases) {
  test(`parses ${input} with the requested week start`, () => {
    assert.equal(parseNaturalDate(input, baseline, { weekStart }), expected);
  });
}

test("unknown and invalid dates have an error position", () => {
  assert.throws(() => parseNaturalDate("随便写的字", baseline), /第 1 字符：无法识别/);
  assert.throws(() => parseNaturalDate("2 月 30 日", baseline), /第 \d+ 字符：日期超出/);
});

test("clamps relative month arithmetic and crosses a year boundary", () => {
  assert.equal(parseNaturalDate("一个月后", "2024-01-31"), "2024-02-29");
  assert.equal(parseNaturalDate("下个月 31 号", "2027-01-31"), "2027-02-28");
  assert.equal(parseNaturalDate("next monday", "2026-12-27"), "2026-12-28");
  assert.equal(parseNaturalDate("三天后", "2026-12-31"), "2027-01-03");
});

test("formats ISO, weekday and wiki dates", () => {
  assert.equal(formatNaturalDate("2026-11-23", "iso"), "2026-11-23");
  assert.equal(formatNaturalDate("2026-11-23", "weekday"), "2026-11-23（周一）");
  assert.equal(formatNaturalDate("2026-11-23", "wiki"), "[[2026-11-23]]");
});
