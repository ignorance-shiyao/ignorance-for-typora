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
    commands: { register: () => ({ dispose() {} }) },
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

test("preserves footnote references and definitions", () => {
  const input = "正文[^1]\n\n[^1]: 脚注内容\n";
  assert.equal(lintMarkdown(input), input);
  assert.equal(lintMarkdown("正文[^note-a]继续abc。\n\n[^note-a]: 说明,test\n"), "正文[^note-a]继续 abc。\n\n[^note-a]: 说明,test\n");
});

test("preserves English punctuation inside a mixed-language line", () => {
  const input = "He said: hello, world. 这是中文。\n";
  assert.equal(lintMarkdown(input), input);
});

test("localizes punctuation after the English sentence ends", () => {
  assert.equal(lintMarkdown("The cat sat. 然后它走了."), "The cat sat. 然后它走了。\n");
});

const punctuationCases = [
  ["中文(版本2.5),继续", "中文（版本 2.5），继续"],
  ["中文abc, 继续", "中文 abc，继续"],
  ["正文Typora, 版本2!", "正文 Typora，版本 2！"],
  ["价格是3,000元,请确认!", "价格是 3,000 元，请确认！"],
  ["你好, world", "你好，world"],
  ["Hello, 世界", "Hello，世界"],
  ["He said: hello, world. 这是中文。", "He said: hello, world. 这是中文。"],
  ["The cat sat. 然后它走了.", "The cat sat. 然后它走了。"],
  ["f(x) = g(y), see docs.", "f(x) = g(y), see docs."],
  ["函数(foo)与(bar)", "函数（foo）与（bar）"],
  ["正文[^1]\n\n[^1]: 说明,test", "正文[^1]\n\n[^1]: 说明,test"],
];

for (const [input, expected] of punctuationCases) {
  test(`formats punctuation per acceptance spec: ${input}`, () => {
    const options = { lintFinalNewline: false };
    assert.equal(lintMarkdown(input, options), expected);
    assert.equal(lintMarkdown(expected, options), expected);
  });
}

test("preserves balanced Markdown link destinations with nested parentheses", () => {
  const input = "[计划](./版本(初稿(2)).md) 中文ABC";
  const expected = "[计划](./版本(初稿(2)).md) 中文 ABC\n";
  assert.equal(lintMarkdown(input), expected);
  assert.equal(lintMarkdown(expected), expected);
  const image = "![标记](./版本\\(存档\\)(初稿(2)).png) 中文ABC";
  assert.equal(lintMarkdown(image), "![标记](./版本\\(存档\\)(初稿(2)).png) 中文 ABC\n");
});
