import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVaultNote } from "../advanced/ignorance.backlinks/core/parse.js";
import { createRelations, noteRelations } from "../advanced/ignorance.backlinks/index/relations.js";

const notes = [
  parseVaultNote("项目/星河 (一期).md", "---\nparent: 总计划\n---\n\n[[缺失]] [[#本页]]"),
  parseVaultNote("项目/云岭.md", "---\nup: 总计划\n---\n\n请看 [[星河 (一期)#阶段|里程碑]]。"),
  parseVaultNote("项目/验收.md", "[星河](<./星河 (一期).md>) 已验收。"),
  parseVaultNote("项目/评审.md", "[[星河 (一期)]] 待评审。"),
  parseVaultNote("项目/速记.md", "星河 (一期) 是本次目标。"),
  parseVaultNote("项目/总计划.md", "# 年度计划"),
  parseVaultNote("归档/星河 (一期).md", "# 同名归档"),
];

test("resolves three backlink sources, mentions, parent and siblings", () => {
  const graph = createRelations(notes);
  const result = noteRelations(graph, "项目/星河 (一期).md");
  assert.deepEqual(result.incoming.map(({ path }) => path).sort(), ["项目/云岭.md", "项目/评审.md", "项目/验收.md"].sort());
  assert.match(result.incoming.find(({ path }) => path.includes("云岭")).references[0].context, /里程碑/);
  assert.deepEqual(result.mentions.map(({ path }) => path), ["项目/速记.md"]);
  assert.deepEqual(result.parents.map(({ path }) => path), ["项目/总计划.md"]);
  assert.deepEqual(result.siblings.map(({ path }) => path), ["项目/云岭.md"]);
  assert.equal(result.outgoing[0].broken, true);
  assert.equal(result.outgoing[1].broken, false);
  assert.equal(noteRelations(graph, "归档/星河 (一期).md").incoming.length, 0);
});

test("ignores external and attachment links and follows decoded relative paths", () => {
  const from = parseVaultNote("工作/验收.md", "[外部](https://example.com) [图](./图.png) [内部](../项目/%E4%BA%91%E5%B2%AD.md)");
  const actual = noteRelations(createRelations([...notes, from]), from.path);
  assert.deepEqual(actual.outgoing.map(({ path }) => path), ["项目/云岭.md"]);
});

test("resolves an unquoted wiki parent parsed by YAML as nested flow arrays", () => {
  const note = parseVaultNote("项目/子项.md", "---\nparent: [[总计划]]\n---\n");
  assert.deepEqual(noteRelations(createRelations([...notes, note]), note.path).parents.map(({ path }) => path), ["项目/总计划.md"]);
});

const outgoingPaths = (all, from) => noteRelations(createRelations(all), from).outgoing.map(({ path, broken }) => (broken ? "!" : path));

test("markdown link falls back to a unique note name when the relative path is wrong", () => {
  const all = [
    parseVaultNote("甲/来源.md", "[下一章](04-都在等风.md)"),
    parseVaultNote("乙/04-都在等风.md", "# 目标"),
  ];
  assert.deepEqual(outgoingPaths(all, "甲/来源.md"), ["乙/04-都在等风.md"]);
  assert.deepEqual(noteRelations(createRelations(all), "乙/04-都在等风.md").incoming.map(({ path }) => path), ["甲/来源.md"]);
});

test("markdown link with a wrong prefix matches the note whose path ends the same way", () => {
  const all = [
    parseVaultNote("甲/乙/丙/来源.md", "[目录](../../丙/00-目录.md)"),
    parseVaultNote("丙/00-目录.md", "x"),
    parseVaultNote("丁/00-目录.md", "x"),
  ];
  assert.deepEqual(outgoingPaths(all, "甲/乙/丙/来源.md"), ["丙/00-目录.md"]);
});

test("a bare file name shared by several notes picks the nearest one, and an exact relative path still wins", () => {
  const shared = [
    parseVaultNote("甲/来源.md", "[目录](00-目录.md)"),
    parseVaultNote("丙/00-目录.md", "x"),
    parseVaultNote("甲/丁/00-目录.md", "x"),
  ];
  assert.deepEqual(outgoingPaths(shared, "甲/来源.md"), ["甲/丁/00-目录.md"]);
  assert.deepEqual(outgoingPaths([...shared, parseVaultNote("甲/00-目录.md", "x")], "甲/来源.md"), ["甲/00-目录.md"]);
});

test("a link path that matches no exact file prefers the candidate sharing the most trailing folders", () => {
  const all = [
    parseVaultNote("甲/来源.md", "[目录](../乙/丙/00-目录.md)"),
    parseVaultNote("乙/丁/00-目录.md", "x"),
    parseVaultNote("戊/丙/00-目录.md", "x"),
  ];
  assert.deepEqual(outgoingPaths(all, "甲/来源.md"), ["戊/丙/00-目录.md"]);
});

test("equally similar candidates resolve to the same note every time", () => {
  const all = [
    parseVaultNote("甲/来源.md", "[目录](00-目录.md)"),
    parseVaultNote("丙/00-目录.md", "x"),
    parseVaultNote("丁/00-目录.md", "x"),
  ];
  const first = outgoingPaths(all, "甲/来源.md");
  assert.equal(first.length, 1);
  assert.notEqual(first[0], "!");
  assert.deepEqual(outgoingPaths([...all].reverse(), "甲/来源.md"), first);
});

test("a markdown link to a name that exists nowhere stays broken and attachments stay ignored", () => {
  const all = [parseVaultNote("甲/来源.md", "[缺](不存在.md) [图](a.png)"), parseVaultNote("乙/其他.md", "x")];
  assert.deepEqual(outgoingPaths(all, "甲/来源.md"), ["!"]);
});

test("groups backlinks by source path and keeps each reference location", () => {
  const all = [
    parseVaultNote("目标.md", "# 目标"),
    parseVaultNote("甲/来源.md", "先读 [[目标#开头]]\n\n再看 [结尾](../目标.md#结尾)"),
    parseVaultNote("乙/来源.md", "另见 [[目标]]"),
  ];
  const { incoming } = noteRelations(createRelations(all), "目标.md");
  assert.deepEqual(incoming.map(({ path }) => path), ["甲/来源.md", "乙/来源.md"]);
  assert.deepEqual(incoming[0].references.map(({ line, heading, context }) => [line, heading, context]), [
    [1, "开头", "先读 [[目标#开头]]"],
    [3, "结尾", "再看 [结尾](../目标.md#结尾)"],
  ]);
});
