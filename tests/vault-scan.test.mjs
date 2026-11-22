import { test } from "node:test";
import assert from "node:assert/strict";
import { createIndex } from "../advanced/ignorance.vault/index/controller.js";
import { excludedPath, relativePath, scanNotes } from "../advanced/ignorance.vault/index/scan.js";

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
