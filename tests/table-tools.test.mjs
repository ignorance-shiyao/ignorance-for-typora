import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTable, sortRows } from "../advanced/ignorance.advanced/format/table-tools.js";

// Numeric and ISO calendar date columns sort by value. Mixed columns sort as
// Chinese text. Empty cells sort last in both directions and ties stay stable.
test("sorts numbers in both directions with blanks last and stable ties", () => {
  const rows = [["10", "a"], ["2", "b"], ["", "c"], ["02", "d"]];
  assert.deepEqual(sortRows(rows, 0), [rows[1], rows[3], rows[0], rows[2]]);
  assert.deepEqual(sortRows(rows, 0, "desc"), [rows[0], rows[1], rows[3], rows[2]]);
});

test("sorts calendar dates and Chinese text", () => {
  assert.deepEqual(sortRows([["2026-12-01"], ["2026-02-28"]], 0), [["2026-02-28"], ["2026-12-01"]]);
  assert.deepEqual(sortRows([["张"], ["李"], ["陈"]], 0), [["陈"], ["李"], ["张"]]);
  assert.deepEqual(sortRows([], 0), []);
});

test("parses escaped pipes, code, CRLF and the original alignment row", () => {
  const align = "| :---: | ---: |";
  const input = ["| 名称 | 值 |", align, "| a\\|b | `x|y` |"].join("\r\n");
  const table = parseTable(input);
  assert.deepEqual(table.header, ["名称", "值"]);
  assert.deepEqual(table.rows, [["a\\|b", "`x|y`"]]);
  assert.equal(table.alignment, align);
  assert.equal(table.ending, "\r\n");
});

test("accepts header-only tables and rejects non-table blocks", () => {
  assert.deepEqual(parseTable("| 名称 | 值 |\n| --- | ---: |").rows, []);
  assert.equal(parseTable("```md\n| 名称 | 值 |\n| --- | ---: |\n```"), null);
});

test("preserves protected Markdown around the target table through a command", async () => {
  const { registerTableCommands } = await import("../advanced/ignorance.advanced/format/table-commands.js");
  const table = "| 名称 | 值 |\n| :--- | ---: |\n| A | 2 |\n| B | 10 |";
  const before = "---\ntitle: 示例\n---\n\n```md\n代码 | 内容\n```\n\n";
  const after = "\n\n<!-- tblfm: $2 = $1 -->\n";
  const original = before + table + after;
  let markdown = original;
  const commands = new Map();
  const api = {
    commands: { register: (id, command) => commands.set(id, command) },
    editor: {
      getSelection: () => ({ anchor: { blockId: "cell" } }),
      getMarkdown: () => markdown,
      replaceDocument: (next) => { markdown = next; },
    },
    document: { getBlocks: () => [
      { id: "table", type: "table", text: table },
      { id: "cell", type: "tableCell", parent: "table", attrs: { columnIndex: 1 } },
    ] },
  };
  registerTableCommands(api, []);
  await commands.get("table-sort-desc")();
  assert.equal(markdown, before + "| 名称 | 值 |\n| :--- | ---: |\n| B | 10 |\n| A | 2 |" + after);
});

test("appends totals and transposes while preserving the original table", async () => {
  const { appendTotal, transposeTable } = await import("../advanced/ignorance.advanced/format/table-tools.js");
  const input = "| 项目 | 金额 | 备注 |\n| :--- | ---: | --- |\n| 甲 | 2 | 预订 |\n| 乙 | 10 | |";
  const table = parseTable(input);
  assert.equal(appendTotal(table), input + "\n| 合计 | 12 |  |");
  assert.equal(transposeTable(table), "| 项目 | 甲 | 乙 |\n| --- | --- | --- |\n| 金额 | 2 | 10 |\n| 备注 | 预订 |  |");
  assert.deepEqual(table.rows, [["甲", "2", "预订"], ["乙", "10", ""]]);
});

test("converts quoted CSV and reports malformed input", async () => {
  const { csvToTable } = await import("../advanced/ignorance.advanced/format/table-tools.js");
  assert.equal(csvToTable('名称,备注\r\n甲,"蓝,大"\r\n乙,"甲|乙\n丙"'), "| 名称 | 备注 |\n| --- | --- |\n| 甲 | 蓝,大 |\n| 乙 | 甲\\|乙<br>丙 |");
  assert.throws(() => csvToTable('名称,备注\r\n甲,"蓝'), /引号未闭合/);
});

test("locates a table without block text and uses the selected cell's sibling index", async () => {
  const { registerTableCommands } = await import("../advanced/ignorance.advanced/format/table-commands.js");
  const table = "| 名称 | 数量 |\n| --- | ---: |\n| 甲 | 10 |\n| 乙 | 2 |";
  const code = "```md\n" + table + "\n```\n\n";
  let markdown = code + table;
  const commands = new Map();
  const blocks = [
    { id: "table", type: "table" },
    ...[["名称", "数量"], ["甲", "10"], ["乙", "2"]].flatMap((cells, row) => [
      { id: `row${row}`, type: "table_row", parent: "table" },
      ...cells.map((text, column) => ({ id: `cell${row}-${column}`, type: "table_cell", parent: `row${row}`, text })),
    ]),
  ];
  const api = {
    commands: { register: (id, command) => commands.set(id, command) },
    editor: {
      getSelection: () => ({ anchor: { blockId: "cell1-1" } }),
      getMarkdown: () => markdown,
      replaceDocument: (next) => { markdown = next; },
    },
    document: { getBlocks: () => blocks },
    ui: { input: () => assert.fail("column is known from the cell") },
  };
  registerTableCommands(api, []);
  await commands.get("table-sort-asc")();
  assert.equal(markdown, code + "| 名称 | 数量 |\n| --- | ---: |\n| 乙 | 2 |\n| 甲 | 10 |");
});

test("table commands leave the document untouched when the caret is outside a table", async () => {
  const { registerTableCommands } = await import("../advanced/ignorance.advanced/format/table-commands.js");
  const commands = new Map();
  const messages = [];
  const original = "说明\n\n| 名称 | 值 |\n| --- | --- |\n| 甲 | 2 |";
  let markdown = original;
  registerTableCommands({
    commands: { register: (id, command) => commands.set(id, command) },
    document: { getBlocks: () => [
      { id: "paragraph", type: "paragraph", text: "说明" },
      { id: "table", type: "table" },
    ] },
    editor: {
      getSelection: () => ({ anchor: { blockId: "paragraph" } }),
      getMarkdown: () => markdown,
      replaceDocument: (next) => { markdown = next; },
    },
    ui: { toast: (message) => messages.push(message) },
  }, []);
  for (const id of ["table-sort-asc", "table-sort-desc", "table-recalculate", "table-total", "table-transpose"]) {
    await commands.get(id)();
    assert.equal(markdown, original);
    assert.equal(messages.at(-1), "请将光标放在表格内");
  }
});
