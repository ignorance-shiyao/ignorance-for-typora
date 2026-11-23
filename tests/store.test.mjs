// Hard limits from typora/typora-extensions (scripts/lib.mjs, scripts/validate.mjs): what makes
// `npm run validate` fail. Warnings (eval in vendored libs, long minified lines) are not checked.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, lstatSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../advanced/", import.meta.url));
const MAX_FILE = 1024 * 1024;
const MAX_PACKAGE = 5 * 1024 * 1024;
const ID = /^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+$/;
const SEMVER = /^\d+\.\d+\.\d+([-+].*)?$/;
const TAGS = ["Language Pack", "Markdown Extension", "Diagram", "Math", "Theme", "Writing", "Template", "AI", "Media", "Image Uploader", "Export", "Publish", "Data Sync", "Productivity", "File Viewer", "Detail View", "Developer"];

// Extensions assembled by the store build.
const STORE_READY = ["ignorance.file-viewers", "ignorance.advanced", "ignorance.vault", "ignorance.property-query"];
const all = readdirSync(ROOT, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
const manifestOf = (id) => JSON.parse(readFileSync(join(ROOT, id, "typora-extension.json"), "utf8"));

function files(dir, rel = "", out = []) {
  for (const entry of readdirSync(join(dir, rel), { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const path = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files(dir, path, out);
    else out.push(path);
  }
  return out;
}

test("每个文件查看器的入口页都存在，且扩展名不重复", () => {
  const seen = new Map();
  for (const id of all) {
    for (const v of manifestOf(id).contributes?.fileViewers ?? []) {
      assert.ok(existsSync(join(ROOT, id, v.entry)), `${id}/${v.entry}`);
      assert.ok(v.extensions.length > 0, `${id}:${v.id} 没有扩展名`);
      for (const ext of v.extensions) {
        assert.ok(!seen.has(ext), `${ext} 同时属于 ${seen.get(ext)} 和 ${id}`);
        seen.set(ext, id);
      }
    }
  }
});

for (const id of STORE_READY) {
  test(`${id} 满足商店硬性限制`, () => {
    const dir = join(ROOT, id);
    const m = manifestOf(id);
    assert.equal(m.id, id, "清单 id 必须等于文件夹名");
    assert.match(m.id, ID);
    assert.match(m.version, SEMVER);
    assert.ok(m.name && m.description && m.author);
    assert.ok(Array.isArray(m.tags) && m.tags.length && m.tags.every((t) => TAGS.includes(t)), `标签必须来自 ${TAGS.join("、")}`);
    let total = 0;
    for (const path of files(dir)) {
      const stat = lstatSync(join(dir, path));
      assert.ok(!stat.isSymbolicLink(), `${path} 是符号链接`);
      assert.ok(stat.size <= MAX_FILE, `${path} 超过 1 MB`);
      if (!/^(cover|screenshot)\.(png|jpe?g|webp)$/i.test(path)) total += stat.size;
    }
    assert.ok(total <= MAX_PACKAGE, `包体积 ${(total / 1024 / 1024).toFixed(2)} MB 超过 5 MB`);
    assert.ok(existsSync(join(dir, "README.md")), "缺少 README.md");
    assert.ok(!existsSync(join(dir, "node_modules")), "不应包含 node_modules");
    for (const key of ["main", "background"]) if (m[key]) assert.ok(existsSync(join(dir, m[key])), key);
  });
}

test("文件查看器扩展不申请任何权限", () => {
  assert.equal(manifestOf("ignorance.file-viewers").permissions, undefined);
});

test("主题商店包：只含主题，清单与 theme.toml 满足规则", () => {
  const dir = fileURLToPath(new URL("../theme/store/", import.meta.url));
  const m = JSON.parse(readFileSync(join(dir, "typora-extension.json"), "utf8"));
  assert.match(m.id, ID);
  assert.match(m.version, SEMVER);
  assert.deepEqual(m.tags, ["Theme"]);
  assert.deepEqual(Object.keys(m.contributes), ["themes"], "主题包只能贡献 themes");
  for (const key of ["main", "background", "binaries", "activationEvents", "permissions"]) assert.equal(m[key], undefined, key);
  const toml = readFileSync(fileURLToPath(new URL("../theme/src/base.toml", import.meta.url)), "utf8");
  const head = toml.split(/^\s*\[/m)[0];
  assert.match(head, /^name\s*=\s*"Ignorance"/m);
  assert.match(head, /^color-scheme\s*=\s*"auto"/m);
  assert.match(m.contributes.themes[0], /^themes\/[a-z0-9-]+$/, "主题文件夹名只能用 a-z、0-9、-");
});

test("ignorance.advanced 不打包 ECharts 与 Mermaid，演示用内置渲染器", () => {
  const dir = join(ROOT, "ignorance.advanced");
  assert.equal(manifestOf("ignorance.advanced").contributes.fenceRenderers, undefined);
  for (const path of files(dir)) assert.ok(!/^vendor\/.*(echarts|mermaid)/i.test(path) && !/^(echarts|mermaid)\//i.test(path), `${path} 不应出现`);
  const html = readFileSync(join(dir, "slides/index.html"), "utf8");
  assert.ok(!/echarts|mermaid/i.test(html));
});
