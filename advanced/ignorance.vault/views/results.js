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

function pathValue(text, path) {
  const display = element("span");
  const button = element("button", text);
  const value = element("code", path);
  value.className = "file-path";
  value.hidden = true;
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", () => {
    value.hidden = !value.hidden;
    button.setAttribute("aria-expanded", String(!value.hidden));
    if (sdk.kind === "fence") sdk.autoHeight();
  });
  display.append(button, value);
  return display;
}

function valueNode(model, row, index) {
  const text = row.cells[index];
  return model.columns[index] === "文件" && row.path
    ? pathValue(text, row.path)
    : document.createTextNode(text);
}

function chartNode(markup) {
  const chart = new DOMParser().parseFromString(markup, "image/svg+xml").documentElement;
  if (chart.localName !== "svg" || chart.namespaceURI !== SVG) throw new Error("无法绘制图表");
  const palette = sdk.theme.vars;
  for (const node of chart.querySelectorAll("[fill], [stroke]")) {
    for (const name of ["fill", "stroke"]) {
      const token = /^var\(--typora-(foreground|background|border|accent)\)$/.exec(node.getAttribute(name) ?? "");
      if (token && palette[token[1]]) node.setAttribute(name, palette[token[1]]);
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
  } else if (model.view === "count") {
    output.append(element("p", `${model.count} 条`));
  } else if (!model.count) {
    output.append(element("p", "没有匹配的文件"));
  } else {
    for (const { label, rows } of model.groups) {
      const group = element("section");
      if (label) group.append(element("h3", label));
      if (model.view === "list") {
        const list = element("ul");
        for (const row of rows) {
          const item = element("li");
          row.cells.forEach((_, index) => {
            if (index) item.append(" · ");
            item.append(valueNode(model, row, index));
          });
          list.append(item);
        }
        group.append(list);
      } else {
        const table = element("table");
        const header = element("tr");
        for (const title of model.columns) {
          const th = element("th", title);
          th.scope = "col";
          header.append(th);
        }
        const head = element("thead");
        head.append(header);
        const body = element("tbody");
        for (const row of rows) {
          const tr = element("tr");
          row.cells.forEach((_, index) => {
            const cell = element("td");
            cell.append(valueNode(model, row, index));
            tr.append(cell);
          });
          body.append(tr);
        }
        table.append(head, body);
        group.append(table);
      }
      output.append(group);
    }
  }
  if (sdk.kind === "fence") sdk.autoHeight();
}

function snapshotRows(model) {
  if (!model || model.message === "正在建立索引" || model.count > 300) {
    return rawSource.split("\n").map((line) => [line]);
  }
  if (model.message) return [[model.message]];
  if (model.view === "count") return [[`${model.count} 条`]];
  return model.groups.flatMap(({ label, rows }) => [
    ...(label ? [[label]] : []),
    ...(model.view === "table" ? [model.columns] : []),
    ...rows.map(({ cells }) => cells),
  ]);
}

function svgSnapshot(model) {
  if (model?.chart) {
    const chart = chartNode(model.chart);
    const height = Number(chart.getAttribute("height"));
    const width = Math.max(Number(chart.getAttribute("width")), [...model.summary].length * 13 + 16);
    chart.setAttribute("height", String(height + 24));
    chart.setAttribute("width", String(width));
    chart.setAttribute("viewBox", `0 0 ${width} ${height + 24}`);
    const summary = document.createElementNS(SVG, "text");
    summary.setAttribute("x", "8");
    summary.setAttribute("y", String(height + 18));
    summary.setAttribute("fill", sdk.theme.vars.foreground);
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
  const { foreground, background } = sdk.theme.vars;
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

if (sdk.kind === "fence") {
  sdk.onMessage((model) => {
    latest = model;
    render(model);
    if (model.message !== "正在建立索引") resolveFirst();
  });
  sdk.onOpen(({ source }) => { rawSource = source; });
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
  sdk.postMessage("ready");
}
