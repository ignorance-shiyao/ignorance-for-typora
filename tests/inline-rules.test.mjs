import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../advanced/ignorance.advanced/typora-extension.json", import.meta.url), "utf8"));
const rules = manifest.contributes.inlineRules;

// What each rule would wrap in a span: the matched ranges of one line, in order.
const spans = (text) =>
  rules
    .flatMap((r) => [...text.matchAll(new RegExp(r.pattern, "gu"))].map((m) => ({ id: r.id, class: r.class, text: m[0], at: m.index, title: r.title && r.title.replace(/\$(\d)/g, (_, i) => m[i] ?? "") })))
    .sort((a, b) => a.at - b.at);

const hidden = (list) => list.filter((s) => s.class === "ib-syn").map((s) => s.text);

test("every inline rule pattern compiles", () => {
  for (const r of rules) assert.doesNotThrow(() => new RegExp(r.pattern, r.flags ?? ""), r.id);
});

test("a badge shows only label and value; the wrapper is hidden", () => {
  const list = spans("((blue:版本 | 2.0))");
  assert.deepEqual(hidden(list), ["((blue:", "))"]);
  const body = list.find((s) => s.class.startsWith("ib-badge"));
  assert.equal(body.text, "版本 | 2.0");
  assert.equal(body.title, "版本 · 2.0");
});

test("spoiler, ruby and crumb keep their content and hide the wrapper", () => {
  assert.deepEqual(hidden(spans("((spoiler:答案))")), ["((spoiler:", "))"]);
  assert.equal(spans("((spoiler:答案))").find((s) => s.class === "ib-spoiler").text, "答案");
  const ruby = spans("((ruby:汉字 | hànzì))");
  assert.deepEqual(hidden(ruby), ["((ruby:", " | hànzì))"]);
  assert.equal(ruby.find((s) => s.class === "ib-ruby").text, "汉字");
  assert.equal(ruby.find((s) => s.class === "ib-ruby").title, "hànzì");
  assert.deepEqual(hidden(spans("((crumb:设置 > 外观))")), ["((crumb:", "))"]);
});

test("incomplete syntax is left visible", () => {
  assert.deepEqual(spans("((blue:版本 | 2.0"), []);
  assert.deepEqual(spans("((spoiler:答案"), []);
});

test("two badges on one line do not swallow each other", () => {
  const list = spans("((green:构建 | 通过)) ((red:测试 | 失败))");
  assert.deepEqual(hidden(list), ["((green:", "))", "((red:", "))"]);
  assert.deepEqual(list.filter((s) => s.class.startsWith("ib-badge")).map((s) => s.text), ["构建 | 通过", "测试 | 失败"]);
});
