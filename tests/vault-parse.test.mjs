import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVaultNote } from "../packages/vault-core/parse.js";

test("indexes properties, nested tasks, heading, links and tags without code", () => {
  const source = [
    "---", "owner: 甲", "tags: [工作, 项目]", "date: 2026-11-22", "---",
    "# 进展", "睡眠:: 7.5", "正文 #重要 [[周报#计划|计划]] [目录](./目录.md)",
    "- [ ] 测试 📅 2026-11-30 ⏳ 2026-11-25 🛫 2026-11-22 🔼 #重要",
    "  - [x] 已做 ✅ 2026-11-21", "- [ ]",
    "```", "- [ ] 伪任务 #忽略", "[[忽略]]", "```", "代码 `[[不索引]]`",
  ].join("\n");
  const result = parseVaultNote("工作/记录.md", source);
  assert.equal(result.name, "记录");
  assert.equal(result.properties.date, "2026-11-22");
  assert.equal(result.properties.睡眠, 7.5);
  assert.deepEqual(result.tags, ["工作", "项目", "重要"]);
  assert.deepEqual(result.headings, [{ level: 1, text: "进展", line: 6 }]);
  assert.deepEqual(result.links.map(({ target, heading }) => [target, heading]), [["周报", "计划"], ["./目录.md", ""]]);
  assert.equal(result.tasks.length, 3);
  assert.equal(result.tasks[0].due, "2026-11-30");
  assert.equal(result.tasks[0].scheduled, "2026-11-25");
  assert.equal(result.tasks[0].start, "2026-11-22");
  assert.equal(result.tasks[0].priority, "medium");
  assert.equal(result.tasks[0].heading, "进展");
  assert.equal(result.tasks[1].completed, true);
  assert.equal(result.tasks[2].text, "");
  assert.ok(!result.body.includes("伪任务"));
  assert.ok(result.terms.includes("正文"));
});

test("keeps malformed YAML as an indexed note with a diagnostic", () => {
  const record = parseVaultNote("x.markdown", "---\nowner: [\n---\n# 正文");
  assert.match(record.diagnostics[0], /Front Matter/);
  assert.equal(record.headings[0].text, "正文");
});
