import assert from "node:assert/strict";
import { parseVaultNote } from "../packages/vault-core/parse.js";
import { excludedPath, relativePath } from "../packages/vault-core/scan.js";
import { parseQuery, runQuery } from "../advanced/ignorance.property-query/index/query.js";
import { parseTaskQuery, runTasks, weekTasks } from "../advanced/ignorance.task-rollup/index/tasks.js";
import { parseTrack, runTrack } from "../advanced/ignorance.value-track/index/track.js";
import { createSearchIndex, parseSearch, searchNotes } from "../advanced/ignorance.vault-search/index/search.js";
import { createRelations, noteRelations } from "../advanced/ignorance.backlinks/index/relations.js";
import { buildCards, noteCards, recordRating, reviewQueue, scheduleCard } from "../advanced/ignorance.flashcards/index/review.js";

const today = "2026-11-22";
const notes = [
  parseVaultNote("项目/甲.md", "---\nstatus: 进行中\ndue: 2026-11-24\nowner: [甲, 乙]\n睡眠: 7.5h\ntags: [重要]\n---\n# Notebook\n知识来自笔记。图谱表达关系。\n- [ ] 核对 📅 2026-11-24 #重要\n"),
  parseVaultNote("项目/乙.md", "---\nstatus: 已完成\ndue: 2026-11-20\ndate: 2026-11-21\n睡眠: 7\nparent: 甲\n---\n# 历史记录\n完整短语 [[甲]]\n- [ ] 补写 due:2026-11-20 ⏫\n"),
  parseVaultNote("工作/丙.md", "# 验收\n提及 Notebook 与甲。\n- [x] 已检查 ✅ 2026-11-22\n- [ ] 无日期\n"),
  parseVaultNote("日记/2026-11-22.md", "# 日记\n睡眠:: 8\n#重要\n"),
];
const [first, second, third, fourth] = notes;
const query = (source) => runQuery(parseQuery(source), notes, today);
const task = (source) => runTasks(parseTaskQuery(source), notes, today);
const track = (source, records = notes) => runTrack(parseTrack(source), records, today);
const index = createSearchIndex(notes);
const search = (source) => searchNotes(index, parseSearch(source)).map(({ name }) => name);
const graph = createRelations(notes);
const cardsSource = parseVaultNote("复习/甲.md", "问题 :: 答案\n\n为何\n?\n因为\n\n核对 ==挖空== #flashcard");
const cards = await buildCards([cardsSource]);
const firstScore = recordRating({}, cards[0].id, 0, 4, today);
function throws(fn, pattern) {
  try { fn(); return false; } catch (error) { return pattern.test(error.message); }
}
function audit(item, cases) {
  for (const [input, verify, expected] of cases) {
    const actual = verify();
    assert.deepEqual(actual, expected, `第 ${item} 项：${input}`);
    console.log(JSON.stringify({ item, input, actual, pass: true }));
  }
}
audit(5, [
  ["空笔记", () => parseVaultNote("空.md", "").body, ""],
  ["CRLF 标题", () => parseVaultNote("甲.md", "正文\r\n# 标题").headings[0].line, 2],
  ["Markdown 扩展名", () => parseVaultNote("甲.markdown", "").name, "甲"],
  ["围栏伪标签", () => parseVaultNote("甲.md", "```\n#忽略\n```").tags, []],
  ["数学内的 Wiki 文本", () => parseVaultNote("甲.md", "$$\n[[甲]]\n$$").links, []],
  ["行内代码引用", () => parseVaultNote("甲.md", "`[[甲]]`").links, []],
  ["坏 YAML", () => parseVaultNote("甲.md", "---\nx: [\n---").diagnostics.length, 1],
  ["排除目录嵌套", () => excludedPath("a/templates/甲.md", ["templates/"]), true],
  ["目录前缀", () => excludedPath("a/templates2/甲.md", ["templates/"]), false],
  ["父路径逃逸", () => relativePath("/vault", "/vault/../甲.md"), null],
]);
audit(6, [
  ["根目录", () => query("from: ./").count, 4],
  ["路径并集", () => query("from: 项目/ or 日记/").count, 3],
  ["交集与标签", () => query("from: 项目/ and #重要").count, 1],
  ["找不到目录", () => query("from: 缺失/").count, 0],
  ["数组 contains", () => query("where: owner contains 乙").count, 1],
  ["字段缺失", () => query("from: 工作/\nfields: owner").groups[0].rows[0].cells[0], ""],
  ["分组保留空值", () => query("group: status").groups.at(-1).label, "未分组"],
  ["日期边界", () => query("where: due < today").count, 1],
  ["计数限制", () => query("view: count\nlimit: 1").count, 1],
  ["未知关键字位置", () => throws(() => query("view: list\nabc: 1"), /第 2 行/), true],
]);
audit(7, [
  ["开放任务", () => task("status: open").count, 3],
  ["已完成", () => task("status: done").count, 1],
  ["逾期", () => task("due: overdue").count, 1],
  ["无截止", () => task("due: none").count, 2],
  ["0 天后", () => task("due: on today + 0d").count, 0],
  ["本周", () => weekTasks(notes, today).count, 1],
  ["任务标签", () => task("tag: #重要").count, 1],
  ["优先级分组", () => task("group: priority").groups[0].label, "高"],
  ["空任务行", () => parseVaultNote("任务.md", "- [ ]").tasks[0].text, ""],
  ["类型非法", () => throws(() => task("sort: level"), /第 1 行/), true],
]);
audit(8, [
  ["缺失字段", () => track("field: 缺失").points.length, 0],
  ["文件名日期", () => track("field: 睡眠", [fourth]).points[0].date, "2026-11-22"],
  ["属性日期", () => track("field: 睡眠", [second]).points[0].date, "2026-11-21"],
  ["单点折线", () => track("field: 睡眠", [second]).chart.match(/<circle\b/g).length, 1],
  ["目标线", () => track("field: 睡眠\ngoal: 7.5").chart.includes('data-goal="7.5"'), true],
  ["一周均值", () => track("field: 睡眠\nagg: avg\nby: week").points[0].value, 7.5],
  ["月点计数", () => track("field: 睡眠\nagg: count\nby: month").points[0].value, 2],
  ["热力空数据", () => track("field: 缺失\ntype: heatmap\nrange: last 3d").chart.match(/data-day=/g).length, 3],
  ["选择区间", () => track("field: 睡眠\nrange: last 1d").points[0].value, 8],
  ["错误图表类型", () => throws(() => track("field: 睡眠\ntype: pie"), /第 2 行/), true],
]);
audit(9, [
  ["标题权重", () => search("Notebook")[0], "甲"],
  ["英文错拼", () => search("notebokk")[0], "甲"],
  ["中文分开", () => search("知识图谱"), ["甲"]],
  ["完整短语", () => search('"完整短语"'), ["乙"]],
  ["全文排除", () => search("Notebook -验收"), ["甲"]],
  ["路径过滤", () => search("Notebook path:工作/"), ["丙"]],
  ["标签过滤", () => search("tag:#重要").length, 2],
  ["双重过滤拒绝", () => search("path:工作/ tag:#重要"), []],
  ["空索引", () => searchNotes(createSearchIndex([]), parseSearch("知识")).length, 0],
  ["未闭引号", () => throws(() => parseSearch('"未闭合'), /第 1 字符/), true],
]);
audit(10, [
  ["反链来源", () => noteRelations(graph, first.path).incoming[0].path, second.path],
  ["未链接提及", () => noteRelations(graph, first.path).mentions[0].path, third.path],
  ["上级文件", () => noteRelations(graph, second.path).parents[0].path, first.path],
  ["下级文件", () => noteRelations(graph, first.path).children[0].path, second.path],
  ["不存在的文件", () => noteRelations(graph, "不存在.md"), undefined],
  ["断链", () => noteRelations(createRelations([parseVaultNote("甲.md", "[[缺失]]")]), "甲.md").outgoing[0].broken, true],
  ["自身链接", () => noteRelations(createRelations([parseVaultNote("甲.md", "[[#节]]")]), "甲.md").incoming.length, 0],
  ["外链忽略", () => noteRelations(createRelations([parseVaultNote("甲.md", "[站点](https://example.com)")]), "甲.md").outgoing.length, 0],
  ["附件忽略", () => noteRelations(createRelations([parseVaultNote("甲.md", "[图片](./图.png)")]), "甲.md").outgoing.length, 0],
  ["绝对相对路径", () => noteRelations(createRelations([...notes, parseVaultNote("丁.md", "[查阅](/项目/甲.md)")]), "丁.md").outgoing[0].path, first.path],
]);
audit(11, [
  ["三种写法", () => cards.length, 3],
  ["未打标签不挖空", () => noteCards(parseVaultNote("高亮.md", "==内容==")).length, 0],
  ["代码不解析", () => noteCards(parseVaultNote("代码.md", "```\n问题 :: 无效\n```")).length, 0],
  ["初次评分间隔", () => scheduleCard(undefined, 4, today).interval, 1],
  ["错答归零", () => scheduleCard(undefined, 0, today).repetitions, 0],
  ["易度下限", () => scheduleCard({ ease: 1.31 }, 0, today).ease, 1.3],
  ["无效评分", () => throws(() => scheduleCard(undefined, 3, today), /评分/), true],
  ["重复评分", () => recordRating(firstScore.records, cards[0].id, 0, 4, today).updated, false],
  ["今日到期数量", () => reviewQueue(cards, firstScore.records, today).due, 2],
  ["明日复习分布", () => reviewQueue(cards, firstScore.records, today).upcoming[0].count, 1],
]);
