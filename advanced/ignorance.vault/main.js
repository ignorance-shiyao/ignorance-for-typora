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
  let relationshipIndex;
  let revision;
  registerDetailSnapshots(typora, index, ctx.subscriptions, (records, currentPath, state) => {
    if (revision !== state.revision || !relationshipIndex) {
      relationshipIndex = createRelations(records);
      revision = state.revision;
    }
    const path = relativePath(state.root, currentPath);
    return { week: weekTasks(records), relations: path ? noteRelations(relationshipIndex, path) : undefined };
  });
  registerSearch(typora, index, ctx.subscriptions);
  const report = (error) => typora.ui.toast(`工作区索引失败：${error.message}`);
  ctx.subscriptions.push(
    typora.commands.register("rebuild-index", () => index.rebuild({ announce: true }).catch(report)),
    typora.document.onDidChange(() => index.updateCurrent().catch(report)),
    typora.settings.onDidChange(() => index.rebuild().catch(report)),
  );
  void index.rebuild({ announce: true }).catch(report);
}
