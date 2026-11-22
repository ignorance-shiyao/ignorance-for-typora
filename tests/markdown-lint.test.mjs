import { test } from "node:test";
import assert from "node:assert/strict";
import { lintMarkdown } from "../advanced/ignorance.advanced/format/lint.js";

test("formats headings, lists, prose and whitespace in one idempotent pass", () => {
  const input = "#标题\n正文Typora, 版本2!\n\n\n####跳级\n* 项目\n+ _次项_\n#第二标题\n9. 甲\n4. 乙  \n\n";
  const expected = "# 标题\n\n正文 Typora，版本 2！\n\n## 跳级\n\n- 项目\n- *次项*\n\n## 第二标题\n\n1. 甲\n2. 乙  \n";
  assert.equal(lintMarkdown(input), expected);
  assert.equal(lintMarkdown(expected), expected);
});

test("preserves protected content and its CRLF line endings", () => {
  const blocks = [
    "---\r\ntitle: 中a  \r\n---",
    "~~~~md\r\n中abc  \r\n~~~\r\n#不是标题\r\n~~~~",
    "$$\r\na中b  \r\n$$",
    "| 中文abc | 英文x |\r\n| :---: | --- |\r\n| A中文 | B中文 |",
    "<!--\r\n#注释abc\r\n-->",
    "    code中文  ",
  ];
  const prefix = blocks.join("\r\n\r\n");
  const inline = "`中文abc` [示例](./中a(x).md) $a中b$";
  assert.equal(lintMarkdown(prefix + "\r\n\r\n" + inline + " 中文abc"), prefix + "\r\n\r\n" + inline + " 中文 abc\r\n");
});

test("supports independent settings and preserves nested list levels", () => {
  const input = "* 中文abc\n  + 子项\n    8. 孙项\n    3. 孙项\n* 末项";
  assert.equal(lintMarkdown(input, { lintBullets: false, lintIndent: 4 }), "* 中文 abc\n    + 子项\n        1. 孙项\n        2. 孙项\n* 末项\n");
  assert.equal(lintMarkdown("中文, abc   \n", { lintPunctuation: false, lintHardBreaks: false }), "中文, abc\n");
});

test("keeps inline literals, decimals and reference destinations while styling prose", () => {
  assert.equal(lintMarkdown("中文(版本2.5),继续\n[引用]: ./文档abc.md\n中文 `a_b中c`"), "中文（版本 2.5），继续\n[引用]: ./文档abc.md\n中文 `a_b中c`\n");
});

test("keeps fenced code that starts on a list item and preserves ordered nesting", () => {
  const fencedList = "* ```js\n  const 中abc = 1;\n  ```";
  assert.equal(lintMarkdown(fencedList + "\n\n中文abc"), fencedList + "\n\n中文 abc\n");
  assert.equal(lintMarkdown("9. 父项\n   + 子项\n9. 次项"), "1. 父项\n   - 子项\n2. 次项\n");
});

test("preserves multi-line inline code and keeps blockquotes as blockquotes", () => {
  assert.equal(lintMarkdown("正文 ``a中文\nb中文``。\n> 中文abc, 继续"), "正文 ``a中文\nb中文``。\n> 中文 abc，继续\n");
});

test("normalizing list indent keeps wrapped continuations in their item", () => {
  assert.equal(lintMarkdown("- 父项\n    * 子项\n      续行abc"), "- 父项\n  - 子项\n    续行 abc\n");
});

test("registered formatter reads current settings and preserves the spacing command", async (t) => {
  const { activate } = await import("../advanced/ignorance.advanced/main.js");
  const formatters = new Map();
  let settings = {};
  const savedTypora = globalThis.typora;
  t.after(() => { globalThis.typora = savedTypora; });
  globalThis.typora = {
    settings: { get: () => settings },
    formatters: {
      register(id, format, metadata) {
        formatters.set(id, { format, ...metadata });
        return { dispose() { formatters.delete(id); } };
      },
    },
  };
  const subscriptions = [];
  await activate({ subscriptions });
  const { format, title } = formatters.get("markdown-lint");
  assert.equal(title, "整理 Markdown");
  assert.equal(format("+ 中文abc"), "- 中文 abc\n");
  settings = { lintBullets: false };
  assert.equal(format("+ 中文abc"), "+ 中文 abc\n");
  assert.equal(formatters.get("cjk-spacing").format("+ 中文abc"), "+ 中文 abc");
  subscriptions.forEach((subscription) => subscription.dispose());
  assert.equal(formatters.size, 0);
});
