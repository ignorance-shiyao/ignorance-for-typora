const ready = new Promise((resolve) => view.onMessage(resolve));
view.onRender(async () => {
  view.postMessage("ready");
  let timeout;
  try {
    const count = await Promise.race([
      ready,
      new Promise((resolve) => { timeout = setTimeout(() => resolve(null), 2000); }),
    ]);
    return { html: Number.isInteger(count?.files) ? `<p>工作区文件数：${count.files}</p>` : "<p>未收到工作区数据</p>" };
  } finally {
    clearTimeout(timeout);
  }
});
