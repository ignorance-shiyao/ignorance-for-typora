import { createIndex } from "./core/controller.js";
import { registerIndexFence } from "./index/fences.js";
import { parseTrack, runTrack } from "./index/track.js";

export function activate(ctx) {
  const index = createIndex(typora, ["properties"]);
  registerIndexFence(typora, index, ctx.subscriptions, "track", parseTrack, runTrack);

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
