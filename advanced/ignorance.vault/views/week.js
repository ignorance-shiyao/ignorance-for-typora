let activeBlock;
let shown;

async function readWeek() {
  if (!activeBlock) return;
  const stored = (await sdk.storage.get("detail-contexts"))?.[activeBlock];
  const model = stored?.week ?? { message: stored?.status === "no-workspace" ? "请先打开工作区文件夹" : "正在建立索引" };
  if (!model.count && !model.message) model.message = "本周没有到期任务";
  const next = JSON.stringify(model);
  if (shown !== next) {
    shown = next;
    render(model);
  }
}

sdk.onDocument(({ blocks }) => {
  activeBlock = blocks[0]?.id;
  void readWeek();
});
setInterval(() => void readWeek(), 1000);
