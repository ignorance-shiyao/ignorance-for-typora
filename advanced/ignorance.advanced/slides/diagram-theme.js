// Mermaid settings for slides, coloured from the Typora view theme so
// diagrams match the Ignorance palette in light and dark.
import { mix } from "../echarts/theme.js";
export function mermaidConfig(theme = {}) {
  const dark = Boolean(theme.dark);
  const fg = theme.foreground || (dark ? "#E5E9F0" : "#1F2937");
  const bg = theme.background || (dark ? "#0F172A" : "#FAF8F4");
  const accent = theme.accent || (dark ? "#6F9AF4" : "#356FD8");
  const border = theme.border || (dark ? "#334155" : "#C7D2E0");
  const tint = mix(bg, accent, dark ? 0.18 : 0.1);
  return {
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    darkMode: dark,
    fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
    themeVariables: {
      darkMode: dark,
      background: bg,
      primaryColor: tint,
      primaryTextColor: fg,
      primaryBorderColor: accent,
      secondaryColor: bg,
      tertiaryColor: bg,
      lineColor: border,
      textColor: fg,
      mainBkg: tint,
      nodeBorder: accent,
      clusterBkg: bg,
      clusterBorder: border,
      edgeLabelBackground: bg,
      noteBkgColor: bg,
      noteTextColor: fg,
      noteBorderColor: border,
      actorBkg: tint,
      actorBorder: accent,
      actorTextColor: fg,
      signalColor: fg,
      signalTextColor: fg,
      fontSize: "18px",
    },
    flowchart: { htmlLabels: false, useMaxWidth: true, curve: "basis" },
    sequence: { useMaxWidth: true },
    gantt: { useMaxWidth: true },
  };
}
