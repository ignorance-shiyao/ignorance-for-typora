const STORAGE_TOKEN = "vault-probe-token";
const REPORT = "probe-scan-results";

async function scan() {
  const roots = await typora.workspace.folders();
  if (roots.length !== 1) return typora.ui.toast("请打开一个合成测试工作区");
  const [root] = roots;
  if (!/^vault-probe-(?:1000|3000|5000|5001)$/.test(root.split(/[\\/]/).at(-1))) {
    return typora.ui.toast("请使用生成脚本创建的合成工作区");
  }
  const phase = await typora.ui.quickPick(["首次扫描", "再次扫描"], { placeholder: "选择扫描阶段" });
  if (!phase) return;
  const key = `cache-${root.split(/[\\/]/).at(-1)}.json`;
  const start = performance.now();
  const hasCache = await typora.storage.get(key);
  const previous = phase === "再次扫描" && hasCache
    ? JSON.parse(await typora.storage.files.readText(key))
    : {};
  const paths = (await typora.workspace.listFiles(root)).filter((path) => /\.md$/i.test(path));
  const hashes = {};
  let changed = 0;
  for (let offset = 0; offset < paths.length; offset += 16) {
    await Promise.all(paths.slice(offset, offset + 16).map(async (file) => {
      const text = await typora.workspace.readFile(file);
      const bytes = new TextEncoder().encode(text);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      hashes[file] = hash;
      if (previous[file] !== hash) changed++;
    }));
  }
  await typora.storage.files.write(key, JSON.stringify(hashes));
  await typora.storage.set(key, true);
  const expected = Number(root.split(/[\\/]/).at(-1).slice("vault-probe-".length));
  const truncated = paths.length < expected;
  const result = {
    phase, expected, files: paths.length, changed, reused: paths.length - changed, truncated,
    milliseconds: Math.round(performance.now() - start),
  };
  await typora.storage.update(REPORT, (previousReport) => [...(previousReport ?? []).slice(-59), result]);
  const notice = truncated ? `。样例含 ${expected} 个文件，宿主未返回完整列表` : "";
  await typora.ui.toast(`${phase}：${result.files} 个文件，${result.changed} 个变更，复用 ${result.reused} 个，${result.milliseconds} 毫秒${notice}`);
}

export function activate(ctx) {
  ctx.subscriptions.push(
    typora.commands.register("probe-storage", async () => {
      await typora.storage.set(STORAGE_TOKEN, "worker → detail");
      await typora.ui.toast("已写入验证值");
    }),
    typora.commands.register("probe-scan", scan),
    typora.views.registerFenceResolver("probe-static", {
      resolve(_fence, panel) {
        panel.entry = "views/static.html";
        panel.onMessage(async (message) => {
          if (message !== "ready") return;
          const folders = await typora.workspace.folders();
          const files = folders[0] ? await typora.workspace.listFiles(folders[0]) : [];
          panel.postMessage({ files: files.length });
        });
      },
    }),
    typora.views.registerFenceResolver("probe-interactive", {
      resolve(_fence, panel) {
        panel.entry = "views/link.html";
        panel.height = 110;
        panel.onMessage(async (message) => {
          if (message !== "open") return;
          try {
            await typora.commands.execute("file.open");
            panel.postMessage("已调用文件打开命令");
          } catch (error) {
            panel.postMessage(error.message);
          }
        });
      },
    }),
  );
}
