// Built-in chart renderer for slides: draws an option object (bar, line and
// pie; see chart-source.js for the fence format) as an SVG string. No chart library is
// bundled; anything outside this subset throws a readable error and the slide
// shows the source instead.
import { palette, esc, textWidth } from "./colors.js";

const SUPPORTED = ["bar", "line", "pie"];

const one = (v) => (Array.isArray(v) ? v[0] : v) || {};
const list = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const num = (v) => {
  const raw = Array.isArray(v) ? v[v.length - 1] : v && typeof v === "object" ? v.value : v;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};
const fmt = (n) => (Math.abs(n) >= 1e4 ? String(Math.round(n * 10) / 10).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : String(Math.round(n * 100) / 100));
const f = (n) => Math.round(n * 10) / 10;

function niceScale(min, max, count = 5) {
  if (min === max) max = min + 1;
  const span = max - min;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || 10 * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 1000; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { lo, hi, ticks };
}

function smoothPath(points) {
  if (points.length < 3) return "M" + points.map((p) => `${f(p[0])},${f(p[1])}`).join("L");
  let d = `M${f(points[0][0])},${f(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}

// Bar with rounded outer end; (x, y) is the top-left of the box.
function barPath(x, y, w, h, r, end) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (!r) return `M${f(x)},${f(y)}h${f(w)}v${f(h)}h${f(-w)}z`;
  if (end === "top") return `M${f(x)},${f(y + h)}V${f(y + r)}Q${f(x)},${f(y)} ${f(x + r)},${f(y)}H${f(x + w - r)}Q${f(x + w)},${f(y)} ${f(x + w)},${f(y + r)}V${f(y + h)}z`;
  if (end === "bottom") return `M${f(x)},${f(y)}H${f(x + w)}V${f(y + h - r)}Q${f(x + w)},${f(y + h)} ${f(x + w - r)},${f(y + h)}H${f(x + r)}Q${f(x)},${f(y + h)} ${f(x)},${f(y + h - r)}z`;
  if (end === "right") return `M${f(x)},${f(y)}H${f(x + w - r)}Q${f(x + w)},${f(y)} ${f(x + w)},${f(y + r)}V${f(y + h - r)}Q${f(x + w)},${f(y + h)} ${f(x + w - r)},${f(y + h)}H${f(x)}z`;
  return `M${f(x + w)},${f(y)}H${f(x + r)}Q${f(x)},${f(y)} ${f(x)},${f(y + r)}V${f(y + h - r)}Q${f(x)},${f(y + h)} ${f(x + r)},${f(y + h)}H${f(x + w)}z`;
}

function arcPath(cx, cy, r0, r1, a0, a1) {
  const pt = (r, a) => `${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))}`;
  if (a1 - a0 >= Math.PI * 2 - 1e-4) {
    const ring = (r, sweep) => `M${f(cx - r)},${f(cy)}A${r},${r} 0 1 ${sweep} ${f(cx + r)},${f(cy)}A${r},${r} 0 1 ${sweep} ${f(cx - r)},${f(cy)}z`;
    return ring(r1, 1) + (r0 > 0 ? ring(r0, 0) : "");
  }
  const large = a1 - a0 > Math.PI ? 1 : 0;
  let d = `M${pt(r1, a0)}A${r1},${r1} 0 ${large} 1 ${pt(r1, a1)}`;
  d += r0 > 0 ? `L${pt(r0, a1)}A${r0},${r0} 0 ${large} 0 ${pt(r0, a0)}z` : `L${f(cx)},${f(cy)}z`;
  return d;
}

export function renderChartSvg(option, theme, size = {}) {
  const c = palette(theme);
  const width = size.width || 960;
  const height = size.height || option.height || 460;
  const colors = Array.isArray(option.color) && option.color.length ? option.color : c.series;
  const series = list(option.series);
  if (!series.length) throw new Error("没有 series，无法画图。");
  for (const s of series) {
    if (!SUPPORTED.includes(s.type)) throw new Error(`演示里不支持图表类型 ${s.type}，可用 bar、line、pie。`);
  }
  const text = (x, y, s, o = {}) =>
    `<text x="${f(x)}" y="${f(y)}" font-size="${o.size || 18}" fill="${o.fill || c.muted}" text-anchor="${o.anchor || "middle"}"${o.weight ? ` font-weight="${o.weight}"` : ""}>${esc(s)}</text>`;
  const out = [];
  let top = 16;

  const title = one(option.title);
  if (title.text) {
    out.push(text(8, top + 24, title.text, { size: 28, fill: c.fg, anchor: "start", weight: 500 }));
    top += 36;
    if (title.subtext) {
      out.push(text(8, top + 14, title.subtext, { size: 18, anchor: "start" }));
      top += 26;
    }
  }

  const isPie = series.every((s) => s.type === "pie");
  if (!isPie && series.some((s) => s.type === "pie")) throw new Error("pie 不能与 bar、line 画在同一张图里。");

  const horizontal = !isPie && one(option.yAxis).type === "category" && series.every((s) => s.type === "bar");
  const catAxis = one(horizontal ? option.yAxis : option.xAxis);
  const valAxis = one(horizontal ? option.xAxis : option.yAxis);
  const dataLen = Math.max(...series.map((s) => list(s.data).length));
  const categories = isPie ? [] : list(catAxis.data).length ? list(catAxis.data).map((d) => (d && typeof d === "object" ? d.value : d)) : Array.from({ length: dataLen }, (_, i) => String(i + 1));

  // Legend: series names, or slice names for a pie.
  const names = isPie ? list(series[0].data).map((d, i) => String(d?.name ?? i + 1)) : series.map((s, i) => String(s.name ?? `系列 ${i + 1}`));
  const showLegend = option.legend !== undefined ? option.legend?.show !== false : isPie ? false : series.length > 1;
  if (showLegend) {
    const items = names.map((n) => ({ n, w: 12 + 8 + textWidth(n, 18) + 28 }));
    const total = items.reduce((a, b) => a + b.w, 0) - 28;
    let x = (width - total) / 2;
    const y = top + 14;
    items.forEach((it, i) => {
      out.push(`<circle cx="${f(x + 6)}" cy="${f(y - 6)}" r="6" fill="${colors[i % colors.length]}"/>`);
      out.push(text(x + 20, y, it.n, { anchor: "start" }));
      x += it.w;
    });
    top += 40;
  }

  if (isPie) {
    const s = series[0];
    const data = list(s.data).map((d, i) => ({ name: names[i], value: Math.max(0, num(d)) }));
    const sum = data.reduce((a, d) => a + d.value, 0);
    if (!sum) throw new Error("饼图的数据合计为 0。");
    const radius = list(s.radius);
    const pct = (v, base, fallback) => (typeof v === "string" && v.endsWith("%") ? (parseFloat(v) / 100) * base : Number.isFinite(Number(v)) && v !== undefined ? Number(v) : fallback);
    const area = { x: 0, y: top, w: width, h: height - top - 12 };
    const base = Math.min(area.w * 0.5, area.h) / 2;
    const r1 = pct(radius.length > 1 ? radius[1] : radius[0], base, base * 0.75);
    const r0 = radius.length > 1 ? pct(radius[0], base, 0) : 0;
    const cx = width / 2;
    const cy = area.y + area.h / 2;
    let a = -Math.PI / 2;
    data.forEach((d, i) => {
      const a1 = a + (d.value / sum) * Math.PI * 2;
      out.push(`<path d="${arcPath(cx, cy, r0, r1, a, a1)}" fill="${colors[i % colors.length]}" stroke="${c.bg}" stroke-width="3" stroke-linejoin="round"/>`);
      const mid = (a + a1) / 2;
      const right = Math.cos(mid) >= 0;
      const lx = cx + (r1 + 18) * Math.cos(mid);
      const ly = cy + (r1 + 18) * Math.sin(mid);
      if (d.value / sum > 0.015) {
        out.push(`<polyline points="${f(cx + (r1 + 2) * Math.cos(mid))},${f(cy + (r1 + 2) * Math.sin(mid))} ${f(lx)},${f(ly)}" fill="none" stroke="${c.line}" stroke-width="1.5"/>`);
        out.push(text(lx + (right ? 6 : -6), ly + 6, `${d.name} ${Math.round((d.value / sum) * 1000) / 10}%`, { anchor: right ? "start" : "end", fill: c.fg }));
      }
      a = a1;
    });
    return wrap(out, width, height, c);
  }

  // Cartesian geometry.
  const stacks = new Map();
  const stackOf = (s, i) => (s.stack ? `s:${s.stack}` : `i:${i}`);
  const cumulative = series.map(() => new Array(categories.length).fill(0));
  const base = series.map(() => new Array(categories.length).fill(0));
  series.forEach((s, i) => {
    const key = stackOf(s, i) + ":" + s.type;
    const sums = stacks.get(key) || new Array(categories.length).fill(0);
    stacks.set(key, sums);
    categories.forEach((_, k) => {
      const v = num(list(s.data)[k]);
      base[i][k] = sums[k];
      sums[k] += v;
      cumulative[i][k] = sums[k];
    });
  });
  let lo = 0;
  let hi = 0;
  series.forEach((_, i) => cumulative[i].forEach((v, k) => ((hi = Math.max(hi, v)), (lo = Math.min(lo, v, base[i][k])))));
  if (series.some((s) => s.type === "line") && series.every((s) => s.type === "line")) lo = Math.min(lo, ...cumulative.flat());
  if (Number.isFinite(valAxis.min)) lo = valAxis.min;
  if (Number.isFinite(valAxis.max)) hi = valAxis.max;
  const scale = niceScale(lo, hi === lo ? lo + 1 : hi);
  const tickLabels = scale.ticks.map(fmt);
  const catW = horizontal ? Math.max(...categories.map((k) => textWidth(k, 18))) : 0;
  const yLabelW = horizontal ? catW : Math.max(...tickLabels.map((t) => textWidth(t, 18)));
  const x0 = 8 + yLabelW + 16;
  const x1 = width - 24;
  const y0 = top + 12;
  const y1 = height - 44;
  const band = (horizontal ? y1 - y0 : x1 - x0) / categories.length;
  const along = (v) => (horizontal ? x0 + ((v - scale.lo) / (scale.hi - scale.lo)) * (x1 - x0) : y1 - ((v - scale.lo) / (scale.hi - scale.lo)) * (y1 - y0));

  scale.ticks.forEach((t, i) => {
    const p = along(t);
    if (horizontal) {
      out.push(`<line x1="${f(p)}" y1="${y0}" x2="${f(p)}" y2="${y1}" stroke="${c.grid}" stroke-width="1.5"/>`);
      out.push(text(p, y1 + 28, tickLabels[i]));
    } else {
      out.push(`<line x1="${x0}" y1="${f(p)}" x2="${x1}" y2="${f(p)}" stroke="${c.grid}" stroke-width="1.5"/>`);
      out.push(text(x0 - 14, p + 6, tickLabels[i], { anchor: "end" }));
    }
  });
  const zero = along(0);
  out.push(horizontal ? `<line x1="${f(zero)}" y1="${y0}" x2="${f(zero)}" y2="${y1}" stroke="${c.border}" stroke-width="1.5"/>` : `<line x1="${x0}" y1="${f(zero)}" x2="${x1}" y2="${f(zero)}" stroke="${c.border}" stroke-width="1.5"/>`);
  categories.forEach((k, i) => {
    const m = (horizontal ? y0 : x0) + band * (i + 0.5);
    out.push(horizontal ? text(x0 - 16, m + 6, k, { anchor: "end" }) : text(m, y1 + 28, k));
  });

  // Bars: one slot per stack group.
  const bars = series.map((s, i) => ({ s, i })).filter((e) => e.s.type === "bar");
  const groups = [...new Set(bars.map((e) => stackOf(e.s, e.i)))];
  const slot = Math.min(56, (band * 0.64) / Math.max(1, groups.length));
  const gap = 6;
  bars.forEach(({ s, i }) => {
    const g = groups.indexOf(stackOf(s, i));
    const color = colors[i % colors.length];
    const lastOfStack = (k) => !bars.some((e) => e.i > i && stackOf(e.s, e.i) === stackOf(s, i) && num(list(e.s.data)[k]) !== 0);
    categories.forEach((_, k) => {
      const v = num(list(s.data)[k]);
      if (!v) return;
      const a = along(base[i][k]);
      const b = along(cumulative[i][k]);
      const m = (horizontal ? y0 : x0) + band * (k + 0.5) - (groups.length * (slot + gap) - gap) / 2 + g * (slot + gap);
      const round = lastOfStack(k) ? 6 : 0;
      if (horizontal) out.push(`<path d="${barPath(Math.min(a, b), m, Math.abs(b - a), slot, round, v >= 0 ? "right" : "left")}" fill="${color}"/>`);
      else out.push(`<path d="${barPath(m, Math.min(a, b), slot, Math.abs(b - a), round, v >= 0 ? "top" : "bottom")}" fill="${color}"/>`);
      if (s.label?.show) out.push(horizontal ? text(Math.max(a, b) + 8, m + slot / 2 + 6, fmt(v), { anchor: "start", fill: c.fg }) : text(m + slot / 2, Math.min(a, b) - 8, fmt(v), { fill: c.fg }));
    });
  });

  // Lines draw above the bars.
  series.forEach((s, i) => {
    if (s.type !== "line") return;
    const color = colors[i % colors.length];
    const pts = categories.map((_, k) => [x0 + band * (k + 0.5), along(cumulative[i][k])]);
    const d = s.smooth ? smoothPath(pts) : "M" + pts.map((p) => `${f(p[0])},${f(p[1])}`).join("L");
    if (s.areaStyle) out.push(`<path d="${d}L${f(pts[pts.length - 1][0])},${f(zero)}L${f(pts[0][0])},${f(zero)}z" fill="${color}" fill-opacity="0.14"/>`);
    out.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`);
    if (s.showSymbol !== false && s.symbol !== "none")
      pts.forEach((p) => out.push(`<circle cx="${f(p[0])}" cy="${f(p[1])}" r="5.5" fill="${c.bg}" stroke="${color}" stroke-width="3"/>`));
    if (s.label?.show) pts.forEach((p, k) => out.push(text(p[0], p[1] - 14, fmt(num(list(s.data)[k])), { fill: c.fg })));
  });

  return wrap(out, width, height, c);
}

function wrap(parts, width, height, c) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" font-family='${c.font.replace(/'/g, "")}'>${parts.join("")}</svg>`;
}
