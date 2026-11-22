import { test } from "node:test";
import assert from "node:assert/strict";
import "../advanced/ignorance.knowledge-graphs/views/graph-match.js";

const { parseQuery, matchNode } = globalThis.graphMatch;
const node = { id: "项目/星河.md", name: "星河", path: "项目/星河.md" };
const info = { tags: ["规划", "项目/一期"] };

test("empty or blank query yields no filter", () => {
  assert.equal(parseQuery(""), null);
  assert.equal(parseQuery("   "), null);
});

test("plain words match the note name ignoring case and width", () => {
  assert.equal(matchNode(parseQuery("星"), node, info), true);
  assert.equal(matchNode(parseQuery("ＡＢＣ"), { name: "abc", path: "abc.md" }, undefined), true);
  assert.equal(matchNode(parseQuery("云岭"), node, info), false);
});

test("#tag matches tags by containment and path: matches the path", () => {
  assert.equal(matchNode(parseQuery("#规划"), node, info), true);
  assert.equal(matchNode(parseQuery("#一期"), node, info), true);
  assert.equal(matchNode(parseQuery("#执行"), node, info), false);
  assert.equal(matchNode(parseQuery("path:项目/"), node, info), true);
  assert.equal(matchNode(parseQuery("path:归档"), node, info), false);
});

test("several terms must all match", () => {
  assert.equal(matchNode(parseQuery("星河 #规划 path:项目"), node, info), true);
  assert.equal(matchNode(parseQuery("星河 #执行"), node, info), false);
});

test("broken nodes have no path or tags so only name terms can match", () => {
  const broken = { id: "broken:缺失", name: "缺失", broken: true };
  assert.equal(matchNode(parseQuery("缺"), broken, undefined), true);
  assert.equal(matchNode(parseQuery("#规划"), broken, undefined), false);
  assert.equal(matchNode(parseQuery("path:项目"), broken, undefined), false);
});

test("a lone # or path: prefix is ignored instead of matching everything or nothing", () => {
  assert.equal(matchNode(parseQuery("#"), node, info), true);
  assert.equal(matchNode(parseQuery("path:"), node, info), true);
});
