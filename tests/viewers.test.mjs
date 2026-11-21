import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../advanced/ignorance.advanced/", import.meta.url).pathname;
const manifest = JSON.parse(readFileSync(join(root, "typora-extension.json"), "utf8"));
const viewers = manifest.contributes.fileViewers ?? [];

test("每个文件查看器的入口页都存在", () => {
  for (const v of viewers) assert.ok(existsSync(join(root, v.entry)), `${v.id}: ${v.entry}`);
});

test("同一扩展名只由一个查看器接管", () => {
  const seen = new Map();
  for (const v of viewers) {
    assert.ok(v.extensions.length > 0, `${v.id} 没有扩展名`);
    for (const ext of v.extensions) {
      assert.ok(!seen.has(ext), `${ext} 同时属于 ${seen.get(ext)} 和 ${v.id}`);
      seen.set(ext, v.id);
    }
  }
});
