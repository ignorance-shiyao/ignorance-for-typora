import { test } from "node:test";
import assert from "node:assert/strict";
import { cjkSpacing } from "../advanced/ignorance.advanced/format/cjk-spacing.js";

test("spaces between CJK and Latin or digits", () => {
  assert.equal(cjkSpacing("用Typora写2篇文章"), "用 Typora 写 2 篇文章");
});

test("idempotent", () => {
  const once = cjkSpacing("在iPhone上用AI");
  assert.equal(cjkSpacing(once), once);
});

test("leaves inline code, math, URLs and HTML alone", () => {
  assert.equal(cjkSpacing("运行`npm测试`和$a中b$"), "运行`npm测试`和$a中b$");
  assert.equal(cjkSpacing("见https://例子.com/a中"), "见https://例子.com/a中");
  assert.equal(cjkSpacing('<span title="a中">x</span>'), '<span title="a中">x</span>');
});

test("spaces a link label but keeps its URL", () => {
  assert.equal(cjkSpacing("[文档v2](./a中b.md)"), "[文档 v2](./a中b.md)");
});

test("leaves code fences, math blocks and front matter alone", () => {
  const md = ["---", "title: 中文abc", "---", "正文abc", "```js", "const 中a = 1", "```", "$$", "x中y", "$$", "尾部OK"].join("\n");
  const expected = ["---", "title: 中文abc", "---", "正文 abc", "```js", "const 中a = 1", "```", "$$", "x中y", "$$", "尾部 OK"].join("\n");
  assert.equal(cjkSpacing(md), expected);
});

test("a shorter fence marker does not close a longer fence", () => {
  const md = ["````md", "```", "中a", "````", "中a"].join("\n");
  assert.equal(cjkSpacing(md), ["````md", "```", "中a", "````", "中 a"].join("\n"));
});
