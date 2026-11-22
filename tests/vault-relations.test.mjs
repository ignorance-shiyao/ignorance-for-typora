import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVaultNote } from "../advanced/ignorance.vault/index/parse.js";
import { createRelations, noteRelations } from "../advanced/ignorance.vault/index/relations.js";

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
  assert.match(result.incoming.find(({ path }) => path.includes("云岭")).context, /里程碑/);
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
