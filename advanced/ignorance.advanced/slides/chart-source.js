// Reads a ```chart fence in the format of Typora's official Charts extension
// (typora.chart) and turns it into the option object slides/charts.js draws:
//
//   type: bar | line | pie
//   title: Optional title
//   series: Name A, Name B        (optional, one name per value column)
//   label, value[, value2 ...]
export function parseChart(source) {
  const meta = { type: "bar", title: "", series: "" };
  const rows = [];
  for (const raw of String(source).split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const option = /^(type|title|series)\s*:\s*(.*)$/i.exec(line);
    if (option) {
      meta[option[1].toLowerCase()] = option[2].trim();
      continue;
    }
    const cells = line.split(/\s*[,\t|]\s*/);
    const values = cells.slice(1).map(Number);
    if (cells.length < 2 || values.some((v) => !Number.isFinite(v))) throw new Error(`无法读取「${line}」，应为「名称, 数字」。`);
    rows.push({ label: cells[0], values });
  }
  if (!rows.length) throw new Error("图表没有数据行。");
  const type = meta.type.toLowerCase();
  if (!["bar", "line", "pie"].includes(type)) throw new Error(`不支持图表类型 ${meta.type}，可用 bar、line、pie。`);
  const option = {};
  if (meta.title) option.title = { text: meta.title };
  if (type === "pie") {
    option.series = [{ type, data: rows.map((r) => ({ name: r.label, value: r.values[0] })) }];
    return option;
  }
  const names = meta.series ? meta.series.split(/\s*,\s*/) : [];
  const count = Math.max(...rows.map((r) => r.values.length));
  option.xAxis = { type: "category", data: rows.map((r) => r.label) };
  option.yAxis = { type: "value" };
  option.series = Array.from({ length: count }, (_, i) => ({ type, ...(names[i] ? { name: names[i] } : {}), data: rows.map((r) => r.values[i] ?? 0) }));
  if (names.length) option.legend = {};
  return option;
}
