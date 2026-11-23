import { test } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

const ROOT = "/验收";
const ADVANCED = "../advanced/";

async function until(predicate) {
  for (let i = 0; i < 80; i++) {
    const value = await predicate();
    if (value) return value;
    await delay(50);
  }
  throw new Error("模拟宿主没有收到预期结果");
}

function createHost(t, { notes, current, settings = {}, demand = {} }) {
  const values = new Map(Object.entries(demand));
  const files = new Map();
  const commands = new Map();
  const resolvers = new Map();
  const locks = new Map();
  const notices = [];
  const state = { reads: 0, writes: 0, blockId: "first-block" };
  const noop = () => ({ dispose() {} });
  const paths = Object.keys(notes).map((name) => `${ROOT}/${name}`);
  const currentPath = `${ROOT}/${current}`;
  const api = {
    settings: { get: (key) => key ? settings[key] : settings, onDidChange: noop },
    workspace: {
      folders: () => [ROOT],
      listFiles: () => paths,
      readFile: (path) => {
        state.reads++;
        return notes[path.slice(ROOT.length + 1)];
      },
    },
    editor: { getMarkdown: () => notes[current], replaceDocument: () => { state.writes++; } },
    document: {
      info: () => ({ path: currentPath }),
      getBlocks: () => [{ id: state.blockId, type: "heading" }],
      onDidChange: noop,
    },
    views: { registerFenceResolver: (id, value) => { resolvers.set(id, value); return noop(); } },
    commands: { register: (id, value) => { commands.set(id, value); return noop(); } },
    storage: {
      get: async (key) => values.get(key),
      set: async (key, value) => { values.set(key, value); },
      update: async (key, change) => {
        const value = change(values.get(key));
        values.set(key, value);
        return value;
      },
      keys: async () => [...values.keys()],
      remove: async (key) => { values.delete(key); },
      files: {
        readText: async (key) => {
          if (!files.has(key)) throw new Error("not found");
          return files.get(key);
        },
        list: async () => [...files.keys()],
        write: async (key, value) => { files.set(key, value); },
      },
    },
    runtime: {
      lock: (key, operation) => {
        const result = (locks.get(key) ?? Promise.resolve()).then(operation);
        locks.set(key, result.catch(() => {}));
        return result;
      },
    },
    ui: { toast: async (notice) => { notices.push(notice); } },
  };
  const saved = globalThis.typora;
  globalThis.typora = api;
  const subscriptions = [];
  t.after(() => {
    subscriptions.forEach((subscription) => subscription.dispose());
    globalThis.typora = saved;
  });
  return { values, files, commands, resolvers, notices, state, subscriptions };
}

async function render(host, id, source) {
  let onMessage;
  let model;
  const panel = { postMessage: (next) => { model = next; }, onMessage: (callback) => { onMessage = callback; } };
  host.resolvers.get(id).resolve({ source }, panel);
  onMessage("ready");
  try {
    await until(() => {
      if (!model || /建立索引/.test(model.message ?? "")) {
        void onMessage("refresh");
        return false;
      }
      return true;
    });
  } catch (error) {
    throw new Error(`${error.message}：${JSON.stringify(model)}`);
  }
  return model;
}

const STAR = "---\nowner: 甲\ndate: 2026-11-16\n睡眠: 7\n---\n\n# 星河\n\n- [ ] 买菜 📅 2026-11-25\n\n问题 :: 答案\n";
const REVIEW = "---\ndate: 2026-11-18\n睡眠: 7.5h\n---\n\n评审引用 [[星河]]\n";

test("property-query：从激活到查询代码块出结果", async (t) => {
  const host = createHost(t, { notes: { "项目/星河.md": STAR, "项目/评审.md": REVIEW }, current: "项目/星河.md" });
  const { activate } = await import(ADVANCED + "ignorance.property-query/main.js");
  activate({ subscriptions: host.subscriptions });
  const model = await render(host, "query", "from: 项目/\nwhere: owner = \"甲\"\nfields: 文件, owner");
  assert.deepEqual(model.groups[0].rows[0].cells, ["星河", "甲"]);
  assert.equal(host.state.writes, 0);
});

test("task-rollup：任务代码块只列出未完成任务", async (t) => {
  const host = createHost(t, { notes: { "项目/星河.md": STAR, "项目/评审.md": REVIEW }, current: "项目/星河.md" });
  const { activate } = await import(ADVANCED + "ignorance.task-rollup/main.js");
  activate({ subscriptions: host.subscriptions });
  const model = await render(host, "tasks", "status: open");
  assert.equal(model.count, 1);
  assert.match(model.groups[0].rows[0].cells.join(" "), /买菜/);
  assert.equal(host.state.writes, 0);
});

test("value-track：图表代码块画出两篇日记的点并跳过没有字段的笔记", async (t) => {
  const host = createHost(t, { notes: { "日记/a.md": STAR, "日记/b.md": REVIEW, "日记/c.md": "没有属性\n" }, current: "日记/a.md" });
  const { activate } = await import(ADVANCED + "ignorance.value-track/main.js");
  activate({ subscriptions: host.subscriptions });
  const model = await render(host, "track", "from: 日记/\nfield: 睡眠\nrange: last 3660d");
  assert.deepEqual(model.points.map(({ value }) => value), [7, 7.5]);
  assert.equal(model.skipped, 1);
});

test("backlinks：当前笔记的侧栏数据包含反向链接", async (t) => {
  const host = createHost(t, {
    notes: { "项目/星河.md": STAR, "项目/评审.md": REVIEW },
    current: "项目/星河.md",
    demand: { "relations-demand": { "first-block": Date.now() + 60_000 } },
  });
  const { activate } = await import(ADVANCED + "ignorance.backlinks/main.js");
  activate({ subscriptions: host.subscriptions });
  const detail = await until(() => host.values.get("detail-contexts")?.["first-block"]?.relations);
  assert.equal(detail.incoming.length, 1);
  assert.equal(detail.incoming[0].name, "评审");
});

test("vault-search：搜索请求得到带高亮片段的结果，不写文档", async (t) => {
  const host = createHost(t, { notes: { "项目/星河.md": STAR, "项目/评审.md": REVIEW }, current: "项目/星河.md" });
  const { activate } = await import(ADVANCED + "ignorance.vault-search/main.js");
  activate({ subscriptions: host.subscriptions });
  host.values.set("search-request-first-block", { id: "search-one", query: "星河", at: Date.now() });
  const result = await until(() => host.values.get("search-response-first-block")?.results);
  assert.equal(result[0].name, "星河");
  assert.ok(result[0].snippet.some(({ match }) => match));
  assert.equal(host.state.writes, 0);
  assert.ok(host.commands.has("search-workspace"));
});

test("flashcards：重复评分只计一次，重建索引复用缓存且不写文档", async (t) => {
  const host = createHost(t, {
    notes: { "项目/星河.md": STAR },
    current: "项目/星河.md",
    settings: { reviewReminders: false },
    demand: { "review-demand": { "first-block": Date.now() + 60_000, "replacement-block": Date.now() + 60_000 } },
  });
  const { activate } = await import(ADVANCED + "ignorance.flashcards/main.js");
  activate({ subscriptions: host.subscriptions });
  const model = await until(() => host.values.get("detail-contexts")?.["first-block"]?.review?.next && host.values.get("detail-contexts")["first-block"].review);
  const card = model.next;
  assert.equal(card.question, "问题");
  for (const key of ["review-request-one", "review-request-two"]) {
    host.values.set(key, { card: card.id, version: 0, quality: 4, scope: model.scope, at: Date.now() });
  }
  const responses = await until(() => {
    const result = host.values.get("review-responses");
    return result?.["review-request-one"] && result?.["review-request-two"] && result;
  });
  assert.equal(responses["review-request-one"].error, "");
  assert.match(responses["review-request-two"].error, /其他窗口/);
  const review = host.values.get(model.scope + "-review");
  assert.equal(review.records[card.id].version, 1);
  assert.deepEqual(Object.values(review.history), [1]);
  assert.equal(host.state.writes, 0);

  host.state.blockId = "replacement-block";
  assert.ok(host.commands.has("rebuild-flashcards"));
  await host.commands.get("rebuild-flashcards")();
  assert.ok(host.notices.some((notice) => notice.includes("复用 1 个文件的解析缓存")));
  const replacement = await until(() => host.values.get("detail-contexts")?.["replacement-block"]?.review);
  assert.equal(replacement.reviewedToday, 1);
  assert.equal(replacement.next, null);
});

for (const id of ["property-query", "task-rollup", "value-track", "backlinks", "vault-search", "flashcards"]) {
  test(`${id}：没有被使用时不扫描工作区`, async (t) => {
    const host = createHost(t, { notes: { "项目/星河.md": STAR }, current: "项目/星河.md" });
    const { activate } = await import(ADVANCED + `ignorance.${id}/main.js`);
    activate({ subscriptions: host.subscriptions });
    await delay(400);
    assert.equal(host.state.reads, 0);
    assert.equal(host.files.size, 0);
  });
}
