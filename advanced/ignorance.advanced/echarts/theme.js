// ECharts theme derived from Typora's view theme; shared by the fence renderer and the slides view.

function cssVar(theme, name, fallback) {
  const value = theme?.vars?.[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function mix(a, b, t) {
  const pa = toRgb(a);
  const pb = toRgb(b);
  if (!pa || !pb) return a;
  return "#" + pa.map((v, i) => Math.round(v * (1 - t) + pb[i] * t).toString(16).padStart(2, "0")).join("");
}

function toRgb(color) {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color || "");
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(color || "");
  if (rgb) return rgb[1].split(/[\s,/]+/).slice(0, 3).map(Number);
  return null;
}

// Series colours: the accent first, then the Ignorance chart hues.
const LIGHT_SERIES = ["#D97706", "#0F8A72", "#B6548C", "#2F8DBD", "#C9561B", "#7867C9", "#6F7A29"];
const DARK_SERIES = ["#F2B84B", "#4FC3A5", "#D889B6", "#67B7DC", "#E9865A", "#A79BE6", "#AEB95E"];

export function themeFor(theme) {
  const dark = Boolean(theme?.dark);
  const fg = theme?.foreground || cssVar(theme, "--typora-foreground", dark ? "#E5E9F0" : "#1F2937");
  const bg = theme?.background || cssVar(theme, "--typora-background", dark ? "#0F172A" : "#FAF8F4");
  const accent = theme?.accent || cssVar(theme, "--typora-accent", dark ? "#6F9AF4" : "#356FD8");
  const border = theme?.border || cssVar(theme, "--typora-border", mix(bg, fg, 0.12));
  const muted = mix(fg, bg, 0.4);
  const axis = {
    axisLine: { lineStyle: { color: border } },
    axisTick: { lineStyle: { color: border } },
    axisLabel: { color: muted },
    splitLine: { lineStyle: { color: mix(bg, fg, 0.07) } },
    nameTextStyle: { color: muted },
  };
  return {
    color: [accent, ...(dark ? DARK_SERIES : LIGHT_SERIES)],
    backgroundColor: "transparent",
    textStyle: { color: fg, fontFamily: cssVar(theme, "--typora-font", "-apple-system, 'PingFang SC', sans-serif") },
    title: { textStyle: { color: fg, fontWeight: 500 }, subtextStyle: { color: muted } },
    legend: { textStyle: { color: muted } },
    tooltip: { backgroundColor: bg, borderColor: border, textStyle: { color: fg } },
    categoryAxis: axis,
    valueAxis: axis,
    timeAxis: axis,
    logAxis: axis,
    radar: { axisName: { color: muted }, splitLine: { lineStyle: { color: border } }, axisLine: { lineStyle: { color: border } }, splitArea: { show: false } },
    graph: { label: { color: fg }, lineStyle: { color: border } },
  };
}

// Draws one option to an SVG string. `height` inside the option is a
// convenience for the fence and is not passed to ECharts.
export function renderChartSvg(echarts, option, theme, size = {}) {
  const width = size.width || 720;
  const height = size.height || option.height || 400;
  const { height: _omit, ...rest } = option;
  echarts.registerTheme("ignorance-current", themeFor(theme));
  const chart = echarts.init(null, "ignorance-current", { renderer: "svg", ssr: true, width, height });
  try {
    chart.setOption({ animation: false, ...rest });
    return chart.renderToSVGString();
  } finally {
    chart.dispose();
  }
}
