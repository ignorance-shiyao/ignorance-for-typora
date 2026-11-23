const sdk = window.typora.view;
const output = document.querySelector("#output");

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
  });
  display.append(button, value);
  return display;
}

let currentContext;
let shownSnapshot;
let announcedContext;
let validUntil = 0;
let pending;

function showRelations(data) {
  output.replaceChildren();
  if (!data) {
    output.textContent = "没有当前笔记的关系";
    return;
  }
  if (data.ancestry.length) {
    const lineage = element("p");
    for (const ancestor of data.ancestry) lineage.append(pathValue(ancestor.name, ancestor.path), " → ");
    lineage.append(data.current.name);
    output.append(lineage);
  }
  for (const [title, rows] of [
    ["反向链接", data.incoming], ["未链接提及", data.mentions], ["上级", data.parents],
    ["同级", data.siblings], ["下级", data.children], ["出链", data.outgoing],
  ]) {
    if (!rows.length) continue;
    const section = element("section");
    section.append(element("h3", title));
    const list = element("ul");
    for (const item of rows) {
      const line = element("li");
      line.append(item.path ? pathValue(item.name, item.path) : element("span", item.name));
      if (item.broken) line.append(" · 断链");
      else if (item.heading) line.append(` · ${item.heading}`);
      if (item.context) line.append(element("p", item.context));
      if (item.references?.length) {
        const references = element("ul");
        for (const reference of item.references) {
          const location = element("li", `第 ${reference.line} 行`);
          if (reference.heading) location.append(` · ${reference.heading}`);
          if (reference.context) location.append(element("p", reference.context));
          references.append(location);
        }
        line.append(references);
      }
      list.append(line);
    }
    section.append(list);
    output.append(section);
  }
  if (!output.childNodes.length) output.textContent = "没有关联笔记";
}

async function readRelations() {
  const context = currentContext;
  if (!context || document.hidden) return;
  const now = Date.now();
  if (announcedContext !== context || validUntil - now < 4000) {
    const entry = await sdk.storage.get("relations-demand") ?? {};
    const active = Object.entries(entry).filter(([, expires]) => expires > now);
    const expiration = now + 8000;
    await sdk.storage.set("relations-demand", { ...Object.fromEntries(active), [context]: expiration });
    validUntil = expiration;
    announcedContext = context;
  }
  const stored = (await sdk.storage.get("detail-contexts"))?.[context];
  if (context !== currentContext) return;
  const signature = JSON.stringify(stored?.relations ?? stored?.message ?? stored?.status ?? null);
  if (signature === shownSnapshot) return;
  shownSnapshot = signature;
  if (stored?.message) output.textContent = stored.message;
  else if (!stored || stored.status === "indexing") output.textContent = "正在建立索引";
  else if (stored.status === "no-workspace") output.textContent = "请先打开工作区文件夹";
  else showRelations(stored.relations);
}

function refresh() {
  if (!pending) {
    pending = readRelations().catch(() => {
      output.textContent = "无法读取笔记关系";
    }).finally(() => { pending = undefined; });
  }
}

sdk.onDocument(({ blocks }) => {
  currentContext = blocks[0]?.id;
  shownSnapshot = undefined;
  output.textContent = currentContext ? "正在建立索引" : "请先打开文档";
  refresh();
});
const retry = setInterval(refresh, 1000);
document.addEventListener("visibilitychange", refresh);
window.addEventListener("pagehide", ({ persisted }) => {
  if (!persisted) clearInterval(retry);
});
