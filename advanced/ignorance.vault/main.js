import { registerIndexFence } from "./index/fences.js";
import { parseQuery, runQuery } from "./index/query.js";
import { createIndex } from "./index/controller.js";

export function activate(ctx) {
  const index = createIndex(typora);
  registerIndexFence(typora, index, ctx.subscriptions, "query", parseQuery, runQuery);
  const report = (error) => typora.ui.toast(`工作区索引失败：${error.message}`);
  ctx.subscriptions.push(
    typora.commands.register("rebuild-index", () => index.rebuild({ announce: true }).catch(report)),
    typora.document.onDidChange(() => index.updateCurrent().catch(report)),
    typora.settings.onDidChange(() => index.rebuild().catch(report)),
  );
  void index.rebuild({ announce: true }).catch(report);
}
