import { parseTaskQuery, runTasks } from "./tasks.js";

function attachResults(panel, index, run) {
  let pending;
  let previous;
  panel.onMessage((message) => {
    if (message === "ready") previous = undefined;
    if ((message !== "ready" && message !== "refresh") || pending) return pending;
    pending = (async () => {
      let result;
      try {
        const state = await index.state();
        result = state.status === "ready"
          ? run(state.records)
          : { message: state.message ?? (state.status === "indexing" ? "正在建立索引" : "请先打开工作区文件夹") };
      } catch (error) {
        result = { message: `无法查询：${error.message}` };
      }
      const serialized = JSON.stringify(result);
      if (serialized !== previous) {
        panel.postMessage(result);
        previous = serialized;
      }
    })().finally(() => { pending = undefined; });
    return pending;
  });
}

export function registerTasks(api, index, subscriptions) {
  subscriptions.push(
    api.views.registerFenceResolver("tasks", {
      resolve(fence, panel) {
        panel.entry = "views/results.html";
        panel.height = 110;
        try {
          const query = parseTaskQuery(fence.source);
          attachResults(panel, index, (records) => runTasks(query, records));
        } catch (error) {
          panel.onMessage((message) => {
            if (message === "ready") panel.postMessage({ message: error.message });
          });
        }
      },
    }),
  );
}
