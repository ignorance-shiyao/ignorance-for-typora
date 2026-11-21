import { test } from "node:test";
import assert from "node:assert/strict";
import { parseChart } from "../advanced/ignorance.advanced/slides/chart-source.js";
import { renderChartSvg } from "../advanced/ignorance.advanced/slides/charts.js";
import { renderFlowSvg, parseFlow } from "../advanced/ignorance.advanced/slides/flow.js";

const light = { dark: false, accent: "#123456", foreground: "#111111", background: "#ffffff", border: "#dddddd" };

test("chart fence in the official format becomes an option", () => {
  const o = parseChart("# note\ntype: line\ntitle: 周活\nseries: 本周, 上周\n周一, 1, 2\n周二, 3, 4");
  assert.deepEqual(o.title, { text: "周活" });
  assert.deepEqual(o.xAxis.data, ["周一", "周二"]);
  assert.deepEqual(o.series.map((s) => [s.type, s.name, s.data]), [["line", "本周", [1, 3]], ["line", "上周", [2, 4]]]);
  assert.ok(o.legend);
});

test("pie rows become named slices", () => {
  const o = parseChart("type: pie\n甲, 3\n乙, 1");
  assert.deepEqual(o.series[0].data, [{ name: "甲", value: 3 }, { name: "乙", value: 1 }]);
});

test("bad rows, empty fences and unknown types fail with a readable message", () => {
  assert.throws(() => parseChart("type: bar\nQ1, abc"), /无法读取/);
  assert.throws(() => parseChart("type: bar"), /没有数据行/);
  assert.throws(() => parseChart("type: radar\nA, 1"), /不支持图表类型 radar/);
});

const parse = (svg) => {
  assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
  return svg;
};

test("bar and line draw one shape per data point, coloured from the theme accent", () => {
  const svg = parse(renderChartSvg({ xAxis: { data: ["A", "B", "C"] }, series: [{ type: "bar", data: [3, 5, 2] }, { type: "line", data: [1, 2, 3] }] }, light));
  assert.equal((svg.match(/<path d="[^"]*" fill="#123456"\/>/g) || []).length, 3);
  assert.match(svg, /stroke="#[0-9a-f]{6}" stroke-width="3.5"/i);
  assert.match(svg, /<text[^>]*>A<\/text>/);
});

test("pie draws one slice per item with percentage labels", () => {
  const svg = parse(renderChartSvg({ series: [{ type: "pie", radius: ["40%", "70%"], data: [{ name: "甲", value: 3 }, { name: "乙", value: 1 }] }] }, light));
  assert.equal((svg.match(/<path/g) || []).length, 2);
  assert.match(svg, /甲 75%/);
  assert.match(svg, /乙 25%/);
});

test("titles are escaped and each bar series gets its own slot", () => {
  const svg = parse(renderChartSvg({ title: { text: "a<b&c" }, xAxis: { data: ["A", "B"] }, series: [{ type: "bar", data: [3, 5] }, { type: "bar", data: [2, 1] }] }, light));
  assert.match(svg, /a&lt;b&amp;c/);
  assert.equal((svg.match(/<path/g) || []).length, 4);
});

test("unsupported series types and mixed pie fail with a readable message", () => {
  assert.throws(() => renderChartSvg({ series: [{ type: "radar", data: [1] }] }, light), /不支持图表类型 radar/);
  assert.throws(() => renderChartSvg({ series: [{ type: "pie", data: [{ value: 1 }] }, { type: "bar", data: [1] }] }, light), /pie 不能/);
  assert.throws(() => renderChartSvg({}, light), /没有 series/);
});

test("flowchart parses shapes, chains, labels and edge styles", () => {
  const g = parseFlow("graph LR\n A[需求] --> B{评审}\n B -->|通过| C(开发) --> D([上线])\n B -.->|驳回| A");
  assert.equal(g.dir, "LR");
  assert.deepEqual(g.nodes.map((n) => [n.id, n.shape]), [["A", "rect"], ["B", "diamond"], ["C", "round"], ["D", "stadium"]]);
  assert.equal(g.edges.length, 4);
  assert.equal(g.edges[1].label, "通过");
  assert.equal(g.edges[3].dashed, true);
});

test("flowchart draws a shape per node, an arrow per edge, and keeps back edges inside the canvas", () => {
  const svg = parse(renderFlowSvg("flowchart TD\n A[开始] --> B[处理]\n B --> C{成功?}\n C -->|否| B\n C -->|是| D((完成))", light));
  assert.equal((svg.match(/marker-end=/g) || []).length, 4);
  assert.match(svg, /<polygon/);
  assert.match(svg, /<ellipse/);
  const [w] = /viewBox="0 0 (\d+)/.exec(svg).slice(1).map(Number);
  const xs = [...svg.matchAll(/ C?(\d+(?:\.\d+)?),/g)].map((m) => Number(m[1]));
  assert.ok(Math.max(...xs) <= w, "all path x coordinates fit in the viewBox");
});

test("other Mermaid diagrams are rejected with a readable message", () => {
  assert.throws(() => renderFlowSvg("sequenceDiagram\n A->>B: hi", light), /只能画流程图/);
  assert.throws(() => renderFlowSvg("graph TD\n A ??? B", light), /无法解析/);
});

test("subgraphs parse with titles, nesting and members", () => {
  const g = parseFlow("graph TD\n subgraph s1 [外层]\n  subgraph s2 [内层]\n   A --> B\n  end\n  C\n end\n subgraph 单独\n  D[(库)]\n end");
  assert.deepEqual(g.groups.map((x) => [x.id, x.title, x.parent]), [["s1", "外层", undefined], ["s2", "内层", "s1"], ["单独", "单独", undefined]]);
  assert.deepEqual(g.nodes.map((n) => [n.id, n.group]), [["A", "s2"], ["B", "s2"], ["C", "s1"], ["D", "单独"]]);
  assert.equal(g.nodes[3].label, "库");
});

test("a node mentioned outside first still belongs to the subgraph that lists it", () => {
  const g = parseFlow("graph TD\n X --> A\n subgraph s [组]\n  A --> B\n end");
  assert.deepEqual(g.nodes.map((n) => [n.id, n.group]), [["X", undefined], ["A", "s"], ["B", "s"]]);
});

test("subgraph boxes enclose their members and keep other nodes outside", () => {
  const svg = renderFlowSvg("flowchart LR\n subgraph 前端\n  A --> B\n end\n subgraph 后端\n  C --> D\n end\n B --> C", light);
  assert.equal((svg.match(/rx="14"/g) || []).length, 2);
  assert.match(svg, />前端</);
  const [w] = /viewBox="0 0 (\d+)/.exec(svg).slice(1).map(Number);
  assert.ok(w > 400);
});

test("unbalanced subgraphs, edges to a subgraph and overlapping layouts fail readably", () => {
  assert.throws(() => renderFlowSvg("graph TD\n subgraph a\n A --> B", light), /缺少 end/);
  assert.throws(() => renderFlowSvg("graph TD\n A --> B\n end", light), /多出一个 end/);
  assert.throws(() => renderFlowSvg("graph TD\n subgraph a\n A\n end\n B --> a", light), /不支持连到 subgraph/);
  // X sits on the path between two members of one subgraph, in a middle layer.
  assert.throws(() => renderFlowSvg("graph LR\n subgraph g\n  A\n  C\n end\n A --> X --> Y\n X --> C\n Z --> C", light), /夹进了其他节点/);
});
