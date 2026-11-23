import { createReview } from "./index/review-controller.js";
import { createRelations, noteRelations } from "./index/relations.js";
import { relativePath } from "./index/scan.js";
import { registerSearch } from "./index/search-controller.js";
import { parseTrack, runTrack } from "./index/track.js";
import { registerDetailSnapshots } from "./index/details.js";
import { parseTaskQuery, runTasks, weekTasks } from "./index/tasks.js";
import { registerIndexFence } from "./index/fences.js";
import { parseQuery, runQuery } from "./index/query.js";
import { createIndex } from "./index/controller.js";

export function activate(ctx) {
  const index = createIndex(typora);
  registerIndexFence(typora, index, ctx.subscriptions, "query", parseQuery, runQuery);
  registerIndexFence(typora, index, ctx.subscriptions, "tasks", parseTaskQuery, runTasks);
  registerIndexFence(typora, index, ctx.subscriptions, "track", parseTrack, runTrack);
  const review = createReview(typora, index, ctx.subscriptions);
  let relationshipIndex;
  let revision;
  registerDetailSnapshots(typora, index, ctx.subscriptions, async (records, currentPath, state) => {
    if (revision !== state.revision || !relationshipIndex) {
      relationshipIndex = createRelations(records);
      revision = state.revision;
    }
    const path = relativePath(state.root, currentPath);
    return { week: weekTasks(records), review: await review.model(state), relations: path ? noteRelations(relationshipIndex, path) : undefined };
  });
  for (const key of ["graph-workspaces", "graph-refresh-done", "graph-ai-done", "graph-global", "graph-info", "graph-debug"]) void typora.storage.remove(key).catch(() => {});
  registerSearch(typora, index, ctx.subscriptions);
  const report = (error) => typora.ui.toast(`工作区索引失败：${error.message}`);
  ctx.subscriptions.push(
    typora.commands.register("rebuild-index", async () => {
      try {
        await index.rebuild({ announce: true });
        await review.prune(await index.state());
      } catch (error) {
        await report(error);
      }
    }),
    typora.document.onDidChange(() => index.updateCurrent().catch(report)),
    typora.settings.onDidChange(() => index.rebuild().catch(report)),
  );
  void index.rebuild({ announce: true }).catch(report);
}
