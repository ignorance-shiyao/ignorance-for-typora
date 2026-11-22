export function registerIndexFence(api, index, subscriptions, id, parse, run) {
  subscriptions.push(api.views.registerFenceResolver(id, {
    resolve(fence, panel) {
      panel.entry = "views/results.html";
      panel.height = 110;
      let ready = false;
      let disposed = false;
      let version = 0;
      let previous;
      let parsed;
      let syntaxError;
      try {
        parsed = parse(fence.source);
      } catch (error) {
        syntaxError = error.message;
      }
      async function refresh() {
        if (!ready || disposed) return;
        const request = ++version;
        let result;
        try {
          if (syntaxError) {
            result = { message: syntaxError };
          } else {
            const state = await index.state();
            result = state.status === "ready" ? run(parsed, state.records)
              : { message: state.status === "indexing" ? "正在建立索引" : "请先打开工作区文件夹" };
          }
        } catch (error) {
          result = { message: `无法查询：${error.message}` };
        }
        if (disposed || request !== version) return;
        const serialized = JSON.stringify(result);
        if (serialized !== previous) {
          panel.postMessage(result);
          previous = serialized;
        }
      }
      const listener = index.onChange(() => void refresh());
      const timer = setInterval(() => void refresh(), 2500);
      panel.onMessage((message) => {
        if (message !== "ready") return;
        ready = true;
        previous = undefined;
        void refresh();
      });
      panel.onDidDispose(() => {
        disposed = true;
        listener.dispose();
        clearInterval(timer);
      });
    },
  }));
}
