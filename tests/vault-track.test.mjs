import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTrack, runTrack } from "../advanced/ignorance.vault/index/track.js";

const notes = [
  { path: "日记/2026-11-16.md", properties: { date: "2026-11-16", 睡眠: 7 }, tags: ["运动"] },
  { path: "日记/2026-11-18.md", properties: { 睡眠: "7.5h" }, tags: [] },
  { path: "日记/2026-11-22.md", properties: {}, tags: ["运动"] },
  { path: "日记/2026-11-23.md", properties: { 睡眠: 6 }, tags: [] },
];

test("plots numeric and unit values and marks missing notes and the goal", () => {
  const result = runTrack(parseTrack("from: 日记/\nfield: 睡眠\nrange: last 30d\ngoal: 7.5"), notes, "2026-11-23");
  assert.deepEqual(result.points.map(({ value }) => value), [7, 7.5, 6]);
  assert.equal(result.skipped, 1);
  assert.equal([...result.chart.matchAll(/<circle\b/g)].length, 3);
  assert.match(result.chart, /data-goal="7.5"/);
});

test("computes weekly average values starting Monday", () => {
  const result = runTrack(parseTrack("field: 睡眠\nagg: avg\nby: week"), notes, "2026-11-23");
  assert.deepEqual(result.points.map(({ date, value }) => [date, value]), [["2026-11-16", 7.25], ["2026-11-23", 6]]);
});

test("renders each day in a range as a heatmap cell", () => {
  const result = runTrack(parseTrack("field: #运动\ntype: heatmap\nrange: last 4d"), notes, "2026-11-23");
  assert.equal([...result.chart.matchAll(/data-day=/g)].length, 4);
  assert.equal(result.points.length, 2);
  assert.match(result.chart, /data-day="2026-11-22"/);
});
