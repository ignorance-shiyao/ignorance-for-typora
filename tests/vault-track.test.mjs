import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTrack, runTrack } from "../advanced/ignorance.value-track/index/track.js";

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

test("static chart snapshots resolve theme colors when SDK variables are empty", async () => {
  const { readFile } = await import("node:fs/promises");
  const { runInNewContext } = await import("node:vm");
  const attributes = new Map([["fill", "var(--typora-foreground)"]]);
  const summary = { setAttribute(name, value) { this[name] = value; } };
  const svg = {
    localName: "svg", namespaceURI: "http://www.w3.org/2000/svg",
    querySelectorAll: () => [svg],
    getAttribute: (key) => attributes.get(key) ?? "100",
    setAttribute: (key, value) => attributes.set(key, value),
    append() {},
  };
  let receive;
  let snapshot;
  const sdk = {
    theme: { vars: {}, dark: true },
    onMessage: (fn) => { receive = fn; }, onSnapshot: (fn) => { snapshot = fn; },
    autoHeight() {}, onOpen() {}, onTheme() {},
  };
  const output = { replaceChildren() {}, append() {} };
  const context = {
    window: { typora: { view: sdk }, addEventListener() {} },
    document: { querySelector: () => output, createElement: () => ({}), createElementNS: () => summary, importNode: () => svg, addEventListener() {} },
    DOMParser: class { parseFromString() { return { documentElement: svg }; } },
    XMLSerializer: class { serializeToString() { return "<svg/>"; } },
    getComputedStyle: () => ({ getPropertyValue: () => "" }), setInterval() {},
  };
  runInNewContext(await readFile(new URL("../advanced/ignorance.value-track/views/results.js", import.meta.url), "utf8"), context);
  receive({ chart: "<svg/>", summary: "平均 7.25" });
  await snapshot();
  assert.match(attributes.get("fill"), /^#[0-9a-f]{6}$/i);
  assert.equal(summary.fill, attributes.get("fill"));
});
