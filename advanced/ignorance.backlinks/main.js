import { createIndex } from "./core/controller.js";
import { registerDetailSnapshots } from "./core/details.js";
import { relativePath } from "./core/scan.js";
import { createRelations, noteRelations } from "./index/relations.js";

export function activate(ctx) {
  const index = createIndex(typora, ["properties", "links"]);
  let graph;
  let revision;
  registerDetailSnapshots(typora, index, ctx.subscriptions, (records, documentPath, state) => {
    if (!graph || state.revision !== revision) {
      graph = createRelations(records);
      revision = state.revision;
    }
    const path = relativePath(state.root, documentPath);
    return { relations: path ? noteRelations(graph, path) : undefined };
  }, async (context) => (await typora.storage.get("relations-demand"))?.[context] > Date.now());

  let pendingUpdate;
  ctx.subscriptions.push(
    typora.document.onDidChange(() => {
      clearTimeout(pendingUpdate);
      pendingUpdate = setTimeout(() => {
        void index.updateCurrent().catch((error) => typora.ui.toast(`工作区索引失败：${error.message}`));
      }, 300);
    }),
    { dispose() { clearTimeout(pendingUpdate); } },
  );
}
