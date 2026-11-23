export function registerIndexFence(api, index, subscriptions, id, parse, run) {
  subscriptions.push(api.views.registerFenceResolver(id, {
    resolve(fence, panel) {
      panel.entry = "views/results.html";
      panel.height = 110;
      let pending;
      let previous;
      let scope;
      let revision;
      let cachedResult;
      let parsed;
      let syntaxError;
      try {
        parsed = parse(fence.source);
      } catch (error) {
        syntaxError = error.message;
      }
      async function refresh() {
        let result;
        try {
          if (syntaxError) {
            result = { message: syntaxError };
          } else {
            const state = await index.state();
            if (state.status === "ready") {
              if (!cachedResult || scope !== state.scope || revision !== state.revision) {
                cachedResult = run(parsed, state.records);
                scope = state.scope;
                revision = state.revision;
              }
              result = cachedResult;
            } else {
              result = { message: state.message ?? (state.status === "indexing" ? "正在建立索引" : "请先打开工作区文件夹") };
            }
          }
        } catch (error) {
          result = { message: `无法查询：${error.message}` };
        }
        const serialized = JSON.stringify(result);
        if (serialized !== previous) {
          panel.postMessage(result);
          previous = serialized;
        }
      }
      panel.onMessage((message) => {
        if (message === "ready") previous = undefined;
        if (message !== "ready" && message !== "refresh") return;
        if (!pending) {
          pending = refresh().finally(() => { pending = undefined; });
        }
        return pending;
      });
    },
  }));
}
