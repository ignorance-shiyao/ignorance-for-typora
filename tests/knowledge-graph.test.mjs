import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVaultNote } from "../advanced/ignorance.knowledge-graphs/index/parse.js";
import { createRelations } from "../advanced/ignorance.knowledge-graphs/index/relations.js";
import { buildGraph, localGraph, layoutGraph, MAX_GLOBAL_NODES } from "../advanced/ignorance.knowledge-graphs/index/graph.js";

const notes = [
  parseVaultNote("项目/星河.md", "[[云岭]] [[云岭#阶段]] [[云岭|别名]] [[缺失]] [[星河]]"),
  parseVaultNote("项目/云岭.md", "[回星河](./星河.md) [外部](https://example.com) [图](./a.png)"),
  parseVaultNote("项目/评审.md", "[[星河]]"),
  parseVaultNote("项目/孤立.md", "没有链接"),
  parseVaultNote("归档/云岭.md", "# 同名"),
  parseVaultNote("归档/记录.md", "[[云岭]]"),
];
const graph = buildGraph(createRelations(notes));
const edgeKeys = () => graph.edges.map(({ source, target }) => `${source}>${target}`).sort();

test("one node per note and one edge per linked pair, no self loops", () => {
  assert.equal(graph.nodes.filter((node) => !node.broken).length, notes.length);
  assert.deepEqual(edgeKeys(), [
    "归档/记录.md>归档/云岭.md",
    "项目/星河.md>broken:缺失",
    "项目/星河.md>项目/云岭.md",
    "项目/评审.md>项目/星河.md",
  ]);
});

test("broken links become dashed nodes named by the link text", () => {
  const broken = graph.nodes.filter((node) => node.broken);
  assert.deepEqual(broken.map(({ id, name }) => [id, name]), [["broken:缺失", "缺失"]]);
});

test("same-named notes stay separate and resolve to the nearest one", () => {
  const ids = graph.nodes.map(({ id }) => id);
  assert.ok(ids.includes("项目/云岭.md") && ids.includes("归档/云岭.md"));
  assert.ok(graph.edges.some(({ source, target }) => source === "归档/记录.md" && target === "归档/云岭.md"));
});

test("local graph keeps the note and its neighbours up to the given depth", () => {
  const one = localGraph(graph, "项目/评审.md", 1);
  assert.deepEqual(one.nodes.map(({ id }) => id).sort(), ["项目/星河.md", "项目/评审.md"]);
  const two = localGraph(graph, "项目/评审.md", 2);
  assert.deepEqual(two.nodes.map(({ id }) => id).sort(), ["broken:缺失", "项目/云岭.md", "项目/星河.md", "项目/评审.md"]);
  assert.ok(two.edges.every(({ source, target }) => two.nodes.some((n) => n.id === source) && two.nodes.some((n) => n.id === target)));
});

test("local graph of an unknown path is empty", () => {
  assert.deepEqual(localGraph(graph, "不存在.md", 1), { nodes: [], edges: [] });
});

test("layout is deterministic, finite and inside the canvas", () => {
  const first = layoutGraph(graph, { width: 800, height: 600 });
  const second = layoutGraph(graph, { width: 800, height: 600 });
  assert.deepEqual(first, second);
  for (const { x, y } of first.nodes) {
    assert.ok(Number.isFinite(x) && Number.isFinite(y));
    assert.ok(x >= 0 && x <= 800 && y >= 0 && y <= 600);
  }
  const points = new Set(first.nodes.map(({ x, y }) => `${x},${y}`));
  assert.equal(points.size, first.nodes.length);
});

test("layout handles empty and single-node graphs", () => {
  assert.deepEqual(layoutGraph({ nodes: [], edges: [] }, { width: 100, height: 100 }), { nodes: [], edges: [] });
  const [only] = layoutGraph({ nodes: [{ id: "a.md", name: "a" }], edges: [] }, { width: 100, height: 100 }).nodes;
  assert.deepEqual([only.x, only.y], [50, 50]);
});

test("layout of 2000 linked notes finishes within 5 seconds", () => {
  const many = Array.from({ length: MAX_GLOBAL_NODES }, (_, i) =>
    parseVaultNote(`n/${i}.md`, `[[${(i * 7 + 1) % MAX_GLOBAL_NODES}]] [[${(i * 13 + 5) % MAX_GLOBAL_NODES}]]`));
  const big = buildGraph(createRelations(many));
  const started = performance.now();
  const laid = layoutGraph(big, { width: 1600, height: 1200 });
  assert.ok(performance.now() - started < 5000);
  assert.equal(laid.nodes.length, big.nodes.length);
});

import { createGraphModel } from "../advanced/ignorance.knowledge-graphs/index/graph-model.js";

test("graph model reuses the layout until the link structure changes", () => {
  const model = createGraphModel();
  const first = model(createRelations(notes), "项目/星河.md");
  const again = model(createRelations(notes), "项目/评审.md");
  assert.equal(first.global, again.global);
  assert.equal(first.version, again.version);
  assert.equal(first.current, "项目/星河.md");
  assert.equal(first.local.length, 3);
  assert.deepEqual(first.local[0].nodes.map(({ id }) => id).sort(), ["broken:缺失", "项目/云岭.md", "项目/星河.md", "项目/评审.md"]);
  const changed = model(createRelations([...notes, parseVaultNote("项目/新增.md", "[[星河]]")]), "项目/星河.md");
  assert.notEqual(changed.global, first.global);
  assert.equal(changed.version, first.version + 1);
  assert.equal(changed.global.nodes.length, first.global.nodes.length + 1);
});

test("graph model drops the global graph above the node limit and keeps the local one", () => {
  const many = Array.from({ length: MAX_GLOBAL_NODES + 1 }, (_, i) => parseVaultNote(`n/${i}.md`, `[[${(i + 1) % (MAX_GLOBAL_NODES + 1)}]]`));
  const result = createGraphModel()(createRelations(many), "n/0.md");
  assert.equal(result.overflow, true);
  assert.equal(result.global, undefined);
  assert.deepEqual(result.local[0].nodes.map(({ id }) => id).sort(), ["n/0.md", "n/1.md", "n/2000.md"].sort());
});

const layered = [
  parseVaultNote("项目/总计划.md", "# 年度计划\n\n- [ ] 立项 📅 2026-11-01\n- [ ] 评审 📅 2026-12-01\n- [x] 预算\n\n#规划 #立项"),
  parseVaultNote("项目/子项.md", "---\nparent: 总计划\ntitle: 子项\nowner: 小林\ntags: [执行]\n---\n\n问题\n?\n答案\n"),
  parseVaultNote("资料/参考.md", "[[总计划]]"),
  parseVaultNote("根笔记.md", "没有链接"),
];
const layeredGraph = buildGraph(createRelations(layered));

test("parent and up properties become parent edges, links stay link edges", () => {
  const kinds = layeredGraph.edges.map(({ source, target, kind }) => `${kind}:${source}>${target}`).sort();
  assert.deepEqual(kinds, ["link:资料/参考.md>项目/总计划.md", "parent:项目/子项.md>项目/总计划.md"]);
});

test("a pair linked and related by parent keeps both edges", () => {
  const both = buildGraph(createRelations([
    parseVaultNote("a.md", "---\nparent: b\n---\n[[b]]"),
    parseVaultNote("b.md", "x"),
  ]));
  assert.deepEqual(both.edges.map(({ kind }) => kind).sort(), ["link", "parent"]);
});

test("nodes carry their top-level folder as group, root notes get an empty group", () => {
  const groups = Object.fromEntries(layeredGraph.nodes.map(({ id, group }) => [id, group]));
  assert.equal(groups["项目/总计划.md"], "项目");
  assert.equal(groups["资料/参考.md"], "资料");
  assert.equal(groups["根笔记.md"], "");
});

import { noteInfo } from "../advanced/ignorance.knowledge-graphs/index/graph-model.js";

test("note info summarises tasks, cards, tags and scalar properties", () => {
  const plan = noteInfo(layered[0]);
  assert.deepEqual([plan.open, plan.done, plan.due], [2, 1, "2026-11-01"]);
  assert.deepEqual(plan.tags.sort(), ["立项", "规划"]);
  const child = noteInfo(layered[1]);
  assert.equal(child.cards, 1);
  assert.deepEqual(child.props, [["title", "子项"], ["owner", "小林"]]);
});

test("note info truncates long values and ignores structure-only keys", () => {
  const note = parseVaultNote("n.md", `---\nsummary: ${"长".repeat(200)}\nparent: x\ntags: [a]\nnested:\n  k: v\n---\n`);
  const info = noteInfo(note);
  assert.equal(info.props.length, 1);
  assert.ok(info.props[0][1].length <= 61);
  assert.equal(noteInfo(parseVaultNote("e.md", "")).due, null);
});

test("graph model exposes info for every note and no info for broken nodes", () => {
  const result = createGraphModel()(createRelations(layered), "项目/总计划.md");
  assert.equal(Object.keys(result.info).length, layered.length);
  assert.equal(result.info["项目/总计划.md"].open, 2);
});

test("isolated notes sit in a band below every linked note and never overlap", () => {
  const linked = Array.from({ length: 12 }, (_, i) => ({ id: `l${i}.md`, name: `l${i}`, path: `l${i}.md` }));
  const loose = Array.from({ length: 40 }, (_, i) => ({ id: `o${i}.md`, name: `o${i}`, path: `o${i}.md` }));
  const edges = linked.slice(1).map((node, i) => ({ source: linked[i].id, target: node.id, kind: "link" }));
  const laid = layoutGraph({ nodes: [...linked, ...loose], edges }, { width: 600, height: 420 });
  assert.equal(laid.nodes.length, 52);
  const lowestLinked = Math.max(...laid.nodes.filter(({ id }) => id.startsWith("l")).map(({ y }) => y));
  const highestLoose = Math.min(...laid.nodes.filter(({ id }) => id.startsWith("o")).map(({ y }) => y));
  assert.ok(highestLoose > lowestLinked, `${highestLoose} should be below ${lowestLinked}`);
  assert.equal(new Set(laid.nodes.map(({ x, y }) => `${x},${y}`)).size, 52);
  assert.ok(laid.nodes.every(({ x, y }) => x >= 0 && x <= 600 && y >= 0 && y <= 420));
  assert.deepEqual(laid.nodes.map(({ id }) => id), [...linked, ...loose].map(({ id }) => id));
});

test("a graph with no links at all is laid out as a grid inside the canvas", () => {
  const loose = Array.from({ length: 30 }, (_, i) => ({ id: `o${i}.md`, name: `o${i}`, path: `o${i}.md` }));
  const laid = layoutGraph({ nodes: loose, edges: [] }, { width: 600, height: 420 });
  assert.equal(new Set(laid.nodes.map(({ x, y }) => `${x},${y}`)).size, 30);
  assert.ok(laid.nodes.every(({ x, y }) => Number.isFinite(x) && x >= 0 && x <= 600 && y >= 0 && y <= 420));
});

test("a few hundred isolated notes still fit in the canvas without overlapping", () => {
  const nodes = [{ id: "a.md", name: "a" }, { id: "b.md", name: "b" }, ...Array.from({ length: 500 }, (_, i) => ({ id: `o${i}.md`, name: `o${i}` }))];
  const laid = layoutGraph({ nodes, edges: [{ source: "a.md", target: "b.md", kind: "link" }] }, { width: 1000, height: 700 });
  assert.equal(new Set(laid.nodes.map(({ x, y }) => `${x},${y}`)).size, 502);
  assert.ok(laid.nodes.every(({ x, y }) => x >= 0 && x <= 1000 && y >= 0 && y <= 700));
});
