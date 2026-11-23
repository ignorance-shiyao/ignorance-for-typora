import { isDeepStrictEqual } from "node:util";
import { lintMarkdown } from "../advanced/ignorance.advanced/format/lint.js";
import { appendTotal, csvToTable, findTables, parseTable, sortRows, transposeTable } from "../advanced/ignorance.advanced/format/table-tools.js";
import { calculateTable } from "../advanced/ignorance.advanced/format/table-formula.js";
import { changeListItem, listToHeadings, listOutline, textToList } from "../advanced/ignorance.advanced/format/outliner.js";
import { parseNaturalDate } from "../advanced/ignorance.advanced/format/natural-date.js";

let passed = 0;
let failed = 0;
function probe(item, name, input, run, expected) {
  let actual;
  try {
    actual = run(input);
  } catch (error) {
    actual = { error: error.message };
  }
  const pass = expected instanceof RegExp
    ? typeof actual?.error === "string" && expected.test(actual.error)
    : isDeepStrictEqual(actual, expected);
  if (pass) passed++;
  else failed++;
  process.stdout.write(JSON.stringify({
    item, name, input, actual, expected: expected instanceof RegExp ? { error: expected.source } : expected, pass,
  }) + "\n");
}

const lintCases = [
  ["混排", "He said: hello, world. 这是中文。", "He said: hello, world. 这是中文。\n"],
  ["嵌套链接括号", "[计划](./版本(初稿(2)).md) 中文ABC", "[计划](./版本(初稿(2)).md) 中文 ABC\n"],
  ["脚注", "文[^a]\n\n[^a]: 脚注,test\n", "文[^a]\n\n[^a]: 脚注,test\n"],
  ["CRLF", "中文ABC\r\n\r\n中文2", "中文 ABC\r\n\r\n中文 2\r\n"],
  ["空文档", "", ""],
  ["空白文档", " \t\n\n", ""],
  ["围栏", "~~~md\n#标题ABC\n~~~\n\n中文ABC\n", "~~~md\n#标题ABC\n~~~\n\n中文 ABC\n"],
  ["数字分隔", "共3,000元,确认!", "共 3,000 元，确认！\n"],
  ["前置属性", "---\ntitle: 中文ABC\n---\n\n#标题", "---\ntitle: 中文ABC\n---\n\n# 标题\n"],
  ["硬换行", "中文ABC  \n下一行", "中文 ABC  \n下一行\n"],
];
for (const [name, input, expected] of lintCases) {
  probe(1, name, input, lintMarkdown, expected);
}

const header = "| 名称 | 值 |\n| --- | --- |";
const table = header + "\n| 甲 | 2 |\n| 乙 | 10 |";
probe(2, "转义竖线", header + "\n| a\\|b | 2 |", (input) => parseTable(input).rows, [["a\\|b", "2"]]);
probe(2, "只有表头", header, (input) => parseTable(input).rows, []);
probe(2, "循环引用", { rows: [["", ""]], formula: "$1 = $2; $2 = $1" },
  ({ rows, formula }) => calculateTable(rows, formula).rows, [["#ERR", "#ERR"]]);
probe(2, "围栏内的表", "~~~md\n" + table + "\n~~~", (input) => findTables(input).length, 0);
probe(2, "降序空格末尾", [["2"], [""], ["10"]], (rows) => sortRows(rows, 0, "desc"), [["10"], ["2"], [""]]);
probe(2, "同值稳定", [["02", "甲"], ["2", "乙"], ["1", "丙"]], (rows) => sortRows(rows, 0), [["1", "丙"], ["02", "甲"], ["2", "乙"]]);
probe(2, "缺失公式列", { rows: [["2", ""]], formula: "$2 = $9" },
  ({ rows, formula }) => calculateTable(rows, formula).rows, [["2", "#ERR"]]);
probe(2, "合计保留空栏", table, (input) => appendTotal(parseTable(input)), table + "\n| 合计 | 12 |");
probe(2, "表头转置", table, (input) => transposeTable(parseTable(input)), "| 名称 | 甲 | 乙 |\n| --- | --- | --- |\n| 值 | 2 | 10 |");
probe(2, "未闭合 CSV 引号", '名称,值\n甲,"2', csvToTable, /引号未闭合/);

const listCases = [
  ["第一项上移", "- 甲\n- 乙", 0, "up", "- 甲\n- 乙"],
  ["末项下移", "- 甲\n- 乙", 1, "down", "- 甲\n- 乙"],
  ["混合有序和无序子树", "8. 甲\n   - 子项\n4. 乙", 0, "down", "1. 乙\n2. 甲\n   - 子项"],
  ["任务状态", "- [x] 已完\n- [ ] 待办", 1, "up", "- [ ] 待办\n- [x] 已完"],
  ["续行随所属项移动", "- 甲\n  续行\n- 乙", 1, "up", "- 乙\n- 甲\n  续行"],
  ["不跨正文移动", "- 甲\n\n正文\n\n- 乙", 0, "down", "- 甲\n\n正文\n\n- 乙"],
  ["空文档", "", 0, "down", ""],
  ["无上级可提升", "- 甲\n- 乙", 1, "promote", "- 甲\n- 乙"],
];
for (const [name, markdown, index, action, expected] of listCases) {
  probe(3, name, { markdown, index, action },
    (input) => changeListItem(input.markdown, input.index, input.action), expected);
}
probe(3, "Tab 缩进转列表", "甲\n\t乙", textToList, "- 甲\n  - 乙");
probe(3, "有限深度大纲", "- 甲\n  - 乙\n    - 丙", (input) => listOutline(input, 0, 2), "- 甲\n  - 乙");
probe(3, "保留任务标记的标题", "- [x] 甲\n  - 乙", listToHeadings, "## [x] 甲\n### 乙");

const dateCases = [
  ["周日的下周一", "下周一", "2026-11-22", "2026-11-23"],
  ["周日的周末", "周末", "2026-11-22", "2026-11-21"],
  ["跨年", "三天后", "2026-12-31", "2027-01-03"],
  ["闰年月末", "一个月后", "2024-01-31", "2024-02-29"],
  ["非闰年月底", "下个月 31 号", "2027-01-31", "2027-02-28"],
  ["空输入", "", "2026-11-22", /第 1 字符/],
  ["无效日期", "2 月 30 日", "2026-11-22", /日期超出/],
  ["未识别日期", "月底有空", "2026-11-22", /无法识别/],
  ["英文跨年", "tomorrow", "2026-12-31", "2027-01-01"],
  ["两周跨月", "两周后", "2026-11-22", "2026-12-06"],
  ["周日为周首", "本周五", "2026-11-22", "2026-11-27", 0],
];
for (const [name, value, baseline, expected, weekStart = 1] of dateCases) {
  probe(4, name, { value, baseline, weekStart },
    (input) => parseNaturalDate(input.value, input.baseline, { weekStart: input.weekStart }), expected);
}

process.stdout.write(JSON.stringify({ passed, failed }) + "\n");
if (failed) process.exitCode = 1;
