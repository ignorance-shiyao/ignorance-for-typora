let currentContext;
let shownSnapshot;

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
  if (!context) return;
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

sdk.onDocument(({ blocks }) => {
  currentContext = blocks[0]?.id;
  shownSnapshot = undefined;
  output.textContent = "正在建立索引";
  void readRelations();
});
setInterval(() => { void readRelations().catch(() => {}); }, 1000);
