import { createIndex } from "./core/controller.js";
import { registerDetailSnapshots } from "./core/details.js";
import { createReview } from "./index/review-controller.js";

export function activate(ctx) {
  const index = createIndex(typora, ["cards"]);
  const review = createReview(typora, index, ctx.subscriptions);
  registerDetailSnapshots(typora, index, ctx.subscriptions, async (_records, _path, state) => ({
    review: await review.model(state),
  }), async (context) => (await typora.storage.get("review-demand"))?.[context] > Date.now());

  const report = (error) => typora.ui.toast(`复习索引更新失败：${error.message}`);
  let pendingUpdate;
  ctx.subscriptions.push(
    typora.commands.register("rebuild-flashcards", async () => {
      try {
        await index.rebuild({ announce: true });
        await review.prune(await index.state({ start: false }));
      } catch (error) {
        await report(error);
      }
    }),
    typora.document.onDidChange(() => {
      clearTimeout(pendingUpdate);
      pendingUpdate = setTimeout(() => {
        void index.updateCurrent().catch(report);
      }, 300);
    }),
    { dispose() { clearTimeout(pendingUpdate); } },
  );
}
