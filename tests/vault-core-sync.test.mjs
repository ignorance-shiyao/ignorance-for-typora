import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";
import { destinations, source } from "../scripts/sync-vault-core.mjs";
import { parseVaultNote } from "../packages/vault-core/parse.js";

async function contents(root) {
  const files = new Map();
  for (const path of (await readdir(root, { recursive: true })).sort()) {
    const url = new URL(path, root);
    try {
      files.set(path, await readFile(url));
    } catch (error) {
      if (error.code !== "EISDIR") throw error;
      files.set(path, null);
    }
  }
  return files;
}

test("工作区扩展的 core 副本与共享模块逐字节一致", async () => {
  const expected = await contents(source);
  for (const target of await destinations()) {
    await assert.doesNotReject(async () => assert.deepEqual(await contents(target), expected), target.pathname);
  }
});

test("属性索引只保留属性、标签和诊断", () => {
  const note = parseVaultNote("示例.md", "---\nstatus: draft\n---\n# 标题\n- [ ] 事项\n[[链接]] #示例", ["properties"]);
  assert.deepEqual(note, {
    path: "示例.md", name: "示例", properties: { status: "draft" }, diagnostics: [], tags: ["示例"],
  });
});
