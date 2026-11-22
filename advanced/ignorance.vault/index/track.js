import { calendarDate, dayOffset, localToday, parseSource, queryError, readOptions, sourceIncludes } from "./query.js";

const DAY = 86_400_000;

function numberWithUnit(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const match = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*[\p{L}%°]*$/u.exec(value.trim());
  const number = match ? Number(match[1]) : NaN;
  return Number.isFinite(number) ? number : undefined;
}

export function parseTrack(source) {
  const options = readOptions(source, ["from", "field", "type", "range", "goal", "agg", "by"]);
  const field = options.get("field");
  const type = options.get("type");
  const range = options.get("range");
  const goal = options.get("goal");
  const aggregate = options.get("agg");
  const interval = options.get("by");
  if (!field) throw queryError(1, "缺少 field");
  if (type && !["line", "bar", "heatmap"].includes(type.value)) throw queryError(type.line, "type 可用 line、bar 或 heatmap");
  const days = range && /^last +([1-9]\d{0,3})d$/.exec(range.value);
  if (range && (!days || Number(days[1]) > 3660)) throw queryError(range.line, "range 需要 last 1d 至 last 3660d");
  const goalValue = goal && numberWithUnit(goal.value);
  if (goal && goalValue === undefined) throw queryError(goal.line, "goal 需要数值");
  if (aggregate && !["sum", "avg", "count"].includes(aggregate.value)) throw queryError(aggregate.line, "agg 可用 sum、avg 或 count");
  if (interval && !["week", "month"].includes(interval.value)) throw queryError(interval.line, "by 可用 week 或 month");
  if (aggregate && !interval) throw queryError(aggregate.line, "agg 需搭配 by");
  if (type?.value === "heatmap" && interval) throw queryError(interval.line, "热力图按日显示");
  if (type?.value === "heatmap" && goal) throw queryError(goal.line, "热力图不绘制目标线");
  return { source: parseSource(options.get("from")), field: field.value, type: type?.value ?? "line",
    days: days ? Number(days[1]) : undefined, goal: goalValue, aggregate: aggregate?.value ?? "avg", interval: interval?.value };
}

function bucket(date, interval) {
  if (interval === "month") return date.slice(0, 7) + "-01";
  if (interval === "week") return dayOffset(date, -((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7));
  return date;
}

function combine(values, aggregate) {
  if (aggregate === "count") return values.length;
  const sum = values.reduce((total, value) => total + value, 0);
  return aggregate === "sum" ? sum : sum / values.length;
}

const text = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

function svgFrame(width, height, contents, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${text(label)}"><rect width="100%" height="100%" fill="var(--typora-background)"/>${contents}</svg>`;
}

function svgText(x, y, value) {
  return `<text x="${x}" y="${y}" fill="var(--typora-foreground)" font-family="sans-serif" font-size="12">${text(value)}</text>`;
}

function heatmap(points, start, end, field) {
  const values = new Map(points.map(({ date, value }) => [date, value]));
  const low = Math.min(...values.values());
  const high = Math.max(...values.values());
  const first = Date.parse(`${start}T00:00:00Z`);
  const last = Date.parse(`${end}T00:00:00Z`);
  const count = Math.min(3660, Math.round((last - first) / DAY) + 1);
  const columns = Math.min(28, count);
  let cells = "";
  for (let i = 0; i < count; i++) {
    const date = dayOffset(start, i);
    const value = values.get(date);
    const opacity = value === undefined ? 1 : high === low ? 0.7 : 0.25 + 0.75 * (value - low) / (high - low);
    cells += `<rect data-day="${date}" x="${8 + i % columns * 23}" y="${8 + Math.floor(i / columns) * 23}" width="20" height="20" fill="var(--typora-${value === undefined ? "border" : "accent"})" opacity="${opacity}"><title>${date}${value === undefined ? "" : ` ${value}`}</title></rect>`;
  }
  return svgFrame(columns * 23 + 16, Math.ceil(count / columns) * 23 + 15, cells, field);
}

function xyChart(query, points) {
  const base = query.type === "bar" ? 0 : undefined;
  const values = [...points.map(({ value }) => value), ...[query.goal, base].filter((value) => value !== undefined)];
  const low = Math.min(...values);
  const high = Math.max(...values);
  const width = 640;
  const height = 245;
  const scale = high - low || 1;
  const y = (value) => 196 - (value - low) / scale * 154;
  const x = (index) => points.length === 1 ? 320 : 66 + index / (points.length - 1) * 548;
  let shapes = `<path d="M54 28v168h570" fill="none" stroke="var(--typora-border)"/>${svgText(5, 45, high)}${svgText(5, 196, low)}`;
  if (query.goal !== undefined) {
    shapes += `<line data-goal="${query.goal}" x1="54" x2="624" y1="${y(query.goal)}" y2="${y(query.goal)}" stroke="var(--typora-foreground)" stroke-dasharray="5 4"/>${svgText(64, y(query.goal) - 4, `目标 ${query.goal}`)}`;
  }
  if (query.type === "line") shapes += `<polyline fill="none" stroke="var(--typora-accent)" stroke-width="2" points="${points.map(({ value }, index) => `${x(index)},${y(value)}`).join(" ")}"/>`;
  const barWidth = Math.min(30, 520 / points.length);
  points.forEach(({ value, date }, index) => {
    const label = `<title>${date} ${text(value)}</title>`;
    shapes += query.type === "bar"
      ? `<rect x="${x(index) - barWidth / 2}" y="${Math.min(y(0), y(value))}" width="${barWidth}" height="${Math.max(1, Math.abs(y(0) - y(value)))}" fill="var(--typora-accent)">${label}</rect>`
      : `<circle cx="${x(index)}" cy="${y(value)}" r="3" fill="var(--typora-accent)">${label}</circle>`;
  });
  shapes += svgText(54, 225, points[0].date);
  if (points.length > 1) shapes += svgText(546, 225, points.at(-1).date);
  return svgFrame(width, height, shapes, query.field);
}

export function runTrack(query, notes, today = localToday()) {
  const buckets = new Map();
  const daily = new Set();
  const first = query.days ? dayOffset(today, 1 - query.days) : undefined;
  let skipped = 0;
  for (const note of notes) {
    if (!sourceIncludes(query.source, note)) continue;
    const date = calendarDate(note.properties.date) ?? calendarDate(note.name) ?? calendarDate(note.path.split("/").at(-1).replace(/\.(?:md|markdown)$/i, ""));
    if (!date) { skipped++; continue; }
    if (date > today || (first && date < first)) continue;
    const value = query.field.startsWith("#") ? Number(note.tags.includes(query.field.slice(1)))
      : numberWithUnit(Object.hasOwn(note.properties, query.field) ? note.properties[query.field] : undefined);
    if (value === undefined) { skipped++; continue; }
    const key = bucket(date, query.interval);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(value);
    daily.add(date);
  }
  const points = [...buckets].sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, value: combine(values, query.aggregate) }));
  if (!points.length && query.type !== "heatmap") {
    return { points, skipped, message: `没有可绘制的数据，跳过 ${skipped} 个文件` };
  }
  let streak = 0;
  const days = [...daily].sort();
  for (let day = days.at(-1); daily.has(day); day = dayOffset(day, -1)) streak++;
  const values = points.map(({ value }) => value);
  const summary = values.length
    ? `最小 ${Math.min(...values)} · 最大 ${Math.max(...values)} · 平均 ${Number(combine(values, "avg").toFixed(2))} · 连续 ${streak} 天 · 跳过 ${skipped} 个文件`
    : `没有可绘制的数据 · 跳过 ${skipped} 个文件`;
  const chart = query.type === "heatmap"
    ? heatmap(points, first ?? points[0]?.date ?? today, today, query.field)
    : xyChart(query, points);
  return { chart, points, skipped, summary };
}
