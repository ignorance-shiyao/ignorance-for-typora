import { createIndex } from "./core/controller.js";
import { registerDetailSnapshots } from "./core/details.js";
import { weekTasks } from "./index/tasks.js";
import { registerTasks } from "./index/fences.js";

export function activate(ctx) {
  const index = createIndex(typora, ["tasks"]);
  registerTasks(typora, index, ctx.subscriptions);
  registerDetailSnapshots(typora, index, ctx.subscriptions,
    (records) => ({ week: weekTasks(records) }),
    async (context) => (await typora.storage.get("week-demand"))?.[context] > Date.now(),
  );

  let pendingUpdate;
  ctx.subscriptions.push(
    typora.document.onDidChange(() => {
      clearTimeout(pendingUpdate);
      pendingUpdate = setTimeout(() => {
        void index.updateCurrent().catch((error) => typora.ui.toast(`工作区索引失败：${error.message}`));
      }, 300);
    }),
    {
      dispose() {
        clearTimeout(pendingUpdate);
      },
    },
  );
}
