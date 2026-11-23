const sdk = window.typora.view;
const output = document.querySelector("#output");
const isFenceResults = output.hasAttribute("data-fence-results");
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
    if (isFenceResults) sdk.autoHeight();
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

function render(model) {
  output.replaceChildren();
  if (model.message) {
    output.append(element("p", model.message));
  } else if (!model.count) {
    output.append(element("p", isFenceResults ? "没有匹配的任务" : "本周没有到期任务"));
  } else {
    for (const { label, rows } of model.groups) {
      const group = element("section");
      if (label) group.append(element("h3", label));
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
      output.append(group);
    }
  }
  if (isFenceResults) sdk.autoHeight();
}

function snapshotRows(model) {
  if (!model || model.message === "正在建立索引" || model.count > 300) {
    return rawSource.split("\n").map((line) => [line]);
  }
  if (model.message) return [[model.message]];
  return model.groups.flatMap(({ label, rows }) => [
    ...(label ? [[label]] : []),
    model.columns,
    ...rows.map(({ cells }) => cells),
  ]);
}

function svgSnapshot(model) {
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

if (isFenceResults) {
  sdk.onMessage((model) => {
    latest = model;
    render(model);
    if (model.message !== "正在建立索引") resolveFirst();
  });
  sdk.onOpen(({ source }) => {
    rawSource = source;
    sdk.postMessage("ready");
  });
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
}

if (isFenceResults) {
  const refreshVisible = () => {
    if (!document.hidden) sdk.postMessage("refresh");
  };
  const retry = setInterval(refreshVisible, 250);
  document.addEventListener("visibilitychange", refreshVisible);
  window.addEventListener("pagehide", ({ persisted }) => {
    if (!persisted) clearInterval(retry);
  });
} else {
  let activeBlock;
  let shown;
  let announcedBlock;
  let validUntil = 0;
  let pending;

  async function readWeek() {
    const context = activeBlock;
    if (!context || document.hidden) return;
    const now = Date.now();
    if (announcedBlock !== context || validUntil - now < 4000) {
      const entry = await sdk.storage.get("week-demand") ?? {};
      const active = Object.entries(entry).filter(([, expires]) => expires > now);
      validUntil = now + 8000;
      announcedBlock = context;
      await sdk.storage.set("week-demand", { ...Object.fromEntries(active), [context]: validUntil });
    }
    const stored = (await sdk.storage.get("detail-contexts"))?.[context];
    if (activeBlock !== context) return;
    const model = stored?.week ?? { message: stored?.message ?? (stored?.status === "no-workspace" ? "请先打开工作区文件夹" : "正在建立索引") };
    const next = JSON.stringify(model);
    if (next !== shown) {
      render(model);
      shown = next;
    }
  }

  function refresh() {
    if (!pending) {
      pending = readWeek().catch(() => {
        output.textContent = "无法读取本周任务";
      }).finally(() => { pending = undefined; });
    }
  }

  sdk.onDocument(({ blocks }) => {
    activeBlock = blocks[0]?.id;
    if (!activeBlock) {
      shown = undefined;
      output.textContent = "请先打开文档";
    }
    refresh();
  });
  const retry = setInterval(refresh, 1000);
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("pagehide", ({ persisted }) => {
    if (!persisted) clearInterval(retry);
  });
}
