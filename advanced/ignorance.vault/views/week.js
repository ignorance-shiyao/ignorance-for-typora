let activeBlock;
let shown;

async function readWeek() {
  const context = activeBlock;
  if (!context) return;
  const stored = (await sdk.storage.get("detail-contexts"))?.[context];
  if (activeBlock !== context) return;
  const model = stored?.week ?? { message: stored?.message ?? (stored?.status === "no-workspace" ? "请先打开工作区文件夹" : "正在建立索引") };
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
