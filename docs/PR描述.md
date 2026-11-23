# Typora 2.0 十项插件验收交付

## 改了什么

| 项 | 功能及对应验收行 |
|---|---|
| 1 Markdown 规则整理 | 1–6 行。格式整理、保护块、幂等、撤销和独立设置。R6 另修复两层以上括号的链接和图片目标被改写。 |
| 2 表格公式与排序 | 1–7 行。表格命令、数据排序、公式、错误提示、撤销和导出。第 1 行的两种菜单条件仍待完整对照。 |
| 3 大纲列表命令 | 1–6 行。移动、提升、降低、序号、任务状态和快捷键。 |
| 4 中文自然语言日期 | 1–5 行。三种格式、错误提示、输入预览及确认插入。 |
| 5 工作区索引 | 1–6 行。索引、增量更新、排除目录、重建、缓存及文件数上限。 |
| 6 属性查询 | 1–6 行。表格、列表、分组、计数、错误定位、导出和相对路径。 |
| 7 跨文件任务汇总 | 1–4 行。截止时间、跨文件汇总、跳过围栏内容和本周任务详情。 |
| 8 跨文件数值图表 | 1–5 行。折线、目标线、热力图、聚合、缺失值、主题和导出。 |
| 9 相关性全文搜索 | 1–6 行。中文、短语、排除、路径、标签、错拼、高亮和空搜索。 |
| 10 反向链接 | 1–6 行。按来源合并反链、未链接提及、层级、断链和切换刷新。 |
| 11 间隔复习 | 1–6 行。卡片识别、评分、SM-2、文档只读、修改后重新排期和并发防重。 |

## 有意没做的

R1 的第二种条件尚未加载。本次按用户要求先交付 R6，R2–R5 的 Typora 专项仍需执行。V1 文件定位和 V2 导出采用验收报告已记录的退路。

## 自行决定和待确认

- 大纲快捷键采用 `⌘⇧F7` 至 `⌘⇧F10`。原组合在 macOS 触发文本选择或无响应，新组合已在实机触发对应命令。
- 日期插入采用「输入 → 预览 → 确认」。宿主输入框缺少实时输入回调，因此在写入前通过第二步呈现解析结果。
- 本周任务取从今天起 7 个日历日。「周末」取配置的一周内的周六，默认周一起算时周日执行返回前一日。
- Typora 2.0.0-beta1 的右键菜单未出现表格命令。现用 `table_cell` 条件下，`/` 在表内和表外均写入字面斜杠。`table` 条件待实测，命令面板已实测可用，入口判定由验收方给出。
- `6ea4f59` 在 `tests/store.test.mjs` 的 `STORE_READY` 加入 `ignorance.vault`，并将关于 Advanced 仅限本地及旧 ECharts 体积的注释替换为商店构建说明。
- 第 1 项的三处断言在 `501236b` 临时把「正文 Typora，版本 2！」改为「正文 Typora, 版本 2!」、把「中文（版本 2.5），继续」改为「中文（版本 2.5)，继续」、把「中文 abc，继续」改为「中文 abc, 继续」。`59036fc` 按确认的句内标点规则恢复三处预期。本次只新增嵌套括号断言。
- R6 用配对扫描保护链接和图片的目标，允许多层括号并跳过反斜杠转义字符。原方式只能匹配一层括号。

## 不在本次验收范围

知识图谱扩展、文件预览的代码着色和商店图另案维护。

## 验证记录

各验收行的操作、证据和状态见 [Typora 实测记录](实测记录.md)。V1–V4 的方法、输出和限制见 [验证报告](验证报告_V1-V4.md)。

| 要求 | 方法 | 证据 | 结果 |
|---|---|---|---|
| R1 第 2 项第 1 行 | Typora 合成表格副本 | 无障碍树、撤销后的 `cmp` | 右键和现用 `/` 条件失败，第二种条件未验证 |
| R2 第 5 项第 1 行 | 正式包冷启动 | 现有结果来自带合成工作区检查的验收包 | 未验证 |
| R3 第 5 项第 2 行 | Typora 改属性后计时 | 已观察到更新，尚缺三次宿主计时 | 未验证 |
| R4 第 5 项第 5 行、第 11 项第 6 行 | Typora 两窗在 1 秒内执行 | 单窗写入后的跨窗传播已有宿主证据，并发仅有 Node 回归证据 | 未验证 |
| R5 第 9 项第 6 行 | 5,000 篇样例，面板输入至渲染 | 已有无障碍树观察上界，尚缺面板内部 20 次计时 | 未验证 |
| R6 第 1–4 项边界 | `node scripts/probe-format.mjs` | 42 通过、0 失败，详见下方输出 | 通过 |
| R6 第 1 项嵌套链接 | 定向测试和全量回归 | 修改前定向测试 1 失败，修改后 `npm test` 228 通过 | 自动化通过，Typora 未验证 |
| R6 商店副本一致性 | 在临时检出运行 `scripts/build-store.sh`、`diff -qr` | Advanced 与 Vault 对比无输出，Vault 排除构建时有意省略的 `experiments/` | 通过 |

## 实测记录

[docs/实测记录.md](实测记录.md) 保存了 Typora 2.0.0-beta1 的无障碍树证据。R1–R5 的缺项见上表。没有提交截图，也没有执行本轮用户的独立抽查。

## 探测输入

<details>
<summary>42 组探测的逐组输出</summary>

```jsonl
{"item":1,"name":"混排","input":"He said: hello, world. 这是中文。","actual":"He said: hello, world. 这是中文。\n","expected":"He said: hello, world. 这是中文。\n","pass":true}
{"item":1,"name":"嵌套链接括号","input":"[计划](./版本(初稿(2)).md) 中文ABC","actual":"[计划](./版本(初稿(2)).md) 中文 ABC\n","expected":"[计划](./版本(初稿(2)).md) 中文 ABC\n","pass":true}
{"item":1,"name":"脚注","input":"文[^a]\n\n[^a]: 脚注,test\n","actual":"文[^a]\n\n[^a]: 脚注,test\n","expected":"文[^a]\n\n[^a]: 脚注,test\n","pass":true}
{"item":1,"name":"CRLF","input":"中文ABC\r\n\r\n中文2","actual":"中文 ABC\r\n\r\n中文 2\r\n","expected":"中文 ABC\r\n\r\n中文 2\r\n","pass":true}
{"item":1,"name":"空文档","input":"","actual":"","expected":"","pass":true}
{"item":1,"name":"空白文档","input":" \t\n\n","actual":"","expected":"","pass":true}
{"item":1,"name":"围栏","input":"~~~md\n#标题ABC\n~~~\n\n中文ABC\n","actual":"~~~md\n#标题ABC\n~~~\n\n中文 ABC\n","expected":"~~~md\n#标题ABC\n~~~\n\n中文 ABC\n","pass":true}
{"item":1,"name":"数字分隔","input":"共3,000元,确认!","actual":"共 3,000 元，确认！\n","expected":"共 3,000 元，确认！\n","pass":true}
{"item":1,"name":"前置属性","input":"---\ntitle: 中文ABC\n---\n\n#标题","actual":"---\ntitle: 中文ABC\n---\n\n# 标题\n","expected":"---\ntitle: 中文ABC\n---\n\n# 标题\n","pass":true}
{"item":1,"name":"硬换行","input":"中文ABC  \n下一行","actual":"中文 ABC  \n下一行\n","expected":"中文 ABC  \n下一行\n","pass":true}
{"item":2,"name":"转义竖线","input":"| 名称 | 值 |\n| --- | --- |\n| a\\|b | 2 |","actual":[["a\\|b","2"]],"expected":[["a\\|b","2"]],"pass":true}
{"item":2,"name":"只有表头","input":"| 名称 | 值 |\n| --- | --- |","actual":[],"expected":[],"pass":true}
{"item":2,"name":"循环引用","input":{"rows":[["",""]],"formula":"$1 = $2; $2 = $1"},"actual":[["#ERR","#ERR"]],"expected":[["#ERR","#ERR"]],"pass":true}
{"item":2,"name":"围栏内的表","input":"~~~md\n| 名称 | 值 |\n| --- | --- |\n| 甲 | 2 |\n| 乙 | 10 |\n~~~","actual":0,"expected":0,"pass":true}
{"item":2,"name":"降序空格末尾","input":[["2"],[""],["10"]],"actual":[["10"],["2"],[""]],"expected":[["10"],["2"],[""]],"pass":true}
{"item":2,"name":"同值稳定","input":[["02","甲"],["2","乙"],["1","丙"]],"actual":[["1","丙"],["02","甲"],["2","乙"]],"expected":[["1","丙"],["02","甲"],["2","乙"]],"pass":true}
{"item":2,"name":"缺失公式列","input":{"rows":[["2",""]],"formula":"$2 = $9"},"actual":[["2","#ERR"]],"expected":[["2","#ERR"]],"pass":true}
{"item":2,"name":"合计保留空栏","input":"| 名称 | 值 |\n| --- | --- |\n| 甲 | 2 |\n| 乙 | 10 |","actual":"| 名称 | 值 |\n| --- | --- |\n| 甲 | 2 |\n| 乙 | 10 |\n| 合计 | 12 |","expected":"| 名称 | 值 |\n| --- | --- |\n| 甲 | 2 |\n| 乙 | 10 |\n| 合计 | 12 |","pass":true}
{"item":2,"name":"表头转置","input":"| 名称 | 值 |\n| --- | --- |\n| 甲 | 2 |\n| 乙 | 10 |","actual":"| 名称 | 甲 | 乙 |\n| --- | --- | --- |\n| 值 | 2 | 10 |","expected":"| 名称 | 甲 | 乙 |\n| --- | --- | --- |\n| 值 | 2 | 10 |","pass":true}
{"item":2,"name":"未闭合 CSV 引号","input":"名称,值\n甲,\"2","actual":{"error":"CSV 第 10 字符：引号未闭合"},"expected":{"error":"引号未闭合"},"pass":true}
{"item":3,"name":"第一项上移","input":{"markdown":"- 甲\n- 乙","index":0,"action":"up"},"actual":"- 甲\n- 乙","expected":"- 甲\n- 乙","pass":true}
{"item":3,"name":"末项下移","input":{"markdown":"- 甲\n- 乙","index":1,"action":"down"},"actual":"- 甲\n- 乙","expected":"- 甲\n- 乙","pass":true}
{"item":3,"name":"混合有序和无序子树","input":{"markdown":"8. 甲\n   - 子项\n4. 乙","index":0,"action":"down"},"actual":"1. 乙\n2. 甲\n   - 子项","expected":"1. 乙\n2. 甲\n   - 子项","pass":true}
{"item":3,"name":"任务状态","input":{"markdown":"- [x] 已完\n- [ ] 待办","index":1,"action":"up"},"actual":"- [ ] 待办\n- [x] 已完","expected":"- [ ] 待办\n- [x] 已完","pass":true}
{"item":3,"name":"续行随所属项移动","input":{"markdown":"- 甲\n  续行\n- 乙","index":1,"action":"up"},"actual":"- 乙\n- 甲\n  续行","expected":"- 乙\n- 甲\n  续行","pass":true}
{"item":3,"name":"不跨正文移动","input":{"markdown":"- 甲\n\n正文\n\n- 乙","index":0,"action":"down"},"actual":"- 甲\n\n正文\n\n- 乙","expected":"- 甲\n\n正文\n\n- 乙","pass":true}
{"item":3,"name":"空文档","input":{"markdown":"","index":0,"action":"down"},"actual":"","expected":"","pass":true}
{"item":3,"name":"无上级可提升","input":{"markdown":"- 甲\n- 乙","index":1,"action":"promote"},"actual":"- 甲\n- 乙","expected":"- 甲\n- 乙","pass":true}
{"item":3,"name":"Tab 缩进转列表","input":"甲\n\t乙","actual":"- 甲\n  - 乙","expected":"- 甲\n  - 乙","pass":true}
{"item":3,"name":"有限深度大纲","input":"- 甲\n  - 乙\n    - 丙","actual":"- 甲\n  - 乙","expected":"- 甲\n  - 乙","pass":true}
{"item":3,"name":"保留任务标记的标题","input":"- [x] 甲\n  - 乙","actual":"## [x] 甲\n### 乙","expected":"## [x] 甲\n### 乙","pass":true}
{"item":4,"name":"周日的下周一","input":{"value":"下周一","baseline":"2026-11-22","weekStart":1},"actual":"2026-11-23","expected":"2026-11-23","pass":true}
{"item":4,"name":"周日的周末","input":{"value":"周末","baseline":"2026-11-22","weekStart":1},"actual":"2026-11-21","expected":"2026-11-21","pass":true}
{"item":4,"name":"跨年","input":{"value":"三天后","baseline":"2026-12-31","weekStart":1},"actual":"2027-01-03","expected":"2027-01-03","pass":true}
{"item":4,"name":"闰年月末","input":{"value":"一个月后","baseline":"2024-01-31","weekStart":1},"actual":"2024-02-29","expected":"2024-02-29","pass":true}
{"item":4,"name":"非闰年月底","input":{"value":"下个月 31 号","baseline":"2027-01-31","weekStart":1},"actual":"2027-02-28","expected":"2027-02-28","pass":true}
{"item":4,"name":"空输入","input":{"value":"","baseline":"2026-11-22","weekStart":1},"actual":{"error":"第 1 字符：无法识别日期"},"expected":{"error":"第 1 字符"},"pass":true}
{"item":4,"name":"无效日期","input":{"value":"2 月 30 日","baseline":"2026-11-22","weekStart":1},"actual":{"error":"第 5 字符：日期超出范围"},"expected":{"error":"日期超出"},"pass":true}
{"item":4,"name":"未识别日期","input":{"value":"月底有空","baseline":"2026-11-22","weekStart":1},"actual":{"error":"第 1 字符：无法识别日期"},"expected":{"error":"无法识别"},"pass":true}
{"item":4,"name":"英文跨年","input":{"value":"tomorrow","baseline":"2026-12-31","weekStart":1},"actual":"2027-01-01","expected":"2027-01-01","pass":true}
{"item":4,"name":"两周跨月","input":{"value":"两周后","baseline":"2026-11-22","weekStart":1},"actual":"2026-12-06","expected":"2026-12-06","pass":true}
{"item":4,"name":"周日为周首","input":{"value":"本周五","baseline":"2026-11-22","weekStart":0},"actual":"2026-11-27","expected":"2026-11-27","pass":true}
{"passed":42,"failed":0}
```

</details>

## 测试输出

<details>
<summary>npm test 完整输出</summary>

```text
npm notice run test
npm notice run node --test tests/*.test.mjs
TAP version 13
# Subtest: chart fence in the official format becomes an option
ok 1 - chart fence in the official format becomes an option
  ---
  duration_ms: 2.771083
  type: 'test'
  ...
# Subtest: pie rows become named slices
ok 2 - pie rows become named slices
  ---
  duration_ms: 0.466459
  type: 'test'
  ...
# Subtest: bad rows and empty fences fail with a readable message
ok 3 - bad rows and empty fences fail with a readable message
  ---
  duration_ms: 0.5235
  type: 'test'
  ...
# Subtest: bar and line draw one shape per data point, coloured from the theme accent
ok 4 - bar and line draw one shape per data point, coloured from the theme accent
  ---
  duration_ms: 1.661542
  type: 'test'
  ...
# Subtest: pie draws one slice per item with percentage labels
ok 5 - pie draws one slice per item with percentage labels
  ---
  duration_ms: 0.394709
  type: 'test'
  ...
# Subtest: titles are escaped and each bar series gets its own slot
ok 6 - titles are escaped and each bar series gets its own slot
  ---
  duration_ms: 0.212917
  type: 'test'
  ...
# Subtest: mixed pie and empty series fail with a readable message
ok 7 - mixed pie and empty series fail with a readable message
  ---
  duration_ms: 0.140167
  type: 'test'
  ...
# Subtest: flowchart parses shapes, chains, labels and edge styles
ok 8 - flowchart parses shapes, chains, labels and edge styles
  ---
  duration_ms: 1.899292
  type: 'test'
  ...
# Subtest: flowchart draws a shape per node, an arrow per edge, and keeps back edges inside the canvas
ok 9 - flowchart draws a shape per node, an arrow per edge, and keeps back edges inside the canvas
  ---
  duration_ms: 1.981583
  type: 'test'
  ...
# Subtest: other Mermaid diagrams are rejected with a readable message
ok 10 - other Mermaid diagrams are rejected with a readable message
  ---
  duration_ms: 0.442
  type: 'test'
  ...
# Subtest: subgraphs parse with titles, nesting and members
ok 11 - subgraphs parse with titles, nesting and members
  ---
  duration_ms: 0.325166
  type: 'test'
  ...
# Subtest: a node mentioned outside first still belongs to the subgraph that lists it
ok 12 - a node mentioned outside first still belongs to the subgraph that lists it
  ---
  duration_ms: 0.068375
  type: 'test'
  ...
# Subtest: subgraph boxes enclose their members and keep other nodes outside
ok 13 - subgraph boxes enclose their members and keep other nodes outside
  ---
  duration_ms: 0.265625
  type: 'test'
  ...
# Subtest: unbalanced subgraphs, edges to a subgraph and overlapping layouts fail readably
ok 14 - unbalanced subgraphs, edges to a subgraph and overlapping layouts fail readably
  ---
  duration_ms: 1.001125
  type: 'test'
  ...
# Subtest: an unknown chart type draws bars, as the official Charts extension does
ok 15 - an unknown chart type draws bars, as the official Charts extension does
  ---
  duration_ms: 0.394
  type: 'test'
  ...
# Subtest: detects one-sided accent bars
ok 16 - detects one-sided accent bars
  ---
  duration_ms: 1.381041
  type: 'test'
  ...
# Subtest: allows hairlines and resets
ok 17 - allows hairlines and resets
  ---
  duration_ms: 0.189084
  type: 'test'
  ...
# Subtest: theme and slides contain no one-sided accent bar
ok 18 - theme and slides contain no one-sided accent bar
  ---
  duration_ms: 1.992083
  type: 'test'
  ...
# Subtest: spaces between CJK and Latin or digits
ok 19 - spaces between CJK and Latin or digits
  ---
  duration_ms: 0.565458
  type: 'test'
  ...
# Subtest: idempotent
ok 20 - idempotent
  ---
  duration_ms: 0.201292
  type: 'test'
  ...
# Subtest: leaves inline code, math, URLs and HTML alone
ok 21 - leaves inline code, math, URLs and HTML alone
  ---
  duration_ms: 0.100334
  type: 'test'
  ...
# Subtest: spaces a link label but keeps its URL
ok 22 - spaces a link label but keeps its URL
  ---
  duration_ms: 0.945125
  type: 'test'
  ...
# Subtest: leaves code fences, math blocks and front matter alone
ok 23 - leaves code fences, math blocks and front matter alone
  ---
  duration_ms: 0.135708
  type: 'test'
  ...
# Subtest: a shorter fence marker does not close a longer fence
ok 24 - a shorter fence marker does not close a longer fence
  ---
  duration_ms: 0.059375
  type: 'test'
  ...
# Subtest: every palette defines hex diagram colors for light and dark
ok 25 - every palette defines hex diagram colors for light and dark
  ---
  duration_ms: 0.566208
  type: 'test'
  ...
# Subtest: theme.css feeds the diagram colors to the renderer without color-mix
ok 26 - theme.css feeds the diagram colors to the renderer without color-mix
  ---
  duration_ms: 0.204583
  type: 'test'
  ...
# Subtest: sequence: participants, labels, messages and activation parse
ok 27 - sequence: participants, labels, messages and activation parse
  ---
  duration_ms: 2.801125
  type: 'test'
  ...
# Subtest: sequence: draws lifelines, arrows, frames, notes and activation bars
ok 28 - sequence: draws lifelines, arrows, frames, notes and activation bars
  ---
  duration_ms: 0.888
  type: 'test'
  ...
# Subtest: sequence: bad syntax and unbalanced blocks fail readably
ok 29 - sequence: bad syntax and unbalanced blocks fail readably
  ---
  duration_ms: 0.327959
  type: 'test'
  ...
# Subtest: gantt: dates, durations, after and tags
ok 30 - gantt: dates, durations, after and tags
  ---
  duration_ms: 1.614917
  type: 'test'
  ...
# Subtest: gantt: a task with only a duration starts when the previous one ends
ok 31 - gantt: a task with only a duration starts when the previous one ends
  ---
  duration_ms: 0.90225
  type: 'test'
  ...
# Subtest: gantt: draws one bar per task and a diamond per milestone
ok 32 - gantt: draws one bar per task and a diamond per milestone
  ---
  duration_ms: 0.5145
  type: 'test'
  ...
# Subtest: gantt: unsupported formats and unknown ids fail readably
ok 33 - gantt: unsupported formats and unknown ids fail readably
  ---
  duration_ms: 0.117792
  type: 'test'
  ...
# Subtest: pie: title, showData and quoted or bare labels
ok 34 - pie: title, showData and quoted or bare labels
  ---
  duration_ms: 0.347583
  type: 'test'
  ...
# Subtest: dispatcher: routes by diagram type and rejects the rest
ok 35 - dispatcher: routes by diagram type and rejects the rest
  ---
  duration_ms: 1.821458
  type: 'test'
  ...
# Subtest: exported outline sidebar hides heading marks with a zero-width font
ok 36 - exported outline sidebar hides heading marks with a zero-width font
  ---
  duration_ms: 0.619333
  type: 'test'
  ...
# Subtest: exported outline sidebar overrides the exporter's level indents
ok 37 - exported outline sidebar overrides the exporter's level indents
  ---
  duration_ms: 0.141208
  type: 'test'
  ...
# Subtest: every supported extension maps to a language with rules
ok 38 - every supported extension maps to a language with rules
  ---
  duration_ms: 10.005208
  type: 'test'
  ...
# Subtest: highlighting never changes the text, so it can sit under the textarea
ok 39 - highlighting never changes the text, so it can sit under the textarea
  ---
  duration_ms: 5.073084
  type: 'test'
  ...
# Subtest: unknown extensions come back escaped and unstyled
ok 40 - unknown extensions come back escaped and unstyled
  ---
  duration_ms: 0.187417
  type: 'test'
  ...
# Subtest: javascript colours keywords, calls, strings, comments, numbers and types
ok 41 - javascript colours keywords, calls, strings, comments, numbers and types
  ---
  duration_ms: 0.762666
  type: 'test'
  ...
# Subtest: a keyword followed by a parenthesis is a keyword, not a call
ok 42 - a keyword followed by a parenthesis is a keyword, not a call
  ---
  duration_ms: 0.076584
  type: 'test'
  ...
# Subtest: typescript adds type keywords that plain javascript leaves alone
ok 43 - typescript adds type keywords that plain javascript leaves alone
  ---
  duration_ms: 0.147875
  type: 'test'
  ...
# Subtest: python docstrings are strings and decorators are attributes
ok 44 - python docstrings are strings and decorators are attributes
  ---
  duration_ms: 0.073667
  type: 'test'
  ...
# Subtest: rust lifetimes are not mistaken for character literals
ok 45 - rust lifetimes are not mistaken for character literals
  ---
  duration_ms: 0.048416
  type: 'test'
  ...
# Subtest: shell variables and sql keywords in any case
ok 46 - shell variables and sql keywords in any case
  ---
  duration_ms: 0.217792
  type: 'test'
  ...
# Subtest: ini sections, keys and comments
ok 47 - ini sections, keys and comments
  ---
  duration_ms: 0.278583
  type: 'test'
  ...
# Subtest: css colours properties, values, selectors and at-rules
ok 48 - css colours properties, values, selectors and at-rules
  ---
  duration_ms: 0.130875
  type: 'test'
  ...
# Subtest: html highlights style and script bodies with their own rules
ok 49 - html highlights style and script bodies with their own rules
  ---
  duration_ms: 1.809042
  type: 'test'
  ...
# Subtest: unterminated strings and comments do not hang or lose text
ok 50 - unterminated strings and comments do not hang or lose text
  ---
  duration_ms: 0.072167
  type: 'test'
  ...
# Subtest: every inline rule pattern compiles
ok 51 - every inline rule pattern compiles
  ---
  duration_ms: 1.64275
  type: 'test'
  ...
# Subtest: a badge shows only label and value; the wrapper is hidden
ok 52 - a badge shows only label and value; the wrapper is hidden
  ---
  duration_ms: 2.772041
  type: 'test'
  ...
# Subtest: spoiler, ruby and crumb keep their content and hide the wrapper
ok 53 - spoiler, ruby and crumb keep their content and hide the wrapper
  ---
  duration_ms: 2.388458
  type: 'test'
  ...
# Subtest: incomplete syntax is left visible
ok 54 - incomplete syntax is left visible
  ---
  duration_ms: 0.729375
  type: 'test'
  ...
# Subtest: two badges on one line do not swallow each other
ok 55 - two badges on one line do not swallow each other
  ---
  duration_ms: 0.584625
  type: 'test'
  ...
# Subtest: a badge with a single value and the amber and gray colors are supported
ok 56 - a badge with a single value and the amber and gray colors are supported
  ---
  duration_ms: 0.363833
  type: 'test'
  ...
# Subtest: candidates share terms with the target, skip itself and linked notes, and respect the limit
ok 57 - candidates share terms with the target, skip itself and linked notes, and respect the limit
  ---
  duration_ms: 1.76275
  type: 'test'
  ...
# Subtest: similar names for a broken link rank by character overlap
ok 58 - similar names for a broken link rank by character overlap
  ---
  duration_ms: 0.237209
  type: 'test'
  ...
# Subtest: reply parsing keeps only allowed paths, trims text and survives fenced or chatty output
ok 59 - reply parsing keeps only allowed paths, trims text and survives fenced or chatty output
  ---
  duration_ms: 0.957459
  type: 'test'
  ...
# Subtest: reply parsing rejects text without a JSON object
ok 60 - reply parsing rejects text without a JSON object
  ---
  duration_ms: 0.165917
  type: 'test'
  ...
# Subtest: a note request sends a truncated body and candidate lines only, and stores a sanitised result
ok 61 - a note request sends a truncated body and candidate lines only, and stores a sanitised result
  ---
  duration_ms: 0.615875
  type: 'test'
  ...
# Subtest: instructions inside a note cannot make the result name a path outside the candidates
ok 62 - instructions inside a note cannot make the result name a path outside the candidates
  ---
  duration_ms: 2.208625
  type: 'test'
  ...
# Subtest: a broken-link request lists likely notes from similar names
ok 63 - a broken-link request lists likely notes from similar names
  ---
  duration_ms: 0.221125
  type: 'test'
  ...
# Subtest: the switch in settings, model readiness and failures are reported without calling or crashing
ok 64 - the switch in settings, model readiness and failures are reported without calling or crashing
  ---
  duration_ms: 0.336083
  type: 'test'
  ...
# Subtest: a stale request is dropped and a missing ai permission is reported
ok 65 - a stale request is dropped and a missing ai permission is reported
  ---
  duration_ms: 0.331792
  type: 'test'
  ...
# Subtest: in a large vault, terms found in most notes do not count as shared
ok 66 - in a large vault, terms found in most notes do not count as shared
  ---
  duration_ms: 2.033667
  type: 'test'
  ...
# Subtest: empty or blank query yields no filter
ok 67 - empty or blank query yields no filter
  ---
  duration_ms: 0.716459
  type: 'test'
  ...
# Subtest: plain words match the note name ignoring case and width
ok 68 - plain words match the note name ignoring case and width
  ---
  duration_ms: 0.213959
  type: 'test'
  ...
# Subtest: \#tag matches tags by containment and path: matches the path
ok 69 - \#tag matches tags by containment and path: matches the path
  ---
  duration_ms: 0.075792
  type: 'test'
  ...
# Subtest: several terms must all match
ok 70 - several terms must all match
  ---
  duration_ms: 0.130041
  type: 'test'
  ...
# Subtest: broken nodes have no path or tags so only name terms can match
ok 71 - broken nodes have no path or tags so only name terms can match
  ---
  duration_ms: 0.065375
  type: 'test'
  ...
# Subtest: a lone \# or path: prefix is ignored instead of matching everything or nothing
ok 72 - a lone \# or path: prefix is ignored instead of matching everything or nothing
  ---
  duration_ms: 0.045125
  type: 'test'
  ...
# Subtest: arrow navigation picks the nearest node in the pressed direction
ok 73 - arrow navigation picks the nearest node in the pressed direction
  ---
  duration_ms: 0.1985
  type: 'test'
  ...
# Subtest: arrow navigation ignores nodes outside the cone and stays put at the edge
ok 74 - arrow navigation ignores nodes outside the cone and stays put at the edge
  ---
  duration_ms: 0.048208
  type: 'test'
  ...
# Subtest: one rebuild answers every pending refresh request and clears them
ok 75 - one rebuild answers every pending refresh request and clears them
  ---
  duration_ms: 3.787625
  type: 'test'
  ...
# Subtest: a stale request is dropped without rebuilding
ok 76 - a stale request is dropped without rebuilding
  ---
  duration_ms: 1.673166
  type: 'test'
  ...
# Subtest: a failed rebuild is reported in the response and the request is still cleared
ok 77 - a failed rebuild is reported in the response and the request is still cleared
  ---
  duration_ms: 1.653208
  type: 'test'
  ...
# Subtest: polling with no request does nothing
ok 78 - polling with no request does nothing
  ---
  duration_ms: 0.245833
  type: 'test'
  ...
# Subtest: one node per note and one edge per linked pair, no self loops
ok 79 - one node per note and one edge per linked pair, no self loops
  ---
  duration_ms: 1.975292
  type: 'test'
  ...
# Subtest: broken links become dashed nodes named by the link text
ok 80 - broken links become dashed nodes named by the link text
  ---
  duration_ms: 0.15875
  type: 'test'
  ...
# Subtest: same-named notes stay separate and resolve to the nearest one
ok 81 - same-named notes stay separate and resolve to the nearest one
  ---
  duration_ms: 0.169916
  type: 'test'
  ...
# Subtest: local graph keeps the note and its neighbours up to the given depth
ok 82 - local graph keeps the note and its neighbours up to the given depth
  ---
  duration_ms: 0.29475
  type: 'test'
  ...
# Subtest: local graph of an unknown path is empty
ok 83 - local graph of an unknown path is empty
  ---
  duration_ms: 0.077166
  type: 'test'
  ...
# Subtest: layout is deterministic, finite and inside the canvas
ok 84 - layout is deterministic, finite and inside the canvas
  ---
  duration_ms: 6.954708
  type: 'test'
  ...
# Subtest: layout handles empty and single-node graphs
ok 85 - layout handles empty and single-node graphs
  ---
  duration_ms: 0.119917
  type: 'test'
  ...
# Subtest: layout of 2000 linked notes finishes within 5 seconds
ok 86 - layout of 2000 linked notes finishes within 5 seconds
  ---
  duration_ms: 326.791791
  type: 'test'
  ...
# Subtest: graph model reuses the layout until the link structure changes
ok 87 - graph model reuses the layout until the link structure changes
  ---
  duration_ms: 17.203833
  type: 'test'
  ...
# Subtest: graph model drops the global graph above the node limit and keeps the local one
ok 88 - graph model drops the global graph above the node limit and keeps the local one
  ---
  duration_ms: 30.874042
  type: 'test'
  ...
# Subtest: parent and up properties become parent edges, links stay link edges
ok 89 - parent and up properties become parent edges, links stay link edges
  ---
  duration_ms: 0.163625
  type: 'test'
  ...
# Subtest: a pair linked and related by parent keeps both edges
ok 90 - a pair linked and related by parent keeps both edges
  ---
  duration_ms: 0.404041
  type: 'test'
  ...
# Subtest: nodes carry their top-level folder as group, root notes get an empty group
ok 91 - nodes carry their top-level folder as group, root notes get an empty group
  ---
  duration_ms: 0.055083
  type: 'test'
  ...
# Subtest: note info summarises tasks, cards, tags and scalar properties
ok 92 - note info summarises tasks, cards, tags and scalar properties
  ---
  duration_ms: 0.242
  type: 'test'
  ...
# Subtest: note info truncates long values and ignores structure-only keys
ok 93 - note info truncates long values and ignores structure-only keys
  ---
  duration_ms: 0.473917
  type: 'test'
  ...
# Subtest: graph model exposes info for every note and no info for broken nodes
ok 94 - graph model exposes info for every note and no info for broken nodes
  ---
  duration_ms: 4.391916
  type: 'test'
  ...
# Subtest: isolated notes sit in a band below every linked note and never overlap
ok 95 - isolated notes sit in a band below every linked note and never overlap
  ---
  duration_ms: 1.594458
  type: 'test'
  ...
# Subtest: a graph with no links at all is laid out as a grid inside the canvas
ok 96 - a graph with no links at all is laid out as a grid inside the canvas
  ---
  duration_ms: 0.099458
  type: 'test'
  ...
# Subtest: a few hundred isolated notes still fit in the canvas without overlapping
ok 97 - a few hundred isolated notes still fit in the canvas without overlapping
  ---
  duration_ms: 0.489833
  type: 'test'
  ...
# Subtest: formats headings, lists, prose and whitespace in one idempotent pass
ok 98 - formats headings, lists, prose and whitespace in one idempotent pass
  ---
  duration_ms: 4.922208
  type: 'test'
  ...
# Subtest: preserves protected content and its CRLF line endings
ok 99 - preserves protected content and its CRLF line endings
  ---
  duration_ms: 1.374166
  type: 'test'
  ...
# Subtest: supports independent settings and preserves nested list levels
ok 100 - supports independent settings and preserves nested list levels
  ---
  duration_ms: 0.253292
  type: 'test'
  ...
# Subtest: keeps inline literals, decimals and reference destinations while styling prose
ok 101 - keeps inline literals, decimals and reference destinations while styling prose
  ---
  duration_ms: 0.110708
  type: 'test'
  ...
# Subtest: keeps fenced code that starts on a list item and preserves ordered nesting
ok 102 - keeps fenced code that starts on a list item and preserves ordered nesting
  ---
  duration_ms: 0.088583
  type: 'test'
  ...
# Subtest: preserves multi-line inline code and keeps blockquotes as blockquotes
ok 103 - preserves multi-line inline code and keeps blockquotes as blockquotes
  ---
  duration_ms: 0.060459
  type: 'test'
  ...
# Subtest: normalizing list indent keeps wrapped continuations in their item
ok 104 - normalizing list indent keeps wrapped continuations in their item
  ---
  duration_ms: 0.654167
  type: 'test'
  ...
# Subtest: registered formatter reads current settings and preserves the spacing command
ok 105 - registered formatter reads current settings and preserves the spacing command
  ---
  duration_ms: 13.446333
  type: 'test'
  ...
# Subtest: preserves footnote references and definitions
ok 106 - preserves footnote references and definitions
  ---
  duration_ms: 0.605542
  type: 'test'
  ...
# Subtest: preserves English punctuation inside a mixed-language line
ok 107 - preserves English punctuation inside a mixed-language line
  ---
  duration_ms: 0.508291
  type: 'test'
  ...
# Subtest: localizes punctuation after the English sentence ends
ok 108 - localizes punctuation after the English sentence ends
  ---
  duration_ms: 0.175959
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 中文(版本2.5),继续
ok 109 - formats punctuation per acceptance spec: 中文(版本2.5),继续
  ---
  duration_ms: 0.142
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 中文abc, 继续
ok 110 - formats punctuation per acceptance spec: 中文abc, 继续
  ---
  duration_ms: 0.148792
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 正文Typora, 版本2!
ok 111 - formats punctuation per acceptance spec: 正文Typora, 版本2!
  ---
  duration_ms: 0.111625
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 价格是3,000元,请确认!
ok 112 - formats punctuation per acceptance spec: 价格是3,000元,请确认!
  ---
  duration_ms: 0.048208
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 你好, world
ok 113 - formats punctuation per acceptance spec: 你好, world
  ---
  duration_ms: 0.033792
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: Hello, 世界
ok 114 - formats punctuation per acceptance spec: Hello, 世界
  ---
  duration_ms: 0.031416
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: He said: hello, world. 这是中文。
ok 115 - formats punctuation per acceptance spec: He said: hello, world. 这是中文。
  ---
  duration_ms: 0.03875
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: The cat sat. 然后它走了.
ok 116 - formats punctuation per acceptance spec: The cat sat. 然后它走了.
  ---
  duration_ms: 0.03575
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: f(x) = g(y), see docs.
ok 117 - formats punctuation per acceptance spec: f(x) = g(y), see docs.
  ---
  duration_ms: 0.172417
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 函数(foo)与(bar)
ok 118 - formats punctuation per acceptance spec: 函数(foo)与(bar)
  ---
  duration_ms: 0.416791
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 正文[^1]\\n\\n[^1]: 说明,test
ok 119 - formats punctuation per acceptance spec: 正文[^1]\\n\\n[^1]: 说明,test
  ---
  duration_ms: 0.053709
  type: 'test'
  ...
# Subtest: preserves balanced Markdown link destinations with nested parentheses
ok 120 - preserves balanced Markdown link destinations with nested parentheses
  ---
  duration_ms: 0.080417
  type: 'test'
  ...
# Subtest: parses 明天 with the requested week start
ok 121 - parses 明天 with the requested week start
  ---
  duration_ms: 5.722042
  type: 'test'
  ...
# Subtest: parses 后天 with the requested week start
ok 122 - parses 后天 with the requested week start
  ---
  duration_ms: 0.422625
  type: 'test'
  ...
# Subtest: parses 下周一 with the requested week start
ok 123 - parses 下周一 with the requested week start
  ---
  duration_ms: 0.351541
  type: 'test'
  ...
# Subtest: parses 本周五 with the requested week start
ok 124 - parses 本周五 with the requested week start
  ---
  duration_ms: 0.426291
  type: 'test'
  ...
# Subtest: parses 本周五 with the requested week start
ok 125 - parses 本周五 with the requested week start
  ---
  duration_ms: 0.428916
  type: 'test'
  ...
# Subtest: parses 三天后 with the requested week start
ok 126 - parses 三天后 with the requested week start
  ---
  duration_ms: 0.44675
  type: 'test'
  ...
# Subtest: parses 两周后 with the requested week start
ok 127 - parses 两周后 with the requested week start
  ---
  duration_ms: 0.3615
  type: 'test'
  ...
# Subtest: parses 下个月 5 号 with the requested week start
ok 128 - parses 下个月 5 号 with the requested week start
  ---
  duration_ms: 0.313584
  type: 'test'
  ...
# Subtest: parses 12 月 1 日 with the requested week start
ok 129 - parses 12 月 1 日 with the requested week start
  ---
  duration_ms: 0.979417
  type: 'test'
  ...
# Subtest: parses 下个月 31 号 with the requested week start
ok 130 - parses 下个月 31 号 with the requested week start
  ---
  duration_ms: 0.450208
  type: 'test'
  ...
# Subtest: parses tomorrow with the requested week start
ok 131 - parses tomorrow with the requested week start
  ---
  duration_ms: 0.12525
  type: 'test'
  ...
# Subtest: unknown and invalid dates have an error position
ok 132 - unknown and invalid dates have an error position
  ---
  duration_ms: 0.306917
  type: 'test'
  ...
# Subtest: clamps relative month arithmetic and crosses a year boundary
ok 133 - clamps relative month arithmetic and crosses a year boundary
  ---
  duration_ms: 0.158792
  type: 'test'
  ...
# Subtest: formats ISO, weekday and wiki dates
ok 134 - formats ISO, weekday and wiki dates
  ---
  duration_ms: 0.045875
  type: 'test'
  ...
# Subtest: 列字母与序号互转
ok 135 - 列字母与序号互转
  ---
  duration_ms: 0.509458
  type: 'test'
  ...
# Subtest: XML 实体还原
ok 136 - XML 实体还原
  ---
  duration_ms: 0.174417
  type: 'test'
  ...
# Subtest: 共享字符串合并富文本片段
ok 137 - 共享字符串合并富文本片段
  ---
  duration_ms: 0.453291
  type: 'test'
  ...
# Subtest: 工作表解析：共享字符串、数字、布尔、内联字符串与稀疏单元格
ok 138 - 工作表解析：共享字符串、数字、布尔、内联字符串与稀疏单元格
  ---
  duration_ms: 1.457625
  type: 'test'
  ...
# Subtest: 幻灯片解析：按编号排序，标题与正文分开
ok 139 - 幻灯片解析：按编号排序，标题与正文分开
  ---
  duration_ms: 0.376417
  type: 'test'
  ...
# Subtest: xlsx 日期：内置与自定义日期格式的单元格按日期显示，普通数字不变
ok 140 - xlsx 日期：内置与自定义日期格式的单元格按日期显示，普通数字不变
  ---
  duration_ms: 0.473167
  type: 'test'
  ...
# Subtest: xlsx 日期：序列号转换、纯时间与 1904 纪元
ok 141 - xlsx 日期：序列号转换、纯时间与 1904 纪元
  ---
  duration_ms: 0.09975
  type: 'test'
  ...
# Subtest: swaps a complete task branch with its next sibling
ok 142 - swaps a complete task branch with its next sibling
  ---
  duration_ms: 2.624583
  type: 'test'
  ...
# Subtest: upper and lower boundaries are no-ops
ok 143 - upper and lower boundaries are no-ops
  ---
  duration_ms: 1.368334
  type: 'test'
  ...
# Subtest: promotes and demotes a subtree while preserving relative indent
ok 144 - promotes and demotes a subtree while preserving relative indent
  ---
  duration_ms: 0.592208
  type: 'test'
  ...
# Subtest: renumbers ordered siblings and protects code and document boundaries
ok 145 - renumbers ordered siblings and protects code and document boundaries
  ---
  duration_ms: 0.736166
  type: 'test'
  ...
# Subtest: converts indentation to list levels and list levels to headings
ok 146 - converts indentation to list levels and list levels to headings
  ---
  duration_ms: 0.700125
  type: 'test'
  ...
# Subtest: list probes cover protected content, boundaries, and deep branches
ok 147 - list probes cover protected content, boundaries, and deep branches
  ---
  duration_ms: 0.47075
  type: 'test'
  ...
# Subtest: uses the host list range even when copied Markdown loses all or some markers
ok 148 - uses the host list range even when copied Markdown loses all or some markers
  ---
  duration_ms: 3.568541
  type: 'test'
  ...
# Subtest: splits on top-level rules and drops blank paragraphs
ok 149 - splits on top-level rules and drops blank paragraphs
  ---
  duration_ms: 2.57425
  type: 'test'
  ...
# Subtest: without rules, h1 and h2 start new slides but h3 does not
ok 150 - without rules, h1 and h2 start new slides but h3 does not
  ---
  duration_ms: 0.468625
  type: 'test'
  ...
# Subtest: children are nested under their parent
ok 151 - children are nested under their parent
  ---
  duration_ms: 0.078334
  type: 'test'
  ...
# Subtest: front matter and empty documents
ok 152 - front matter and empty documents
  ---
  duration_ms: 0.079542
  type: 'test'
  ...
# Subtest: inline markdown
ok 153 - inline markdown
  ---
  duration_ms: 0.247417
  type: 'test'
  ...
# Subtest: links, images, kbd and unknown HTML
ok 154 - links, images, kbd and unknown HTML
  ---
  duration_ms: 0.09825
  type: 'test'
  ...
# Subtest: code spans keep their content literal
ok 155 - code spans keep their content literal
  ---
  duration_ms: 0.090083
  type: 'test'
  ...
# Subtest: plain text and heading text
ok 156 - plain text and heading text
  ---
  duration_ms: 0.059916
  type: 'test'
  ...
# Subtest: only safe URLs pass
ok 157 - only safe URLs pass
  ---
  duration_ms: 0.370875
  type: 'test'
  ...
# Subtest: inline components from Ignorance
ok 158 - inline components from Ignorance
  ---
  duration_ms: 0.453625
  type: 'test'
  ...
# Subtest: layout comments and the cover fallback
ok 159 - layout comments and the cover fallback
  ---
  duration_ms: 0.332958
  type: 'test'
  ...
# Subtest: kpi items split into value and label
ok 160 - kpi items split into value and label
  ---
  duration_ms: 0.131875
  type: 'test'
  ...
# Subtest: icon shortcodes like :bolt: are dropped from slide text
ok 161 - icon shortcodes like :bolt: are dropped from slide text
  ---
  duration_ms: 1.954375
  type: 'test'
  ...
# Subtest: slideKey changes only when the slide's own content changes
ok 162 - slideKey changes only when the slide's own content changes
  ---
  duration_ms: 0.208333
  type: 'test'
  ...
# Subtest: inline HTML comments are dropped from slide text
ok 163 - inline HTML comments are dropped from slide text
  ---
  duration_ms: 0.053959
  type: 'test'
  ...
# Subtest: footnote references become footnote nodes, not link text
ok 164 - footnote references become footnote nodes, not link text
  ---
  duration_ms: 0.055125
  type: 'test'
  ...
# Subtest: icon shortcodes become icon nodes; times and URLs stay text
ok 165 - icon shortcodes become icon nodes; times and URLs stay text
  ---
  duration_ms: 0.061417
  type: 'test'
  ...
# Subtest: footnote definitions are collected by id from def_footnote blocks
ok 166 - footnote definitions are collected by id from def_footnote blocks
  ---
  duration_ms: 0.12375
  type: 'test'
  ...
# Subtest: listTag: Typora marks ordered lists with listType 'ol'
ok 167 - listTag: Typora marks ordered lists with listType 'ol'
  ---
  duration_ms: 0.094625
  type: 'test'
  ...
# Subtest: 每个文件查看器的入口页都存在，且扩展名不重复
ok 168 - 每个文件查看器的入口页都存在，且扩展名不重复
  ---
  duration_ms: 2.433166
  type: 'test'
  ...
# Subtest: ignorance.file-viewers 满足商店硬性限制
ok 169 - ignorance.file-viewers 满足商店硬性限制
  ---
  duration_ms: 3.078042
  type: 'test'
  ...
# Subtest: ignorance.advanced 满足商店硬性限制
ok 170 - ignorance.advanced 满足商店硬性限制
  ---
  duration_ms: 3.566875
  type: 'test'
  ...
# Subtest: ignorance.vault 满足商店硬性限制
ok 171 - ignorance.vault 满足商店硬性限制
  ---
  duration_ms: 2.051667
  type: 'test'
  ...
# Subtest: 文件查看器扩展不申请任何权限
ok 172 - 文件查看器扩展不申请任何权限
  ---
  duration_ms: 0.533875
  type: 'test'
  ...
# Subtest: 主题商店包：只含主题，清单与 theme.toml 满足规则
ok 173 - 主题商店包：只含主题，清单与 theme.toml 满足规则
  ---
  duration_ms: 2.128
  type: 'test'
  ...
# Subtest: ignorance.advanced 不打包 ECharts 与 Mermaid，演示用内置渲染器
ok 174 - ignorance.advanced 不打包 ECharts 与 Mermaid，演示用内置渲染器
  ---
  duration_ms: 0.839167
  type: 'test'
  ...
# Subtest: calculates row expressions and aggregate ranges referencing calculated cells
ok 175 - calculates row expressions and aggregate ranges referencing calculated cells
  ---
  duration_ms: 2.4075
  type: 'test'
  ...
# Subtest: marks invalid references and circular dependencies with errors
ok 176 - marks invalid references and circular dependencies with errors
  ---
  duration_ms: 0.320125
  type: 'test'
  ...
# Subtest: reports the error position for invalid expressions and supports operator precedence
ok 177 - reports the error position for invalid expressions and supports operator precedence
  ---
  duration_ms: 0.726584
  type: 'test'
  ...
# Subtest: aggregates values and resolves absolute and last-row references
ok 178 - aggregates values and resolves absolute and last-row references
  ---
  duration_ms: 0.46775
  type: 'test'
  ...
# Subtest: sorts numbers in both directions with blanks last and stable ties
ok 179 - sorts numbers in both directions with blanks last and stable ties
  ---
  duration_ms: 2.984792
  type: 'test'
  ...
# Subtest: sorts calendar dates and Chinese text
ok 180 - sorts calendar dates and Chinese text
  ---
  duration_ms: 1.384958
  type: 'test'
  ...
# Subtest: parses escaped pipes, code, CRLF and the original alignment row
ok 181 - parses escaped pipes, code, CRLF and the original alignment row
  ---
  duration_ms: 0.338833
  type: 'test'
  ...
# Subtest: accepts header-only tables and rejects non-table blocks
ok 182 - accepts header-only tables and rejects non-table blocks
  ---
  duration_ms: 0.094667
  type: 'test'
  ...
# Subtest: preserves protected Markdown around the target table through a command
ok 183 - preserves protected Markdown around the target table through a command
  ---
  duration_ms: 2.054416
  type: 'test'
  ...
# Subtest: appends totals and transposes while preserving the original table
ok 184 - appends totals and transposes while preserving the original table
  ---
  duration_ms: 0.178542
  type: 'test'
  ...
# Subtest: converts quoted CSV and reports malformed input
ok 185 - converts quoted CSV and reports malformed input
  ---
  duration_ms: 0.421209
  type: 'test'
  ...
# Subtest: locates a table without block text and uses the selected cell's sibling index
ok 186 - locates a table without block text and uses the selected cell's sibling index
  ---
  duration_ms: 1.404292
  type: 'test'
  ...
# Subtest: table commands leave the document untouched when the caret is outside a table
ok 187 - table commands leave the document untouched when the caret is outside a table
  ---
  duration_ms: 0.974708
  type: 'test'
  ...
# Subtest: runs the Vault Worker entry from indexing through query, search and review request
ok 188 - runs the Vault Worker entry from indexing through query, search and review request
  ---
  duration_ms: 517.775083
  type: 'test'
  ...
# Subtest: indexes properties, nested tasks, heading, links and tags without code
ok 189 - indexes properties, nested tasks, heading, links and tags without code
  ---
  duration_ms: 11.050042
  type: 'test'
  ...
# Subtest: keeps malformed YAML as an indexed note with a diagnostic
ok 190 - keeps malformed YAML as an indexed note with a diagnostic
  ---
  duration_ms: 0.679333
  type: 'test'
  ...
# Subtest: runs the documented path, date, property, field and sort query
ok 191 - runs the documented path, date, property, field and sort query
  ---
  duration_ms: 2.694542
  type: 'test'
  ...
# Subtest: handles grouping, arrays, missing fields and source logic
ok 192 - handles grouping, arrays, missing fields and source logic
  ---
  duration_ms: 0.993917
  type: 'test'
  ...
# Subtest: reports invalid keywords and conditions with source locations
ok 193 - reports invalid keywords and conditions with source locations
  ---
  duration_ms: 0.332709
  type: 'test'
  ...
# Subtest: does not compare invalid date strings as dates and supports the root source
ok 194 - does not compare invalid date strings as dates and supports the root source
  ---
  duration_ms: 0.206166
  type: 'test'
  ...
# Subtest: resolves three backlink sources, mentions, parent and siblings
ok 195 - resolves three backlink sources, mentions, parent and siblings
  ---
  duration_ms: 1.540917
  type: 'test'
  ...
# Subtest: ignores external and attachment links and follows decoded relative paths
ok 196 - ignores external and attachment links and follows decoded relative paths
  ---
  duration_ms: 0.949625
  type: 'test'
  ...
# Subtest: resolves an unquoted wiki parent parsed by YAML as nested flow arrays
ok 197 - resolves an unquoted wiki parent parsed by YAML as nested flow arrays
  ---
  duration_ms: 1.0745
  type: 'test'
  ...
# Subtest: markdown link falls back to a unique note name when the relative path is wrong
ok 198 - markdown link falls back to a unique note name when the relative path is wrong
  ---
  duration_ms: 0.5545
  type: 'test'
  ...
# Subtest: markdown link with a wrong prefix matches the note whose path ends the same way
ok 199 - markdown link with a wrong prefix matches the note whose path ends the same way
  ---
  duration_ms: 0.243542
  type: 'test'
  ...
# Subtest: a bare file name shared by several notes picks the nearest one, and an exact relative path still wins
ok 200 - a bare file name shared by several notes picks the nearest one, and an exact relative path still wins
  ---
  duration_ms: 0.994334
  type: 'test'
  ...
# Subtest: a link path that matches no exact file prefers the candidate sharing the most trailing folders
ok 201 - a link path that matches no exact file prefers the candidate sharing the most trailing folders
  ---
  duration_ms: 0.469042
  type: 'test'
  ...
# Subtest: equally similar candidates resolve to the same note every time
ok 202 - equally similar candidates resolve to the same note every time
  ---
  duration_ms: 1.055333
  type: 'test'
  ...
# Subtest: a markdown link to a name that exists nowhere stays broken and attachments stay ignored
ok 203 - a markdown link to a name that exists nowhere stays broken and attachments stay ignored
  ---
  duration_ms: 0.388916
  type: 'test'
  ...
# Subtest: groups backlinks by source path and keeps each reference location
ok 204 - groups backlinks by source path and keeps each reference location
  ---
  duration_ms: 0.386959
  type: 'test'
  ...
# Subtest: scans inside the root with exclusions and reuses unmodified entries
ok 205 - scans inside the root with exclusions and reuses unmodified entries
  ---
  duration_ms: 4.346125
  type: 'test'
  ...
# Subtest: reports host file and depth ceilings without reading filtered paths
ok 206 - reports host file and depth ceilings without reading filtered paths
  ---
  duration_ms: 10.624458
  type: 'test'
  ...
# Subtest: shares current note edits across controllers using the same cache
ok 207 - shares current note edits across controllers using the same cache
  ---
  duration_ms: 7.875875
  type: 'test'
  ...
# Subtest: relativePath accepts macOS firmlink aliases of the same folder
ok 208 - relativePath accepts macOS firmlink aliases of the same folder
  ---
  duration_ms: 0.53825
  type: 'test'
  ...
# Subtest: relativePath treats composed and decomposed Unicode names as the same
ok 209 - relativePath treats composed and decomposed Unicode names as the same
  ---
  duration_ms: 0.190709
  type: 'test'
  ...
# Subtest: relativePath still rejects files outside the root, including look-alike prefixes
ok 210 - relativePath still rejects files outside the root, including look-alike prefixes
  ---
  duration_ms: 0.1205
  type: 'test'
  ...
# Subtest: relativePath keeps working for ordinary and Windows-style paths
ok 211 - relativePath keeps working for ordinary and Windows-style paths
  ---
  duration_ms: 0.099541
  type: 'test'
  ...
# Subtest: keeps edits to two different notes when both windows publish concurrently
ok 212 - keeps edits to two different notes when both windows publish concurrently
  ---
  duration_ms: 5.588375
  type: 'test'
  ...
# Subtest: announces the first scan when a workspace opens after Worker startup
ok 213 - announces the first scan when a workspace opens after Worker startup
  ---
  duration_ms: 1.755917
  type: 'test'
  ...
# Subtest: ranks 50 fixed fixtures by title and separated Chinese words
ok 214 - ranks 50 fixed fixtures by title and separated Chinese words
  ---
  duration_ms: 2.426917
  type: 'test'
  ...
# Subtest: supports phrase, exclusion, tag, path and English misspelling
ok 215 - supports phrase, exclusion, tag, path and English misspelling
  ---
  duration_ms: 0.791916
  type: 'test'
  ...
# Subtest: returns a heading and marked spans for the matching snippet
ok 216 - returns a heading and marked spans for the matching snippet
  ---
  duration_ms: 0.168334
  type: 'test'
  ...
# Subtest: returns no results for blank searches and still supports filter-only searches
ok 217 - returns no results for blank searches and still supports filter-only searches
  ---
  duration_ms: 0.115417
  type: 'test'
  ...
# Subtest: recognizes three card formats and distinguishes matching questions by path
ok 218 - recognizes three card formats and distinguishes matching questions by path
  ---
  duration_ms: 8.896667
  type: 'test'
  ...
# Subtest: SM-2 intervals follow 1, 6 and ease multiplication, then reset on failure
ok 219 - SM-2 intervals follow 1, 6 and ease multiplication, then reset on failure
  ---
  duration_ms: 1.576833
  type: 'test'
  ...
# Subtest: rejects duplicate or stale scores while pruning deleted cards
ok 220 - rejects duplicate or stale scores while pruning deleted cards
  ---
  duration_ms: 1.032125
  type: 'test'
  ...
# Subtest: filters open tagged tasks and places overdue deadlines first
ok 221 - filters open tagged tasks and places overdue deadlines first
  ---
  duration_ms: 2.051166
  type: 'test'
  ...
# Subtest: the weekly side panel shows seven calendar days of open tasks
ok 222 - the weekly side panel shows seven calendar days of open tasks
  ---
  duration_ms: 0.210833
  type: 'test'
  ...
# Subtest: handles missing dates with a distinct filter and reports invalid syntax
ok 223 - handles missing dates with a distinct filter and reports invalid syntax
  ---
  duration_ms: 0.468834
  type: 'test'
  ...
# Subtest: plots numeric and unit values and marks missing notes and the goal
ok 224 - plots numeric and unit values and marks missing notes and the goal
  ---
  duration_ms: 2.435916
  type: 'test'
  ...
# Subtest: computes weekly average values starting Monday
ok 225 - computes weekly average values starting Monday
  ---
  duration_ms: 0.207
  type: 'test'
  ...
# Subtest: renders each day in a range as a heatmap cell
ok 226 - renders each day in a range as a heatmap cell
  ---
  duration_ms: 0.396083
  type: 'test'
  ...
# Subtest: every color code has a first and second position rule matching only the bare code
ok 227 - every color code has a first and second position rule matching only the bare code
  ---
  duration_ms: 0.879166
  type: 'test'
  ...
# Subtest: theme hides the suffix and colors the previous element
ok 228 - theme hides the suffix and colors the previous element
  ---
  duration_ms: 0.496625
  type: 'test'
  ...
1..228
# tests 228
# suites 0
# pass 228
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 806.19975
```

</details>

## 风险与回退

可回退以「R6」标记的独立提交，恢复原版链接目标识别并移除本轮探测与交付材料。深层括号链接在原版整理时可能被改写。R6 未切换已安装的扩展，实机验收结果仍以对应安装版本为准。
