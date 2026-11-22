import { test } from "node:test";
import assert from "node:assert/strict";
import { changeListItem, listToHeadings, textToList } from "../advanced/ignorance.advanced/format/outliner.js";

test("swaps a complete task branch with its next sibling", () => {
  const input = "- [x] 已完成\n  - 子项\n    - 孙项\n- 下一项\n";
  assert.equal(changeListItem(input, 0, "down"), "- 下一项\n- [x] 已完成\n  - 子项\n    - 孙项\n");
});

test("upper and lower boundaries are no-ops", () => {
  const input = "- 一\n- 二";
  assert.equal(changeListItem(input, 0, "up"), input);
  assert.equal(changeListItem(input, 1, "down"), input);
  assert.equal(changeListItem(input, 0, "promote"), input);
  assert.equal(changeListItem(input, 0, "demote"), input);
});

test("promotes and demotes a subtree while preserving relative indent", () => {
  const input = "- 甲\n- 乙\n  - 子项\n- 丙";
  const nested = "- 甲\n  - 乙\n    - 子项\n- 丙";
  assert.equal(changeListItem(input, 1, "demote"), nested);
  assert.equal(changeListItem(nested, 1, "promote"), input);
});

test("renumbers ordered siblings and protects code and document boundaries", () => {
  const prefix = "---\r\ntitle: 示例\r\n---\r\n\r\n```\r\n9. 代码\r\n```\r\n\r\n";
  const input = prefix + "8. 甲\r\n4. 乙\r\n";
  assert.equal(changeListItem(input, 1, "up"), prefix + "1. 乙\r\n2. 甲\r\n");
});

test("converts indentation to list levels and list levels to headings", () => {
  assert.equal(textToList("甲\n    乙\n        丙"), "- 甲\n  - 乙\n    - 丙");
  assert.equal(listToHeadings("- 甲\n  - [x] 乙\n    - 丙"), "## 甲\n### [x] 乙\n#### 丙");
});

test("list probes cover protected content, boundaries, and deep branches", async () => {
  const { listBranch, listOutline } = await import("../advanced/ignorance.advanced/format/outliner.js");
  const probes = [
    ["empty", changeListItem("", 0, "down"), ""],
    ["whitespace", changeListItem("   \n", 0, "up"), "   \n"],
    ["separate lists", changeListItem("- a\n\n正文\n\n- b", 0, "down"), "- a\n\n正文\n\n- b"],
    ["continuation", changeListItem("- a\n  续行\n- b", 0, "down"), "- b\n- a\n  续行"],
    ["blank separator", changeListItem("- a\n\n- b", 0, "down"), "- b\n\n- a"],
    ["preserve checked state", changeListItem("- [x] a\n- [ ] b", 1, "up"), "- [ ] b\n- [x] a"],
    ["nested branch", listBranch("- a\n  - b\n    - c", 1), "- b\n  - c"],
    ["depth limit", listOutline("- a\n  - b\n    - c\n- d", 1, 2), "- a\n  - b\n- d"],
    ["depth limit 1", listOutline("- a\n  - b", 0, 1), "- a"],
    ["tab indentation", textToList("甲\n\t乙"), "- 甲\n  - 乙"],
    ["unknown action", changeListItem("- a\r\n- b", 0, "unknown"), "- a\r\n- b"],
  ];
  for (const [name, actual, expected] of probes) assert.equal(actual, expected, name);
});
