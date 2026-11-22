import { changeListItem, inspectList, listBranch, listOutline, listToHeadings, textToList } from "./outliner.js";

const ACTIONS = {
  "outline-up": "up",
  "outline-down": "down",
  "outline-promote": "promote",
  "outline-demote": "demote",
};

function currentListItem(blocks, anchor) {
  const byId = new Map(blocks.map((block) => [block.id, block]));
  let current = byId.get(anchor.blockId);
  while (current && current.type !== "list_item") current = byId.get(current.parent);
  if (!current) return undefined;
  const items = blocks.filter((block) => block.type === "list_item");
  return { index: items.indexOf(current), items, byId };
}

function matchingListTree(source, context) {
  if (source.length !== context.items.length) return false;
  const rowsById = new Map(context.items.map((block, index) => [block.id, source[index].row]));
  return context.items.every((block, index) => {
    let parent = context.byId.get(block.parent);
    while (parent && parent.type !== "list_item") parent = context.byId.get(parent.parent);
    return source[index].parentRow === rowsById.get(parent?.id);
  });
}

async function activeList(api) {
  const selection = await api.editor.getSelection();
  if (!selection?.anchor) {
    await api.ui.toast("请将光标放在列表内");
    return undefined;
  }
  const context = currentListItem(await api.document.getBlocks(), selection.anchor);
  if (!context) {
    await api.ui.toast("请将光标放在列表内");
    return undefined;
  }
  const markdown = await api.editor.getMarkdown();
  if (!matchingListTree(inspectList(markdown), context)) {
    await api.ui.toast("无法核对当前列表结构");
    return undefined;
  }
  return { markdown, index: context.index };
}

function previewRows(markdown) {
  return markdown.split(/\r\n|\r|\n/).map((line, index) => ({
    label: line.replace(/^ +/, (spaces) => "\u00a0".repeat(spaces.length)) || "\u00a0",
    value: index,
  }));
}

export function registerOutlinerCommands(api, subscriptions) {
  for (const [id, action] of Object.entries(ACTIONS)) {
    subscriptions.push(api.commands.register(id, async () => {
      const context = await activeList(api);
      if (!context) return;
      const next = changeListItem(context.markdown, context.index, action);
      if (next === context.markdown) return;
      if (await api.editor.getMarkdown() !== context.markdown) return api.ui.toast("文档已变化，请重新执行");
      await api.editor.replaceDocument(next);
    }));
  }
  subscriptions.push(api.commands.register("outline-branch", async () => {
    const context = await activeList(api);
    if (!context) return;
    await api.ui.quickPick(previewRows(listBranch(context.markdown, context.index)), { placeholder: "列表分支" });
  }));
  subscriptions.push(api.commands.register("outline-depth", async () => {
    const context = await activeList(api);
    if (!context) return;
    const levels = await api.ui.input({ prompt: "显示层数", value: "2" });
    if (levels == null) return;
    if (!/^[1-9]\d?$/.test(levels.trim())) return api.ui.toast("请输入 1 至 99");
    const outline = listOutline(context.markdown, context.index, Number(levels));
    await api.ui.quickPick(previewRows(outline), { placeholder: "列表大纲" });
  }));
  for (const [id, convert] of [["outline-to-list", textToList], ["outline-to-headings", listToHeadings]]) {
    subscriptions.push(api.commands.register(id, async () => {
      const selection = await api.editor.getSelection();
      if (!selection?.markdown?.trim()) return api.ui.toast("请先选中文字");
      let replacement;
      try {
        replacement = convert(selection.markdown);
      } catch (error) {
        return api.ui.toast(error.message);
      }
      if (replacement !== selection.markdown) {
        await api.editor.replaceRange({ anchor: selection.anchor, focus: selection.focus }, replacement);
      }
    }));
  }
}
