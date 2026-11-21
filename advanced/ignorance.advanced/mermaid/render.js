// ```mermaid fences drawn with Mermaid.js and the Ignorance palette. Typora's own
// renderer reads fixed neutral colours, so this one takes the accent from the view
// theme and follows palette and light/dark changes.
import { mermaidConfig } from "../slides/diagram-theme.js";

const view = window.typora.view;
let mermaidLib = null;
let counter = 0;

function load() {
  // Absolute URL: a relative import() has no base inside the sandboxed page.
  mermaidLib ??= import(new URL("../vendor/mermaid.esm.min.mjs", document.baseURI).href).then((m) => m.default);
  mermaidLib.catch(() => (mermaidLib = null));
  return mermaidLib;
}

view.onRender(async ({ source, theme }) => {
  const vars = view.theme?.vars || {};
  const colors = {
    ...theme,
    accent: vars["--typora-accent"] || theme?.accent,
  };
  const mermaid = await load();
  mermaid.initialize(mermaidConfig(colors));
  const id = `ib-mermaid-${++counter}`;
  const { svg } = await mermaid.render(id, source).finally(() => {
    document.getElementById(`d${id}`)?.remove();
    document.getElementById(id)?.remove();
  });
  return { svg };
});
