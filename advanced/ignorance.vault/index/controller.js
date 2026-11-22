import { parseVaultNote } from "./parse.js";
import { contentHash, excludedPath, relativePath, scanNotes } from "./scan.js";
import { cacheFile, loadIndex, saveIndex } from "./store.js";

export function createIndex(api) {
  const inFlight = new Map();
  const memory = new Map();
  const listeners = new Set();

  function exclusions() {
    return String(api.settings.get("excludeFolders") ?? "").split(/[,，\n]/);
  }

  function notify() {
    for (const listener of listeners) listener();
  }

  async function rebuild({ announce = false } = {}) {
    const root = (await api.workspace.folders())[0];
    if (!root) {
      if (announce) await api.ui.toast("请先打开工作区文件夹");
      return;
    }
    const key = await cacheFile(root);
    if (inFlight.has(key)) return inFlight.get(key);
    const pending = api.runtime.lock(key, async () => {
      const started = performance.now();
      const excluded = exclusions();
      const old = memory.get(key) ?? await loadIndex(api.storage, key);
      const result = await scanNotes(api.workspace, root, old, { exclude: excluded });
      result.excluded = excluded;
      memory.set(key, result);
      let cacheError;
      try {
        await saveIndex(api.storage, key, result);
        memory.delete(key);
      } catch (error) {
        cacheError = error.message;
      }
      const elapsed = Math.round(performance.now() - started);
      const notices = [`已索引 ${result.entries.length} 个文件，${elapsed} 毫秒`];
      if (result.limit) notices.push("最多只读取前 5,000 个文件");
      if (result.depthLimit) notices.push("最多读取 8 层目录");
      if (result.unreadable.length) notices.push(`${result.unreadable.length} 个文件读取失败`);
      if (cacheError) notices.push(`缓存未写入：${cacheError}`);
      if (announce || notices.length > 1) await api.ui.toast(notices.join("。"));
      return result;
    }).finally(() => {
      inFlight.delete(key);
      notify();
    });
    inFlight.set(key, pending);
    return pending;
  }

  async function state() {
    const root = (await api.workspace.folders())[0];
    if (!root) return { status: "no-workspace", records: [] };
    const key = await cacheFile(root);
    if (inFlight.has(key)) return { status: "indexing", records: [] };
    const existing = memory.get(key) ?? await loadIndex(api.storage, key);
    if (!existing || JSON.stringify(existing.excluded) !== JSON.stringify(exclusions())) {
      void rebuild().catch((error) => api.ui.toast(`无法建立索引：${error.message}`));
      return { status: "indexing", records: [] };
    }
    return { status: "ready", records: existing.entries.map(({ note, live }) => live ?? note) };
  }

  async function updateCurrent() {
    const root = (await api.workspace.folders())[0];
    const info = await api.document.info();
    if (!root || !info?.path) return;
    const path = relativePath(root, info.path);
    if (!path || !/\.(?:md|markdown)$/i.test(path) || excludedPath(path, exclusions())) return;
    const markdown = await api.editor.getMarkdown();
    const digest = await contentHash(markdown);
    if ((await api.document.info())?.path !== info.path) return;
    const key = await cacheFile(root);
    await api.runtime.lock(key, async () => {
      const existing = memory.get(key) ?? await loadIndex(api.storage, key);
      if (!existing) return;
      const entry = existing.entries.find((item) => item.note.path === path);
      if (!entry) return;
      if (digest === entry.hash) {
        delete entry.live;
      } else {
        entry.live = parseVaultNote(path, markdown);
      }
      try {
        await saveIndex(api.storage, key, existing);
        memory.delete(key);
      } catch {
        memory.set(key, existing);
      }
    });
    notify();
  }

  function onChange(listener) {
    listeners.add(listener);
    return { dispose: () => listeners.delete(listener) };
  }

  return { rebuild, state, updateCurrent, onChange };
}
