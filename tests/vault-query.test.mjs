import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuery, runQuery } from "../advanced/ignorance.vault/index/query.js";

const rows = [
  { path: "项目/星河.md", name: "星河", tags: ["重要"], properties: { status: "进行中", due: "2026-11-26", owner: "甲", categories: ["文档", "测试"] } },
  { path: "项目/云岭.md", name: "云岭", tags: [], properties: { status: "已完成", due: "2026-11-23", categories: ["测试"] } },
  { path: "工作/验收.md", name: "验收", tags: ["重要"], properties: { status: "进行中", due: "未知" } },
];

test("runs the documented path, date, property, field and sort query", () => {
  const source = 'from: 项目/\nwhere: status = "进行中" and due < today + 7d\nfields: 文件, owner, due, status\nsort: due asc\nlimit: 20\nview: table';
  const result = runQuery(parseQuery(source), rows, "2026-11-22");
  assert.equal(result.view, "table");
  assert.deepEqual(result.columns, ["文件", "owner", "due", "status"]);
  assert.deepEqual(result.groups[0].rows.map(({ cells }) => cells), [["星河", "甲", "2026-11-26", "进行中"]]);
});

test("handles grouping, arrays, missing fields and source logic", () => {
  const query = parseQuery('from: 项目/ or #重要\nwhere: categories contains "测试"\nfields: 文件, owner, categories\ngroup: status\nview: list');
  const result = runQuery(query, rows, "2026-11-22");
  assert.equal(result.view, "list");
  assert.deepEqual(result.groups.map(({ label }) => label), ["进行中", "已完成"]);
  assert.deepEqual(result.groups[1].rows[0].cells, ["云岭", "", "测试"]);
  assert.equal(runQuery(parseQuery("from: 无目录/\nview: count"), rows).count, 0);
});

test("reports invalid keywords and conditions with source locations", () => {
  assert.throws(() => parseQuery("view: table\nfilter: a"), /第 2 行.*filter/);
  assert.throws(() => parseQuery("from: 项目/\nwhere: due <"), /第 2 行.*需要/);
  assert.throws(() => parseQuery("view: chart"), /第 1 行/);
});

test("does not compare invalid date strings as dates and supports the root source", () => {
  const query = parseQuery("from: ./\nwhere: due > 2026-11-22");
  assert.equal(runQuery(query, rows, "2026-11-22").count, 2);
});
