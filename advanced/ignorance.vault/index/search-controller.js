import { createSearchIndex, parseSearch, searchNotes } from "./search.js";

const MAX_RESULTS = 30;
const EXPIRY = 20_000;

export function registerSearch(api, index, subscriptions) {
  let cached;
  let invalidated = true;
  let refreshAt = 0;
  let polling = false;
  let path;
  let context;
  let handled;
  let disposed = false;

  async function getSearchIndex() {
    if (!invalidated && Date.now() < refreshAt) return cached;
    const state = await index.state();
    if (state.status !== "ready") return undefined;
    cached = createSearchIndex(state.records);
    invalidated = false;
    refreshAt = Date.now() + 5000;
    return cached;
  }

  async function run(source) {
    if (!source.trim()) return { results: [] };
    try {
      const parsed = parseSearch(source);
      const searchIndex = await getSearchIndex();
      return searchIndex
        ? { results: searchNotes(searchIndex, parsed, MAX_RESULTS) }
        : { message: "正在建立索引" };
    } catch (error) {
      return { message: error.message };
    }
  }

  async function poll() {
    if (disposed || polling) return;
    polling = true;
    try {
      const info = await api.document.info();
      if (info?.path !== path || (!context && info?.path)) {
        path = info?.path;
        context = path && (await api.document.getBlocks())[0]?.id;
      }
      if (!context) return;
      const request = (await api.storage.get("search-requests"))?.[context];
      if (!request || request.id === handled || Date.now() - request.at > EXPIRY) return;
      const response = await run(request.query);
      if (response.message !== "正在建立索引") handled = request.id;
      const key = context;
      await api.storage.update("search-responses", (previous) => {
        const kept = Object.entries(previous ?? {}).filter(([id, value]) => id !== key && Date.now() - value.at <= EXPIRY).slice(-3);
        return Object.fromEntries([...kept, [key, { ...response, id: request.id, at: Date.now() }]]);
      });
    } finally {
      polling = false;
    }
  }

  const timer = setInterval(() => { void poll().catch(() => {}); }, 90);
  subscriptions.push(
    index.onChange(() => { invalidated = true; context = undefined; }),
    { dispose() { disposed = true; clearInterval(timer); } },
    api.commands.register("search-workspace", async () => {
      const query = await api.ui.input({ prompt: "搜索工作区", placeholder: "关键词" });
      if (query == null || !query.trim()) return;
      const result = await run(query);
      if (result.message) return api.ui.toast(result.message);
      if (!result.results.length) return api.ui.toast("没有匹配的文件");
      const target = await api.ui.quickPick(result.results.map((item) => ({
        label: item.name, description: item.heading || item.path, value: item.path,
      })), { placeholder: "工作区搜索结果" });
      if (target) await api.ui.input({ prompt: "相对路径", value: target });
    }),
  );
}
