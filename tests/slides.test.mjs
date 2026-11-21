import { test } from "node:test";
import assert from "node:assert/strict";
import { splitSlides, parseInline, plainText, safeUrl, headingText, slideKey, footnoteDefinitions } from "../advanced/ignorance.advanced/slides/core.js";

const doc = "root";
const b = (id, type, text, attrs = {}, parent = doc, depth = 0) => ({ id, type, text, attrs, depth, parent });

test("splits on top-level rules and drops blank paragraphs", () => {
  const slides = splitSlides([
    b("1", "heading", "# 标题", { level: 1 }),
    b("2", "paragraph", "第一页"),
    b("3", "hr", "---"),
    b("4", "paragraph", ""),
    b("5", "heading", "## 第二页", { level: 2 }),
    b("6", "paragraph", "内容"),
  ]);
  assert.equal(slides.length, 2);
  assert.deepEqual(slides.map((s) => s.title), ["标题", "第二页"]);
  assert.equal(slides[1].firstId, "5");
});

test("without rules, h1 and h2 start new slides but h3 does not", () => {
  const slides = splitSlides([
    b("1", "heading", "# A", { level: 1 }),
    b("2", "heading", "## B", { level: 2 }),
    b("3", "heading", "### C", { level: 3 }),
    b("4", "paragraph", "x"),
  ]);
  assert.deepEqual(slides.map((s) => s.nodes.map((n) => n.id)), [["1"], ["2", "3", "4"]]);
});

test("children are nested under their parent", () => {
  const slides = splitSlides([
    b("q", "blockquote", undefined, { alertType: "tip" }),
    b("t", "alert_title", "[!TIP]", {}, "q", 1),
    b("p", "paragraph", "内容", {}, "q", 1),
  ]);
  assert.equal(slides[0].nodes[0].children.length, 2);
});

test("front matter and empty documents", () => {
  assert.deepEqual(splitSlides([]), []);
  assert.equal(splitSlides([b("m", "meta_block", "title: x"), b("p", "paragraph", "正文")])[0].nodes[0].id, "p");
});

test("inline markdown", () => {
  assert.deepEqual(parseInline("a **b *c* d** `d` ==e== ~~f~~"), [
    { type: "text", value: "a " },
    { type: "strong", children: [{ type: "text", value: "b " }, { type: "em", children: [{ type: "text", value: "c" }] }, { type: "text", value: " d" }] },
    { type: "text", value: " " },
    { type: "code", value: "d" },
    { type: "text", value: " " },
    { type: "mark", children: [{ type: "text", value: "e" }] },
    { type: "text", value: " " },
    { type: "del", children: [{ type: "text", value: "f" }] },
  ]);
});

test("links, images, kbd and unknown HTML", () => {
  const nodes = parseInline('[文档](https://a.b) ![图](x.png "t") <kbd>⌘</kbd><span class="x">y</span>');
  assert.equal(nodes[0].type, "link");
  assert.equal(nodes[0].href, "https://a.b");
  assert.deepEqual(nodes[2], { type: "image", alt: "图", src: "x.png" });
  assert.deepEqual(nodes[4], { type: "kbd", value: "⌘" });
  assert.deepEqual(nodes[5], { type: "text", value: "y" });
});

test("code spans keep their content literal", () => {
  assert.deepEqual(parseInline("`**x**`"), [{ type: "code", value: "**x**" }]);
});

test("plain text and heading text", () => {
  assert.equal(plainText("**粗** 和 [链接](https://a)"), "粗 和 链接");
  assert.equal(headingText({ text: "## 标题 ##" }), "标题");
});

test("only safe URLs pass", () => {
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("https://a.b"), "https://a.b");
  assert.equal(safeUrl("./a.png", { image: true }), null);
  assert.equal(safeUrl("data:image/png;base64,AA", { image: true }), "data:image/png;base64,AA");
  assert.equal(safeUrl("data:text/html,x", { image: true }), null);
});

test("inline components from Ignorance", () => {
  assert.deepEqual(parseInline("((green:构建 | 通过))"), [{ type: "badge", color: "green", label: "构建", value: "通过" }]);
  assert.deepEqual(parseInline("((spoiler:答案))"), [{ type: "spoiler", value: "答案" }]);
  assert.deepEqual(parseInline("((ruby:汉字 | hànzì))"), [{ type: "ruby", value: "汉字", reading: "hànzì" }]);
  assert.deepEqual(parseInline("((crumb:设置 > 外观))"), [{ type: "crumb", parts: ["设置", "外观"] }]);
  assert.deepEqual(parseInline("==🟢完成=="), [{ type: "mark", color: "green", children: [{ type: "text", value: "完成" }] }]);
  assert.equal(plainText("((green:构建 | 通过)) ((crumb:a > b))"), "构建 通过 a › b");
});

test("layout comments and the cover fallback", async () => {
  const { slideLayout } = await import("../advanced/ignorance.advanced/slides/core.js");
  assert.deepEqual(slideLayout([b("c", "html_block", "<!-- layout: default | 市场洞察 -->"), b("h", "heading", "## T", { level: 2 })]), { layout: "default", tag: "市场洞察" });
  assert.deepEqual(slideLayout([b("c", "html_block", "<!-- layout: image-full -->")]), { layout: "image-full", tag: "" });
  assert.deepEqual(slideLayout([b("c", "html_block", "<!-- layout: wobble -->")]), { layout: "default", tag: "" });
  assert.equal(slideLayout([b("h", "heading", "# 封面", { level: 1 }), b("p", "paragraph", "副标题")]).layout, "cover");
  assert.equal(slideLayout([b("c", "html_block", "<!-- 说明 -->"), b("h", "heading", "## 二级", { level: 2 })]).layout, "default");
});

test("kpi items split into value and label", async () => {
  const { kpiParts } = await import("../advanced/ignorance.advanced/slides/core.js");
  assert.deepEqual(kpiParts("**+38%** 远程协作渗透率"), { value: "+38%", label: "远程协作渗透率" });
  assert.deepEqual(kpiParts("没有数字"), { value: "", label: "没有数字" });
});

test("icon shortcodes like :bolt: are dropped from slide text", () => {
  assert.equal(plainText(":bolt: **快**"), "快");
  assert.equal(plainText("时间 12:30:45"), "时间 12:30:45");
});

test("slideKey changes only when the slide's own content changes", () => {
  const blocks = (b, c) => [
    { id: "1", type: "heading", text: "# A", attrs: { level: 1 }, parent: null },
    { id: "2", type: "paragraph", text: b, parent: null },
    { id: "3", type: "hr", text: "---", parent: null },
    { id: "4", type: "paragraph", text: c, parent: null },
  ];
  const [a1, b1] = splitSlides(blocks("x", "y"));
  const [a2, b2] = splitSlides(blocks("x", "y changed"));
  assert.equal(slideKey(a1), slideKey(a2));
  assert.notEqual(slideKey(b1), slideKey(b2));
});

test("inline HTML comments are dropped from slide text", () => {
  assert.equal(plainText("正文 <!-- 隐藏 --> 结束"), "正文  结束");
});

test("footnote references become footnote nodes, not link text", () => {
  assert.deepEqual(parseInline("见[^a1]。"), [
    { type: "text", value: "见" },
    { type: "footnote", id: "a1" },
    { type: "text", value: "。" },
  ]);
});

test("icon shortcodes become icon nodes; times and URLs stay text", () => {
  assert.deepEqual(parseInline(":bolt: 快"), [{ type: "icon", name: "bolt" }, { type: "text", value: "快" }]);
  assert.equal(plainText("会议 12:30 https://a.cn/x"), "会议 12:30 https://a.cn/x");
});

test("footnote definitions are collected by id from def_footnote blocks", () => {
  const defs = footnoteDefinitions([
    b("1", "paragraph", "正文[^n]"),
    b("2", "def_footnote", "[^n]: 脚注**正文**"),
    b("3", "def_footnote", "[^m]:无空格"),
  ]);
  assert.deepEqual([...defs], [["n", "脚注**正文**"], ["m", "无空格"]]);
});
