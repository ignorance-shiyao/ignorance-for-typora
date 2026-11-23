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

test("arrow navigation picks the nearest node in the pressed direction", () => {
  const { nextNode } = globalThis.graphMatch;
  const at = (id, x, y) => ({ id, x, y });
  const nodes = [at("c", 0, 0), at("r", 10, 1), at("far", 30, 0), at("d", 1, 12), at("u", -2, -8), at("l", -15, 3)];
  const from = nodes[0];
  assert.equal(nextNode(from, nodes, [1, 0]).id, "r");
  assert.equal(nextNode(from, nodes, [0, 1]).id, "d");
  assert.equal(nextNode(from, nodes, [0, -1]).id, "u");
  assert.equal(nextNode(from, nodes, [-1, 0]).id, "l");
});

test("arrow navigation ignores nodes outside the cone and stays put at the edge", () => {
  const { nextNode } = globalThis.graphMatch;
  const nodes = [{ id: "c", x: 0, y: 0 }, { id: "side", x: 3, y: 20 }];
  assert.equal(nextNode(nodes[0], nodes, [1, 0]), undefined);
  assert.equal(nextNode(nodes[0], [nodes[0]], [0, 1]), undefined);
});
