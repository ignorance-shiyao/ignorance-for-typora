import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { parseOption, parseInfo } from "../advanced/ignorance.advanced/echarts/option.js";

const require = createRequire(import.meta.url);

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

test("URLs inside strings are not treated as comments", () => {
  assert.equal(parseOption("{ link: 'https://a.b/c' }").link, "https://a.b/c");
});

test("functions are rejected with a readable error", () => {
  assert.throws(() => parseOption("{ formatter: function (p) { return p } }"), /not supported/);
});

test("arrays and empty sources are rejected", () => {
  assert.throws(() => parseOption("[1,2]"), /one ECharts option object/);
  assert.throws(() => parseOption("  "), /Empty/);
});

test("info string sizes", () => {
  assert.deepEqual(parseInfo("{height=420} {width=600}"), { height: 420, width: 600 });
  assert.deepEqual(parseInfo(""), {});
});

test("ECharts SSR turns a parsed option into SVG", () => {
  const echarts = require("../advanced/ignorance.advanced/vendor/echarts.min.js");
  const chart = echarts.init(null, null, { renderer: "svg", ssr: true, width: 400, height: 300 });
  chart.setOption({ animation: false, ...parseOption("{ xAxis: { data: ['A','B'] }, yAxis: {}, series: [{ type: 'bar', data: [3, 5] }] }") });
  const svg = chart.renderToSVGString();
  chart.dispose();
  assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
  assert.match(svg, /<path/);
});

test("renderChartSvg uses the theme accent and drops the height key", async () => {
  const { renderChartSvg } = await import("../advanced/ignorance.advanced/echarts/theme.js");
  const echarts = require("../advanced/ignorance.advanced/vendor/echarts.min.js");
  const svg = renderChartSvg(echarts, { height: 200, xAxis: { data: ["A"] }, yAxis: {}, series: [{ type: "bar", data: [1] }] }, { dark: false, accent: "#123456", foreground: "#111111", background: "#ffffff", border: "#dddddd" });
  assert.match(svg, /height="200"/);
  assert.match(svg, /#123456|rgb\(18,52,86\)/i);
});
