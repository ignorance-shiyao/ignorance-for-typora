import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVaultNote } from "../advanced/ignorance.vault/index/parse.js";
import { parseTaskQuery, runTasks, weekTasks } from "../advanced/ignorance.vault/index/tasks.js";

const notes = [
  parseVaultNote("工作/甲.md", "# 交付\n- [ ] 明天 📅 2026-11-23 #重要\n- [ ] 逾期 due:2026-11-20 #重要\n- [x] 已完成 due:2026-11-23 #重要\n```\n- [ ] 忽略 due:2026-11-23\n```"),
  parseVaultNote("其他/乙.md", "- [ ] 本周 📅 2026-11-27\n- [ ] 远期 due:2026-12-02\n- [ ] 无日期"),
];
const today = "2026-11-22";

test("filters open tagged tasks and places overdue deadlines first", () => {
  const result = runTasks(parseTaskQuery("from: 工作/\nstatus: open\ndue: before today + 7d\ntag: #重要\ngroup: file\nsort: due"), notes, today);
  assert.deepEqual(result.groups[0].rows.map(({ cells }) => cells[2]), ["2026-11-20", "2026-11-23"]);
  assert.equal(result.count, 2);
});

test("the weekly side panel shows seven calendar days of open tasks", () => {
  const result = weekTasks(notes, today);
  assert.deepEqual(result.groups.flatMap(({ rows }) => rows.map(({ cells }) => cells[2])), ["2026-11-23", "2026-11-27"]);
});

test("handles missing dates with a distinct filter and reports invalid syntax", () => {
  assert.equal(runTasks(parseTaskQuery("due: none"), notes, today).count, 1);
  assert.throws(() => parseTaskQuery("status: maybe"), /第 1 行.*status/);
  assert.throws(() => parseTaskQuery("due: before now"), /第 1 行.*due/);
});
