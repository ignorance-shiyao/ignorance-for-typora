import { test } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { activate } from "../advanced/ignorance.vault/main.js";
import { contentHash } from "../advanced/ignorance.vault/index/scan.js";

async function until(predicate) {
  for (let i = 0; i < 60; i++) {
    const value = predicate();
    if (value) return value;
    await delay(50);
  }
  throw new Error("模拟宿主没有收到预期结果");
}

test("runs the Vault Worker entry from indexing through query, search and review request", async (t) => {
  const keyValues = new Map();
  const files = new Map();
  const commands = new Map();
  const resolvers = new Map();
  const locks = new Map();
  const settings = { excludeFolders: "templates/", reviewReminders: false };
  const original = "---\nowner: 甲\n---\n\n# 星河\n\n问题 :: 答案\n";
  const root = "/验收";
  const path = root + "/项目/星河.md";
  const noop = () => ({ dispose() {} });
  const notices = [];
  const inputs = { reads: 0, writes: 0, blockId: "first-block" };
  const api = {
    settings: { get: (key) => key ? settings[key] : settings, onDidChange: noop },
    workspace: { folders: () => [root], listFiles: () => [path], readFile: () => { inputs.reads++; return original; } },
    editor: { getMarkdown: () => original, replaceDocument: () => { inputs.writes++; } },
    document: {
      info: () => ({ path }), getBlocks: () => [{ id: inputs.blockId, type: "heading" }], onDidChange: noop,
    },
    views: { registerFenceResolver: (id, value) => { resolvers.set(id, value); return noop(); } },
    commands: { register: (id, value) => { commands.set(id, value); return noop(); } },
    storage: {
      get: async (key) => keyValues.get(key),
      set: async (key, value) => { keyValues.set(key, value); },
      update: async (key, change) => {
        const value = change(keyValues.get(key));
        keyValues.set(key, value);
        return value;
      },
      keys: async () => [...keyValues.keys()],
      remove: async (key) => { keyValues.delete(key); },
      files: {
        readText: async (key) => {
          if (!files.has(key)) throw new Error("not found");
          return files.get(key);
        },
        list: async () => [...files.keys()],
        write: async (key, value) => { files.set(key, value); },
      },
    },
    runtime: { lock: (key, operation) => {
      const result = (locks.get(key) ?? Promise.resolve()).then(operation);
      locks.set(key, result.catch(() => {}));
      return result;
    } },
    ui: { toast: async (notice) => { notices.push(notice); } },
  };
  const originalTypora = globalThis.typora;
  globalThis.typora = api;
  const subscriptions = [];
  t.after(() => {
    subscriptions.forEach((subscription) => subscription.dispose());
    globalThis.typora = originalTypora;
  });
  activate({ subscriptions });
  const scope = `index-${await contentHash(root)}.json`;
  await until(() => files.get(scope));
  assert.equal(inputs.reads, 1);

  let onReady;
  let model;
  const panel = {
    postMessage: (next) => { model = next; },
    onMessage: (callback) => { onReady = callback; },
  };
  resolvers.get("query").resolve({ source: "fields: 文件, owner" }, panel);
  onReady("ready");
  await until(() => model?.count);
  assert.deepEqual(model.groups[0].rows[0].cells, ["星河", "甲"]);

  await until(() => keyValues.get("detail-contexts")?.["first-block"]?.review?.next);
  const card = keyValues.get("detail-contexts")["first-block"].review.next;
  assert.equal(card.question, "问题");
  for (const key of ["review-request-one", "review-request-two"]) {
    keyValues.set(key, { card: card.id, version: 0, quality: 4, scope, at: Date.now() });
  }
  await until(() => keyValues.get("review-responses")?.["review-request-two"]);
  assert.equal(keyValues.get(scope + "-review").records[card.id].version, 1);
  assert.match(keyValues.get("review-responses")["review-request-two"].error, /其他窗口/);
  assert.equal(inputs.writes, 0);

  keyValues.set("search-request-first-block", { id: "search-one", query: "星河", at: Date.now() });
  const result = await until(() => keyValues.get("search-response-first-block"));
  assert.equal(result.results[0].name, "星河");
  assert.ok(result.results[0].snippet.some(({ match }) => match));
  assert.ok(commands.has("rebuild-index"));

  // Typora can replace the leading block ID while the computed data stays identical.
  inputs.blockId = "replacement-block";
  await commands.get("rebuild-index")();
  assert.ok(notices.some((notice) => notice.includes("复用 1 个文件的解析缓存")));
  const replacement = await until(() => keyValues.get("detail-contexts")?.["replacement-block"]?.review);
  assert.equal(replacement.reviewedToday, 1);
  assert.equal(replacement.next, null);
});
