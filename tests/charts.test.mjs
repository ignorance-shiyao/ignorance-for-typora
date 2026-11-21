import { test } from "node:test";
import assert from "node:assert/strict";
import { parseOption } from "../advanced/ignorance.advanced/slides/option.js";
import { renderChartSvg } from "../advanced/ignorance.advanced/slides/charts.js";
import { renderFlowSvg, parseFlow } from "../advanced/ignorance.advanced/slides/flow.js";

const light = { dark: false, accent: "#123456", foreground: "#111111", background: "#ffffff", border: "#dddddd" };

test("strict JSON passes through", () => {
  assert.deepEqual(parseOption('{"xAxis":{"type":"category"}}'), { xAxis: { type: "category" } });
});

test("JS object style from the examples site", () => {
  const src = `option = {
    // comment
    title: { text: 'It\\'s "ok"' },
    xAxis: { data: ['一', '二',], },
    series: [{ type: 'bar', data: [1, 2], smooth: true, extra: undefined }], /* end */
  };`;
  assert.deepEqual(parseOption(src), {
    title: { text: `It's "ok"` },
    xAxis: { data: ["一", "二"] },
    series: [{ type: "bar", data: [1, 2], smooth: true, extra: null }],
  });
});

test("functions and non-objects are rejected with a readable error", () => {
  assert.throws(() => parseOption("{ formatter: function (p) { return p } }"), /not supported/);
  assert.throws(() => parseOption("[1,2]"), /one ECharts option object/);
  assert.throws(() => parseOption("  "), /Empty/);
});

const parse = (svg) => {
  assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
  return svg;
};

test("bar and line draw one shape per data point, coloured from the theme accent", () => {
  const svg = parse(renderChartSvg(parseOption("{ xAxis: { data: ['A','B','C'] }, series: [{ type: 'bar', data: [3, 5, 2] }, { type: 'line', data: [1, 2, 3] }] }"), light));
  assert.equal((svg.match(/<path d="[^"]*" fill="#123456"\/>/g) || []).length, 3);
  assert.match(svg, /stroke="#[0-9a-f]{6}" stroke-width="3.5"/i);
  assert.match(svg, /<text[^>]*>A<\/text>/);
});

test("pie draws one slice per item with percentage labels", () => {
  const svg = parse(renderChartSvg(parseOption("{ series: [{ type: 'pie', radius: ['40%','70%'], data: [{name:'甲',value:3},{name:'乙',value:1}] }] }"), light));
  assert.equal((svg.match(/<path/g) || []).length, 2);
  assert.match(svg, /甲 75%/);
  assert.match(svg, /乙 25%/);
});

test("horizontal stacked bars and escaping of titles", () => {
  const svg = parse(renderChartSvg(parseOption("{ title: { text: 'a<b&c' }, xAxis: { type: 'value' }, yAxis: { type: 'category', data: ['A','B'] }, series: [{ type: 'bar', stack: 't', data: [3, 5] }, { type: 'bar', stack: 't', data: [2, 1] }] }"), light));
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

test("other Mermaid diagrams and subgraphs are rejected with a readable message", () => {
  assert.throws(() => renderFlowSvg("sequenceDiagram\n A->>B: hi", light), /只能画流程图/);
  assert.throws(() => renderFlowSvg("graph TD\n subgraph x\n A-->B\n end", light), /subgraph/);
  assert.throws(() => renderFlowSvg("graph TD\n A ??? B", light), /无法解析/);
});
