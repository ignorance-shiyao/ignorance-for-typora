// Built-in flowchart renderer for slides: reads a Mermaid `graph` / `flowchart`
// (nodes, arrows, edge labels, chains) and draws an SVG string. Other Mermaid
// diagram types and subgraphs throw a readable error and the slide shows the
// source instead.
import { palette, esc, textWidth } from "./colors.js";

const SKIP = /^(style|classDef|class|linkStyle|click|accTitle|accDescr)\b/;
const NODE = /^\s*([A-Za-z0-9_一-龥]+)(?:\(\((.*?)\)\)|\(\[(.*?)\]\)|\[(.*?)\]|\((.*?)\)|\{(.*?)\})?/;
const EDGE = /^\s*(?:(-->|---|-\.->|-\.-|==>|===)(?:\|([^|]*)\|)?|--\s+([^-][^>]*?)\s+(-->|---)|-\.\s+([^.]+?)\s+\.->|==\s+([^=]+?)\s+==>)/;

const clean = (s) => (s === undefined ? undefined : s.trim().replace(/^"(.*)"$/, "$1").replace(/<br\s*\/?>/gi, "\n"));

export function parseFlow(source) {
  const lines = String(source).split(/\r?\n|;/).map((l) => l.trim()).filter((l) => l && !l.startsWith("%%"));
  const head = /^(?:graph|flowchart)(?:\s+(TD|TB|BT|LR|RL))?\s*$/i.exec(lines.shift() || "");
  if (!head) throw new Error("演示里只能画流程图（graph 或 flowchart），其他 Mermaid 图显示为源码。");
  const dir = (head[1] || "TD").toUpperCase().replace("TB", "TD");
  const nodes = new Map();
  const edges = [];
  const touch = (m) => {
    const [, id, round2, stadium, rect, round, diamond] = m;
    const node = nodes.get(id) || { id, label: id, shape: "rect" };
    const pairs = [[round2, "circle"], [stadium, "stadium"], [rect, "rect"], [round, "round"], [diamond, "diamond"]];
    for (const [label, shape] of pairs) if (label !== undefined) Object.assign(node, { label: clean(label), shape });
    nodes.set(id, node);
    return node;
  };
  for (const line of lines) {
    if (SKIP.test(line)) continue;
    if (/^(subgraph|end|direction)\b/.test(line)) throw new Error("演示里的流程图不支持 subgraph，请改为普通节点。");
    let rest = line;
    let m = NODE.exec(rest);
    if (!m) throw new Error(`无法解析流程图：${line}`);
    let from = touch(m);
    rest = rest.slice(m[0].length);
    while (rest.trim()) {
      const e = EDGE.exec(rest);
      if (!e) throw new Error(`无法解析流程图：${line}`);
      rest = rest.slice(e[0].length);
      m = NODE.exec(rest);
      if (!m) throw new Error(`无法解析流程图：${line}`);
      const to = touch(m);
      rest = rest.slice(m[0].length);
      const op = e[1] || e[4] || (e[5] ? "-.->" : "==>");
      edges.push({ from: from.id, to: to.id, label: clean(e[2] ?? e[3] ?? e[5] ?? e[6]), dashed: op.includes("."), thick: op.startsWith("="), arrow: op.endsWith(">") });
      from = to;
    }
  }
  if (!nodes.size) throw new Error("流程图里没有节点。");
  return { dir, nodes: [...nodes.values()], edges };
}

const FONT = 18;
const LINE = 26;

function measure(node) {
  const rows = node.label.split("\n");
  const tw = Math.max(...rows.map((r) => textWidth(r, FONT)));
  const h = rows.length * LINE + 26;
  if (node.shape === "diamond") return { rows, w: Math.max(96, tw * 1.5 + 36), h: Math.max(72, h * 1.5) };
  if (node.shape === "circle") {
    const d = Math.max(72, tw + 36, h + 20);
    return { rows, w: d, h: d };
  }
  return { rows, w: Math.max(88, tw + 44), h: Math.max(48, h) };
}

function layout(graph) {
  const vertical = graph.dir === "TD" || graph.dir === "BT";
  const byId = new Map(graph.nodes.map((n) => [n.id, Object.assign(n, measure(n))]));
  // Longest-path ranks; edges that close a cycle are ignored for ranking.
  const out = new Map(graph.nodes.map((n) => [n.id, []]));
  graph.edges.forEach((e) => out.get(e.from).push(e.to));
  const state = new Map();
  const back = new Set();
  const visit = (id) => {
    state.set(id, 1);
    for (const to of out.get(id)) {
      if (state.get(to) === 1) back.add(id + ">" + to);
      else if (!state.get(to)) visit(to);
    }
    state.set(id, 2);
  };
  graph.nodes.forEach((n) => !state.get(n.id) && visit(n.id));
  const rank = new Map(graph.nodes.map((n) => [n.id, 0]));
  for (let pass = 0; pass < graph.nodes.length; pass++) {
    let changed = false;
    for (const e of graph.edges) {
      if (back.has(e.from + ">" + e.to) || e.from === e.to) continue;
      if (rank.get(e.to) < rank.get(e.from) + 1) (rank.set(e.to, rank.get(e.from) + 1), (changed = true));
    }
    if (!changed) break;
  }
  const layers = [];
  graph.nodes.forEach((n) => (layers[rank.get(n.id)] ||= []).push(n));
  const pos = new Map();
  // Barycentre ordering, two sweeps.
  const order = () => layers.forEach((layer) => layer.forEach((n, i) => pos.set(n.id, i)));
  order();
  for (let pass = 0; pass < 2; pass++) {
    const sweep = (layer, neighbours) => {
      const key = (n) => {
        const ns = neighbours(n).filter((id) => pos.has(id));
        return ns.length ? ns.reduce((a, id) => a + pos.get(id), 0) / ns.length : pos.get(n.id);
      };
      layer.sort((a, b) => key(a) - key(b));
      order();
    };
    layers.forEach((layer, r) => r > 0 && sweep(layer, (n) => graph.edges.filter((e) => e.to === n.id && rank.get(e.from) < r).map((e) => e.from)));
    for (let r = layers.length - 2; r >= 0; r--) sweep(layers[r], (n) => graph.edges.filter((e) => e.from === n.id && rank.get(e.to) > r).map((e) => e.to));
  }
  const gapCross = 40;
  const gapRank = 84;
  const cross = (n) => (vertical ? n.w : n.h);
  const flow = (n) => (vertical ? n.h : n.w);
  const spans = layers.map((layer) => layer.reduce((a, n) => a + cross(n), 0) + gapCross * (layer.length - 1));
  const widest = Math.max(...spans);
  let offset = 0;
  const placed = layers.map((layer, r) => {
    const depth = Math.max(...layer.map(flow));
    let c = (widest - spans[r]) / 2;
    layer.forEach((n) => {
      n.c = c + cross(n) / 2;
      n.r = offset + depth / 2;
      c += cross(n) + gapCross;
    });
    offset += depth + gapRank;
    return depth;
  });
  const total = offset - gapRank;
  graph.nodes.forEach((n) => {
    const r = graph.dir === "BT" || graph.dir === "RL" ? total - n.r : n.r;
    n.x = vertical ? n.c : r;
    n.y = vertical ? r : n.c;
  });
  return { width: vertical ? widest : total, height: vertical ? total : widest, ranks: rank, placed };
}

let counter = 0;

export function renderFlowSvg(source, theme) {
  const c = palette(theme);
  const graph = parseFlow(source);
  const { width, height, ranks } = layout(graph);
  const pad = 28;
  const id = `flow-arrow-${++counter}`;
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const shapeOf = (n) => {
    const x = n.x - n.w / 2;
    const y = n.y - n.h / 2;
    const style = `fill="${c.tint}" stroke="${c.accent}" stroke-width="2"`;
    if (n.shape === "diamond") return `<polygon points="${n.x},${y} ${x + n.w},${n.y} ${n.x},${y + n.h} ${x},${n.y}" ${style} stroke-linejoin="round"/>`;
    if (n.shape === "circle") return `<ellipse cx="${n.x}" cy="${n.y}" rx="${n.w / 2}" ry="${n.h / 2}" ${style}/>`;
    const rx = n.shape === "stadium" ? n.h / 2 : n.shape === "round" ? 16 : 10;
    return `<rect x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="${rx}" ${style}/>`;
  };
  const vertical = graph.dir === "TD" || graph.dir === "BT";
  const sign = graph.dir === "BT" || graph.dir === "RL" ? -1 : 1;
  const parts = [];
  const labels = [];
  const fx = (n) => Math.round(n * 10) / 10;
  for (const e of graph.edges) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    let [sx, sy, tx, ty] = [a.x, a.y, b.x, b.y];
    const dr = ranks.get(e.to) - ranks.get(e.from);
    let d;
    let off = 0;
    if (e.from === e.to) {
      sx = a.x + a.w / 2;
      sy = a.y;
      d = `M${fx(sx)},${fx(sy)}C${fx(sx + 60)},${fx(sy - 40)} ${fx(sx + 60)},${fx(sy + 40)} ${fx(sx + 3)},${fx(sy + 8)}`;
      tx = sx + 40;
      ty = sy;
    } else {
      const k = 0.5;
      if (dr < 0) {
        // Back edge: leave and enter on the side, bulging outward so it never overlaps the forward edge.
        off = 56;
        if (vertical) {
          sx = a.x + a.w / 2;
          tx = b.x + b.w / 2;
          d = `M${fx(sx)},${fx(sy)}C${fx(sx + off)},${fx(sy)} ${fx(tx + off)},${fx(ty)} ${fx(tx)},${fx(ty)}`;
        } else {
          sy = a.y + a.h / 2;
          ty = b.y + b.h / 2;
          d = `M${fx(sx)},${fx(sy)}C${fx(sx)},${fx(sy + off)} ${fx(tx)},${fx(ty + off)} ${fx(tx)},${fx(ty)}`;
        }
      } else if (dr > 0) {
        if (vertical) ((sy += (sign * a.h) / 2), (ty -= (sign * b.h) / 2));
        else ((sx += (sign * a.w) / 2), (tx -= (sign * b.w) / 2));
        d = vertical ? `M${fx(sx)},${fx(sy)}C${fx(sx)},${fx(sy + (ty - sy) * k)} ${fx(tx)},${fx(ty - (ty - sy) * k)} ${fx(tx)},${fx(ty)}` : `M${fx(sx)},${fx(sy)}C${fx(sx + (tx - sx) * k)},${fx(sy)} ${fx(tx - (tx - sx) * k)},${fx(ty)} ${fx(tx)},${fx(ty)}`;
      } else {
        if (vertical) {
          const dir = Math.sign(b.x - a.x) || 1;
          sx += (dir * a.w) / 2;
          tx -= (dir * b.w) / 2;
        } else {
          const dir = Math.sign(b.y - a.y) || 1;
          sy += (dir * a.h) / 2;
          ty -= (dir * b.h) / 2;
        }
        d = `M${fx(sx)},${fx(sy)}L${fx(tx)},${fx(ty)}`;
      }
    }
    parts.push(`<path d="${d}" fill="none" stroke="${c.line}" stroke-width="${e.thick ? 3.5 : 2}"${e.dashed ? ' stroke-dasharray="7 6"' : ""}${e.arrow ? ` marker-end="url(#${id})"` : ""}/>`);
    if (e.label) {
      const lw = textWidth(e.label, 16) + 16;
      const mx = (sx + tx) / 2 + (vertical ? off * 0.75 : 0);
      const my = (sy + ty) / 2 + (vertical ? 0 : off * 0.75);
      labels.push(`<rect x="${fx(mx - lw / 2)}" y="${fx(my - 13)}" width="${fx(lw)}" height="26" rx="6" fill="${c.bg}"/><text x="${fx(mx)}" y="${fx(my + 6)}" font-size="16" fill="${c.muted}" text-anchor="middle">${esc(e.label)}</text>`);
    }
  }
  for (const n of graph.nodes) {
    parts.push(shapeOf(n));
    const top = n.y - ((n.rows.length - 1) * LINE) / 2;
    n.rows.forEach((row, i) => parts.push(`<text x="${fx(n.x)}" y="${fx(top + i * LINE + 6)}" font-size="${FONT}" fill="${c.fg}" text-anchor="middle">${esc(row)}</text>`));
  }
  const bulge = graph.edges.some((e) => ranks.get(e.to) < ranks.get(e.from)) ? 64 : 0;
  const w = Math.round(width + pad * 2 + (vertical ? bulge : 0));
  const h = Math.round(height + pad * 2 + (vertical ? 0 : bulge));
  const marker = `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,1L9,5L0,9z" fill="${c.line}"/></marker></defs>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" font-family='${c.font.replace(/'/g, "")}'>${marker}<g transform="translate(${pad},${pad})">${parts.join("")}${labels.join("")}</g></svg>`;
}
