// ```echarts fences: a static renderer. ECharts draws to an SVG string with
// its server-side mode, so the result is plain SVG that Typora sanitizes,
// inlines and exports. Colours follow the active Typora theme.
import { parseOption, parseInfo } from "./option.js";
import { renderChartSvg } from "./theme.js";

const view = window.typora.view;

view.onRender(({ source, info, theme }) => {
  const size = parseInfo(info);
  return { svg: renderChartSvg(window.echarts, parseOption(source), theme, size) };
});
