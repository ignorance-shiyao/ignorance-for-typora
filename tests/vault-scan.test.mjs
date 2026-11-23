import { test } from "node:test";
import assert from "node:assert/strict";
import { createIndex } from "../packages/vault-core/controller.js";
import { excludedPath, relativePath, scanNotes } from "../packages/vault-core/scan.js";

test("scans inside the root with exclusions and reuses unmodified entries", async () => {
  const root = "/workspace";
  const files = new Map([
    ["/workspace/a.md", "# 甲"], ["/workspace/notes/b.markdown", "# 乙"],
    ["/workspace/notes/templates/skip.md", "# 不索引"], ["/workspace/no.txt", "# 不索引"],
    ["/elsewhere/secret.md", "# 不索引"],
  ]);
  const workspace = { listFiles: () => [...files.keys()], readFile: (file) => files.get(file) };
  const options = { exclude: ["templates/"], hash: (content) => content };
  const initial = await scanNotes(workspace, root, undefined, options);
  assert.deepEqual(initial.entries.map(({ note }) => note.path), ["a.md", "notes/b.markdown"]);
  files.set("/workspace/notes/b.markdown", "# 新标题");
  const updated = await scanNotes(workspace, root, initial, options);
  assert.equal(updated.reused, 1);
  assert.equal(updated.entries[1].note.headings[0].text, "新标题");
  assert.deepEqual(updated.unreadable, []);
  assert.equal(relativePath("C:\\vault", "C:\\vault\\a.md"), "a.md");
  assert.equal(relativePath(root, root + "/../secret.md"), null);
  assert.equal(excludedPath("notes/archive2/a.md", ["notes/archive"]), false);
});

test("reports host file and depth ceilings without reading filtered paths", async () => {
  const files = ["a/b/c/d/e/f/g/h.md", ...Array.from({ length: 5000 }, (_, number) => `skip/${number}.txt`)];
  const result = await scanNotes({ listFiles: () => files, readFile: () => "# 条目" }, "/test", undefined);
  assert.equal(result.limit, true);
  assert.equal(result.depthLimit, true);
  assert.equal(result.entries.length, 1);
});

test("shares current note edits across controllers using the same cache", async () => {
  const storage = new Map();
  const locks = new Map();
  const metadata = new Map();
  const file = "/workspace/a.md";
  let editorMarkdown = "---\nstatus: 初始\n---\n";
  let diskMarkdown = editorMarkdown;
  const api = {
    settings: { get: () => "" },
    workspace: { folders: () => ["/workspace"], listFiles: () => [file], readFile: () => diskMarkdown },
    document: { info: () => ({ path: file }) },
    editor: { getMarkdown: () => editorMarkdown },
    storage: { get: (key) => metadata.get(key), set: (key, value) => metadata.set(key, value), files: { readText: (key) => storage.get(key), write: (key, value) => storage.set(key, value) } },
    runtime: { lock: (key, operation) => {
      const result = (locks.get(key) ?? Promise.resolve()).then(operation);
      locks.set(key, result.catch(() => {}));
      return result;
    } },
    ui: { toast: () => {} },
  };
  const first = createIndex(api);
  const second = createIndex(api);
  await Promise.all([first.rebuild(), second.rebuild()]);
  editorMarkdown = "---\nstatus: 更新\n---\n";
  await first.updateCurrent();
  assert.equal((await second.state()).records[0].properties.status, "更新");
  await second.rebuild();
  assert.equal((await first.state()).records[0].properties.status, "更新");
  diskMarkdown = "---\nstatus: 已保存\n---\n";
  await first.rebuild();
  assert.equal((await second.state()).records[0].properties.status, "已保存");
});


test("relativePath accepts macOS firmlink aliases of the same folder", () => {
  assert.equal(relativePath("/private/tmp/库", "/tmp/库/项目/总计划.md"), "项目/总计划.md");
  assert.equal(relativePath("/tmp/库", "/private/tmp/库/项目/总计划.md"), "项目/总计划.md");
  assert.equal(relativePath("/private/var/folders/x/库", "/var/folders/x/库/甲.md"), "甲.md");
});

test("relativePath treats composed and decomposed Unicode names as the same", () => {
  const decomposed = "/库/Cafe\u0301/笔记.md";
  assert.equal(relativePath("/库/Caf\u00e9", decomposed), "笔记.md");
});

test("relativePath still rejects files outside the root, including look-alike prefixes", () => {
  assert.equal(relativePath("/tmp/库", "/tmp/库外/甲.md"), null);
  assert.equal(relativePath("/tmp/库", "/other/甲.md"), null);
  assert.equal(relativePath("/private/tmp/库", "/privatex/tmp/库/甲.md"), null);
  assert.equal(relativePath("/tmp/库", "/tmp/库/../甲.md"), null);
});

test("relativePath keeps working for ordinary and Windows-style paths", () => {
  assert.equal(relativePath("/Users/a/库", "/Users/a/库/项目/甲.md"), "项目/甲.md");
  assert.equal(relativePath("C:\\库", "C:\\库\\项目\\甲.md"), "项目/甲.md");
});

test("keeps edits to two different notes when both windows publish concurrently", async () => {
  const root = "/workspace";
  const paths = [root + "/a.md", root + "/b.md"];
  const disk = new Map(paths.map((path) => [path, "---\nowner: before\n---\n"]));
  const cache = new Map();
  const metadata = new Map();
  const locks = new Map();
  const common = {
    settings: { get: () => "" },
    workspace: { folders: () => [root], listFiles: () => paths, readFile: (path) => disk.get(path) },
    storage: {
      get: (key) => metadata.get(key),
      set: (key, value) => metadata.set(key, value),
      files: { readText: (key) => cache.get(key), write: (key, value) => cache.set(key, value) },
    },
    runtime: { lock: (key, operation) => {
      const next = (locks.get(key) ?? Promise.resolve()).then(operation);
      locks.set(key, next.catch(() => {}));
      return next;
    } },
    ui: { toast() {} },
  };
  const windows = paths.map((path, index) => createIndex({
    ...common,
    document: { info: () => ({ path }) },
    editor: { getMarkdown: () => `---\nowner: window-${index + 1}\n---\n` },
  }));
  await windows[0].rebuild();
  await Promise.all(windows.map((window) => window.state()));
  await Promise.all(windows.map((window) => window.updateCurrent()));

  const expected = [
    ["a.md", "window-1"],
    ["b.md", "window-2"],
  ];
  for (const window of windows) {
    const { records } = await window.state();
    assert.deepEqual(records.map(({ path, properties }) => [path, properties.owner]), expected);
  }
  assert.ok([...disk.values()].every((markdown) => markdown.includes("owner: before")));
});

test("announces the first scan when a workspace opens after Worker startup", async () => {
  let folders = [];
  const metadata = new Map();
  const cache = new Map();
  const notices = [];
  const index = createIndex({
    settings: { get: () => "" },
    workspace: {
      folders: () => folders,
      listFiles: () => ["/workspace/a.md"],
      readFile: () => "# First note",
    },
    storage: {
      get: (key) => metadata.get(key),
      set: (key, value) => metadata.set(key, value),
      files: { readText: (key) => cache.get(key), write: (key, value) => cache.set(key, value) },
    },
    runtime: { lock: async (_key, work) => work() },
    ui: { toast: (value) => notices.push(value) },
  });
  assert.equal((await index.state()).status, "no-workspace");
  const finished = new Promise((resolve) => index.onChange(resolve));
  folders = ["/workspace"];
  assert.equal((await index.state()).status, "indexing");
  await finished;

  assert.equal((await index.state()).records.length, 1);
  assert.equal(notices.filter((notice) => /已索引 1 个文件，\d+ 毫秒/.test(notice)).length, 1);
});
