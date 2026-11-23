import { createIndex } from "./core/controller.js";
import { registerSearch } from "./index/search-controller.js";

export function activate(ctx) {
  const index = createIndex(typora, ["terms"]);
  registerSearch(typora, index, ctx.subscriptions);
  let pendingUpdate;
  ctx.subscriptions.push(
    typora.document.onDidChange(() => {
      clearTimeout(pendingUpdate);
      pendingUpdate = setTimeout(() => {
        void index.updateCurrent().catch((error) => typora.ui.toast(`搜索索引更新失败：${error.message}`));
      }, 300);
    }),
    { dispose() { clearTimeout(pendingUpdate); } },
  );
}
