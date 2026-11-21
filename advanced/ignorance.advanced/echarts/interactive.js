// ```echarts fences, interactive mode: a live chart in its own frame, so hover
// tooltips, legend toggles, dataZoom and brushing work on a single click.
// Editing stays in Typora's code editor. Export and print take a static SVG.
import { parseOption, parseInfo } from "./option.js";
import { themeFor, renderChartSvg } from "./theme.js";

const view = window.typora.view;
const box = document.getElementById("chart");
const errorBox = document.getElementById("error");
let chart = null;
let current = null;

function show(message) {
  errorBox.textContent = message;
  errorBox.style.display = message ? "block" : "none";
  box.style.display = message ? "none" : "block";
}

function draw() {
  if (!current) return;
  try {
    const size = parseInfo(current.info);
    const option = parseOption(current.source);
    const { height: _omit, ...rest } = option;
    box.style.height = `${size.height || option.height || 400}px`;
    const redraw = Boolean(chart);
    const kept = chart ? chart.getOption()?.legend?.[0]?.selected : null;
    if (chart) chart.dispose();
    window.echarts.registerTheme("ignorance-live", themeFor(view.theme));
    show("");
    chart = window.echarts.init(box, "ignorance-live", { renderer: "canvas" });
    const merged = kept && rest.legend && !Array.isArray(rest.legend) ? { ...rest, legend: { ...rest.legend, selected: kept } } : rest;
    // A repeat draw is not a first view: skip the grow-in animation so it does not flicker.
    chart.setOption(redraw ? { ...merged, animation: false } : merged);
    view.setHeight(box.offsetHeight);
  } catch (error) {
    show(String(error?.message || error));
    view.autoHeight();
  }
}

// Typora can call onOpen again for the same fence (for example when the caret moves);
// drawing again would reset a legend toggle or zoom the reader just made.
view.onOpen(({ source, info }) => {
  if (current && current.source === source && current.info === info) return;
  current = { source, info };
  draw();
});
let themeKey = JSON.stringify([view.theme?.dark, view.theme?.vars]);
view.onTheme(() => {
  const next = JSON.stringify([view.theme?.dark, view.theme?.vars]);
  if (next === themeKey) return;
  themeKey = next;
  draw();
});
window.addEventListener("resize", () => chart?.resize());

view.onSnapshot(() => {
  const size = parseInfo(current.info);
  return { svg: renderChartSvg(window.echarts, parseOption(current.source), view.theme, size) };
});
