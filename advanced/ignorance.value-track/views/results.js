const sdk = window.typora.view;
const output = document.querySelector("#output");
const SVG = "http://www.w3.org/2000/svg";
let rawSource = "";
let latest;
let resolveFirst;
const firstResult = new Promise((resolve) => { resolveFirst = resolve; });

function element(tag, text) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  return node;
}

function snapshotPalette() {
  const theme = sdk.theme;
  const style = getComputedStyle(document.documentElement);
  const defaults = theme?.dark
    ? { foreground: "#e5e7eb", background: "#111827", border: "#4b5563", accent: "#93c5fd" }
    : { foreground: "#1f2937", background: "#ffffff", border: "#d1d5db", accent: "#2563eb" };
  return Object.fromEntries(Object.entries(defaults).map(([name, fallback]) => {
    const token = `--typora-${name}`;
    return [name, theme?.vars?.[token] || style.getPropertyValue(token).trim() || fallback];
  }));
}

function chartNode(markup, palette) {
  const chart = new DOMParser().parseFromString(markup, "image/svg+xml").documentElement;
  if (chart.localName !== "svg" || chart.namespaceURI !== SVG) throw new Error("无法绘制图表");
  for (const node of chart.querySelectorAll("[fill], [stroke]")) {
    for (const name of ["fill", "stroke"]) {
      const token = /^var\(--typora-(foreground|background|border|accent)\)$/.exec(node.getAttribute(name) ?? "");
      if (token && palette?.[token[1]]) node.setAttribute(name, palette[token[1]]);
    }
  }
  return document.importNode(chart, true);
}

function render(model) {
  output.replaceChildren();
  if (model.chart) {
    output.append(chartNode(model.chart), element("p", model.summary));
  } else if (model.message) {
    output.append(element("p", model.message));
  }
  sdk.autoHeight();
}

function snapshotRows(model) {
  if (!model || model.message === "正在建立索引" || model.count > 300) {
    return rawSource.split("\n").map((line) => [line]);
  }
  if (model.message) return [[model.message]];
  return [[model.summary]];
}

function svgSnapshot(model) {
  const palette = snapshotPalette();
  if (model?.chart) {
    const chart = chartNode(model.chart, palette);
    const height = Number(chart.getAttribute("height"));
    const width = Math.max(Number(chart.getAttribute("width")), [...model.summary].length * 13 + 16);
    chart.setAttribute("height", String(height + 24));
    chart.setAttribute("width", String(width));
    chart.setAttribute("viewBox", `0 0 ${width} ${height + 24}`);
    const summary = document.createElementNS(SVG, "text");
    summary.setAttribute("x", "8");
    summary.setAttribute("y", String(height + 18));
    summary.setAttribute("fill", palette.foreground);
    summary.setAttribute("font-size", "13");
    summary.textContent = model.summary;
    chart.append(summary);
    return { svg: new XMLSerializer().serializeToString(chart) };
  }
  const rows = snapshotRows(model);
  if (!rows.length) rows.push(["没有匹配的文件"]);
  const colWidths = [];
  for (const row of rows) row.forEach((cell, col) => {
    colWidths[col] = Math.max(colWidths[col] ?? 0, [...cell].length * 13 + 16);
  });
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("xmlns", SVG);
  svg.setAttribute("width", String(Math.max(140, colWidths.reduce((sum, value) => sum + value, 0))));
  svg.setAttribute("height", String(rows.length * 24 + 8));
  const { foreground, background } = palette;
  const fill = document.createElementNS(SVG, "rect");
  fill.setAttribute("width", "100%");
  fill.setAttribute("height", "100%");
  fill.setAttribute("fill", background);
  svg.append(fill);
  rows.forEach((row, index) => {
    let x = 8;
    row.forEach((cell, col) => {
      const text = document.createElementNS(SVG, "text");
      text.setAttribute("x", String(x));
      text.setAttribute("y", String(index * 24 + 19));
      text.setAttribute("fill", foreground);
      text.setAttribute("font-family", "sans-serif");
      text.setAttribute("font-size", "13");
      text.textContent = cell;
      x += colWidths[col];
      svg.append(text);
    });
  });
  return { svg: new XMLSerializer().serializeToString(svg) };
}

sdk.onMessage((model) => {
  latest = model;
  render(model);
  if (model.message !== "正在建立索引") resolveFirst();
});
sdk.onOpen(({ source }) => {
  rawSource = source;
  sdk.postMessage("ready");
});
sdk.onTheme(() => { if (latest?.chart) render(latest); });
sdk.onSnapshot(async () => {
  if (!latest || latest.message === "正在建立索引") {
    let timeout;
    try {
      await Promise.race([firstResult, new Promise((resolve) => { timeout = setTimeout(resolve, 1500); })]);
    } finally {
      clearTimeout(timeout);
    }
  }
  return svgSnapshot(latest);
});
const refreshVisible = () => {
  if (!document.hidden) sdk.postMessage("refresh");
};
const retry = setInterval(refreshVisible, 250);
document.addEventListener("visibilitychange", refreshVisible);
window.addEventListener("pagehide", ({ persisted }) => {
  if (!persisted) clearInterval(retry);
});
