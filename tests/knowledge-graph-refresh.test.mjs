import { test } from "node:test";
import assert from "node:assert/strict";
import { createGraphRefresh, REFRESH_PREFIX, REFRESH_DONE } from "../advanced/ignorance.knowledge-graphs/index/graph-refresh.js";

import { cacheFile } from "../advanced/ignorance.knowledge-graphs/index/store.js";

const root = "/graph-test";
const scope = await cacheFile(root);

function fakeApi(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    store,
    workspace: { folders: () => [root] },
    storage: {
      keys: async () => [...store.keys()],
      get: async (key) => store.get(key),
      set: async (key, value) => { store.set(key, value); },
      remove: async (key) => { store.delete(key); },
      update: async (key, change) => { store.set(key, change(store.get(key))); },
    },
    runtime: { lock: async (_key, work) => work() },
  };
}

test("one rebuild answers every pending refresh request and clears them", async () => {
  const api = fakeApi({
    [`${REFRESH_PREFIX}a`]: { scope, at: Date.now() },
    [`${REFRESH_PREFIX}b`]: { scope, at: Date.now() },
    [`${REFRESH_PREFIX}other`]: { scope: "other-workspace", at: Date.now() },
    unrelated: 1,
  });
  let rebuilds = 0;
  await createGraphRefresh(api, { rebuild: async () => { rebuilds++; } }).poll();
  assert.equal(rebuilds, 1);
  assert.deepEqual([...api.store.keys()].filter((key) => key.startsWith(REFRESH_PREFIX) && key !== REFRESH_DONE), [`${REFRESH_PREFIX}other`]);
  assert.deepEqual(Object.keys(api.store.get(REFRESH_DONE)).sort(), [`${REFRESH_PREFIX}a`, `${REFRESH_PREFIX}b`]);
  assert.equal(api.store.get("unrelated"), 1);
});

test("a stale request is dropped without rebuilding", async () => {
  const api = fakeApi({ [`${REFRESH_PREFIX}old`]: { scope, at: Date.now() - 10 * 60_000 } });
  let rebuilds = 0;
  await createGraphRefresh(api, { rebuild: async () => { rebuilds++; } }).poll();
  assert.equal(rebuilds, 0);
  assert.equal(api.store.has(`${REFRESH_PREFIX}old`), false);
});

test("a failed rebuild is reported in the response and the request is still cleared", async () => {
  const api = fakeApi({ [`${REFRESH_PREFIX}x`]: { scope, at: Date.now() } });
  await createGraphRefresh(api, { rebuild: async () => { throw new Error("磁盘不可读"); } }).poll();
  assert.equal(api.store.get(REFRESH_DONE)[`${REFRESH_PREFIX}x`].error, "磁盘不可读");
  assert.equal(api.store.has(`${REFRESH_PREFIX}x`), false);
});

test("polling with no request does nothing", async () => {
  const api = fakeApi();
  let rebuilds = 0;
  await createGraphRefresh(api, { rebuild: async () => { rebuilds++; } }).poll();
  assert.equal(rebuilds, 0);
  assert.equal(api.store.size, 0);
});
