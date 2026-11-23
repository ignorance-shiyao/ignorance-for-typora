# Typora 2.0 十项插件验收交付

## 改了什么

### 第 1 项 Markdown 规则整理

1–6 行。格式整理、保护块、幂等、撤销和独立设置。R6 另修复两层以上括号的链接和图片目标被改写。

### 第 2 项 表格公式与排序

1–7 行。表格命令、数据排序、公式、错误提示、撤销和导出。第 1 行的两种菜单条件仍待完整对照。

### 第 3 项 大纲列表命令

1–6 行。移动、提升、降低、序号、任务状态和快捷键。

### 第 4 项 中文自然语言日期

1–5 行。三种格式、错误提示、输入预览及确认插入。

### 第 5 项 工作区索引

1–6 行。索引、增量更新、排除目录、重建、缓存及文件数上限。

### 第 6 项 属性查询

1–6 行。表格、列表、分组、计数、错误定位、导出和相对路径。

### 第 7 项 跨文件任务汇总

1–4 行。截止时间、跨文件汇总、跳过围栏内容和本周任务详情。

### 第 8 项 跨文件数值图表

1–5 行。折线、目标线、热力图、聚合、缺失值、主题和导出。

### 第 9 项 相关性全文搜索

1–6 行。中文、短语、排除、路径、标签、错拼、高亮和空搜索。

### 第 10 项 反向链接

1–6 行。按来源合并反链、未链接提及、层级、断链和切换刷新。

### 第 11 项 间隔复习

1–6 行。卡片识别、评分、SM-2、文档只读、修改后重新排期和并发防重。

## 有意没做的

R1 的第二种条件尚未加载。本次按用户要求先交付 R6，R2–R5 的 Typora 专项仍需执行。V1 文件定位和 V2 导出采用验收报告已记录的退路。

## 自行决定和待确认

- 大纲快捷键采用 `⌘⇧F7` 至 `⌘⇧F10`。原组合在 macOS 触发文本选择或无响应，新组合已在实机触发对应命令。
- 日期插入采用「输入 → 预览 → 确认」。宿主输入框缺少实时输入回调，因此在写入前通过第二步呈现解析结果。
- 本周任务取从今天起 7 个日历日。
- 「周末」改为不早于今天的最近一个周六：周六取当天，周日取下一个周六，不受一周起点影响。旧行为（周日返回前一天，2026-11-22 得到 2026-11-21）作废，仅在新扩展 `ignorance.natural-date` 里改，`ignorance.advanced` 里的旧代码不动。旧断言只存在于 `scripts/probe-format.mjs`（预期 `2026-11-21`），已改为 `2026-11-28`，并新增周六、周一两条；测试里没有旧断言。
- Typora 2.0.0-beta1 的右键菜单未出现表格命令。现用 `table_cell` 条件下，`/` 在表内和表外均写入字面斜杠。`table` 条件待实测，命令面板已实测可用，入口判定由验收方给出。
- `6ea4f59` 在 `tests/store.test.mjs` 的 `STORE_READY` 加入 `ignorance.vault`，并将关于 Advanced 仅限本地及旧 ECharts 体积的注释替换为商店构建说明。拆分后 `ignorance.vault` 已删除，`STORE_READY` 改为列出 10 个新扩展（P01–P04、P06–P11）加 `ignorance.file-viewers`、`ignorance.advanced`。
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

### 逐行核对

| 要求 | 方法 | 证据 | 结果 |
|---|---|---|---|
| 1.1 在命令面板执行「Format Document: 整理 Markdown」 | Typora 合成样例、无障碍树或保存结果 | 标题从四级修到二级，列表转为短横线，有序列表从 1 编号，连续空行合并，中文标点和中英文间距符合预期 | 通过 |
| 1.2 在编辑模式和源码模式分别整理、按一次撤销并保存 | Typora 合成样例、无障碍树或保存结果 | 两种模式的撤销结果各自与整理前已保存的基线逐字节相同。编辑模式的基线与原始样例有两处保存规范差异，分别是两种列表之间的空行和末尾换行 | 通过 |
| 1.3 比对整理前后保存的源码 | Typora 合成样例、无障碍树或保存结果 | 代码围栏、数学块、Front Matter、表格、行内代码和链接地址六处逐字节相同 | 通过 |
| 1.4 对已整理文档再次执行命令并保存 | Typora 合成样例、无障碍树或保存结果 | 两份保存结果经 `cmp` 比对完全一致 | 通过 |
| 1.5 在扩展设置关闭「列表符号统一」，用原始样例重新整理 | Typora 合成样例、无障碍树或保存结果 | `*`、`+` 保留，标题、标点和间距仍整理 | 通过 |
| 1.6 用原始样例执行「中英文之间加空格」 | Typora 合成样例、无障碍树或保存结果 | 正文增加中英文和数字间距，原半角标点、四级标题及列表符号均保留 | 通过 |
| 2.1 在表格单元格和表外分别右键 | Typora 无障碍树；R1 | beta1 的右键菜单只显示宿主命令。扩展的排序、计算、合计、转置可在命令面板执行，命令在表外拒绝写入。检查本机渲染器发现最终菜单过滤掉扩展命令 ID | 右键与现用斜杠条件失败，另一条件未验证 |
| 2.2 在数量列执行升序和降序 | Typora 合成样例、无障碍树或保存结果 | 升序 2、10、空值，降序 10、2、空值，标题行保持原样 | 通过 |
| 2.3 分别在日期列和名称列执行升序 | Typora 合成样例、无障碍树或保存结果 | 日期顺序为 1 月、6 月、12 月，中文顺序为陈、李、张 | 通过 |
| 2.4 在首表执行重新计算并保存 | Typora 合成样例、无障碍树或保存结果 | `$4 = $2 * $3` 写入 30、8，空数量行写入 `#ERR`。对齐行与公式注释原样保留 | 通过 |
| 2.5 对第二个表格执行越界公式 | Typora 合成样例、无障碍树或保存结果 | 两行显示 `#ERR`，提示「Ignorance Advanced: $3 = $9：引用的列不存在」 | 通过 |
| 2.6 依次运行升降序、计算、合计、转置，分别撤销一次 | Typora 合成样例、无障碍树或保存结果 | 回到各自基线。合计显示 12 与 12；转置将列名改为行名。最终保存与实测基线经 `cmp` 比对一致 | 通过 |
| 2.7 用独立 GFM 渲染器打开保存的结果 | Pandoc HTML 输出 | Pandoc 生成两个普通 HTML 表格，含计算值 30，公式注释不可见。这是独立渲染验证 | 通过 |
| 3.1 下移「星河」 | Typora 合成样例、无障碍树或保存结果 | 与「云岭」交换，蓝色、深蓝继续跟随星河 | 通过 |
| 3.2 第一项上移、最后一项下移 | Typora 合成样例、无障碍树或保存结果 | 保存结果与基线经 `cmp` 逐字节相同 | 通过 |
| 3.3 降低、再提升「云岭」 | Typora 合成样例、无障碍树或保存结果 | 先进入星河子列表，再回到顶层，现有子项结构保留。带后代分支的同操作由纯函数测试覆盖 | 通过 |
| 3.4 把「夏季」移到第一位，撤销一次 | Typora 合成样例、无障碍树或保存结果 | 序号成为夏季 1、春季 2、秋季 3，撤销后恢复 | 通过 |
| 3.5 移动已勾选「星河」并保存 | Typora 合成样例、无障碍树或保存结果 | Markdown 中仍是 `- [x] 星河` | 通过 |
| 3.6 分别操作上移、下移、提升、降低的快捷键 | Typora 合成样例、无障碍树或保存结果 | macOS 的原组合有文本选择行为或未触发。更换为 `⌘⇧F7`、`⌘⇧F8`、`⌘⇧F9`、`⌘⇧F10` 后均触发相应动作。功能键有较低冲突风险，其他系统未实测 | 通过 |
| 4.1 选中「下周一」，按日期格式转换 | Typora 合成样例、无障碍树或保存结果 | 保存源码为 `2026-11-23` | 通过 |
| 4.2 切换为日期和星期，转换第二处 | Typora 合成样例、无障碍树或保存结果 | 保存源码为 `2026-11-23（周一）` | 通过 |
| 4.3 切换 Wiki 链接，转换第三处 | Typora 合成样例、无障碍树或保存结果 | 保存源码为 `[[2026-11-23]]` | 通过 |
| 4.4 转换「随便写的字」 | Typora 合成样例、无障碍树或保存结果 | 原文保留，提示「第 1 字符：无法识别日期」 | 通过 |
| 4.5 执行插入命令，输入「明天」并确认 | Typora 合成样例、无障碍树或保存结果 | 第二个弹窗预览 `2026-11-23`，确认后插入 | 通过 |
| 5.1 打开样例工作区首次索引 | 正式包冷启动待实测；R2 | 模拟 Worker 验证首次扫描提示。Typora 中合成验收包需在工作区打开后重新启用，随后显示索引结果 | 未验证 |
| 5.2 修改当前属性并观察查询 | Typora 已观察到更新，三次计时待测；R3 | Typora 源码模式编辑 owner 后切回预览，查询值从 owner-before 更新为 owner-beforexx，未手动重建；Typora 已自动保存 | 未验证 |
| 5.3 排除 templates/ | Typora 合成样例、无障碍树或保存结果 | 单独查询 templates/ 结果为 0，合成目录中确有排除.md | 通过 |
| 5.4 重建索引 | Typora 合成样例、无障碍树或保存结果 | 60 个文件，20 ms，复用 60 个解析记录 | 通过 |
| 5.5 两窗口同时编辑 | Typora 单窗写入后跨窗同步，双窗并发待测；R4 | 第一窗查询 owner=before-sync；第二窗改为 before-sync2 并保存，第一窗无需重建即显示新值；两个并发编辑由自动化覆盖 | 未验证 |
| 5.6 文件超过 5,000 | Typora 合成样例、无障碍树或保存结果 | 5,001 篇样例索引了 5,000 篇并显示上限提示 | 通过 |
| 6.1 打开属性查询示例 | Typora 合成样例、无障碍树或保存结果 | 汇总页表格显示星河、甲、2026-11-26、进行中 | 通过 |
| 6.2 列表、计数、分组 | Typora 合成样例、无障碍树或保存结果 | 汇总页可见分组列表和计数输出 | 通过 |
| 6.3 输错关键字或条件 | Typora 合成样例、无障碍树或保存结果 | 不支持的 filter 键显示「第 2 行第 1 列：未知关键字 filter」 | 通过 |
| 6.4 属性缺失与数组 | Typora 合成样例、无障碍树或保存结果 | contains 匹配甲、乙并排除丙，乙的 owner 为空，甲的数组显示「文档，测试」 | 通过 |
| 6.5 导出 HTML 和 PDF | Typora 合成样例、无障碍树或保存结果 | HTML 和 PDF 含可读 SVG 快照结果 | 通过 |
| 6.6 点击文件名 | Typora 合成样例、无障碍树或保存结果 | 展开星河条目显示相对路径 `项目/星河.md` | 通过 |
| 7.1 显示跨文件未完成任务 | Typora 合成样例、无障碍树或保存结果 | 未完成任务返回两条，已逾期在将到期之前，已完成未出现 | 通过 |
| 7.2 验证两种截止日期写法 | Typora 合成样例、无障碍树或保存结果 | due: 和 📅 分别显示截止 2026-11-22、2026-11-25 | 通过 |
| 7.3 排除代码块内任务 | Typora 合成样例、无障碍树或保存结果 | 围栏内伪任务未进入任务表 | 通过 |
| 7.4 悬挂本周任务并切换文档 | Typora 合成样例、无障碍树或保存结果 | 从汇总切到星河，仍显示「核对交付」及相同截止日期 | 通过 |
| 8.1 打开折线和目标线 | Typora 合成样例、无障碍树或保存结果 | 日记样例睡眠折线可见；周聚合导出 SVG 含两个点和目标 7.5 虚线，目标位于两点之上 | 通过 |
| 8.2 热力图 | Typora 合成样例、无障碍树或保存结果 | Typora 导出的运动热力图有 11-17 至 11-23 共 7 个日期格，运动值 0 和 1 的强调色透明度分别为 0.25 和 1 | 通过 |
| 8.3 周平均 | Typora 合成样例、无障碍树或保存结果 | 周一分组实际输出 2026-11-16 的 7.25、2026-11-23 的 6，与手算一致 | 通过 |
| 8.4 处理 7.5h 或缺失值 | Typora 合成样例、无障碍树或保存结果 | 7.5h 计入首周均值，缺失值未画点，摘要显示跳过 1 个文件 | 通过 |
| 8.5 深色主题、导出 PDF | Typora 合成样例、无障碍树或保存结果 | 深色实机可见蓝色折线、白色标签和 7.5 虚线；HTML、PDF 已导出可读图表 | 通过 |
| 9.1 标题词搜索 | Typora 合成样例、无障碍树或保存结果 | 在 Typora「工作区搜索」输入「星河」，首条为星河，标题「星河计划」，后续显示引用片段 | 通过 |
| 9.2 知识图谱拆词搜索 | Typora 合成样例、无障碍树或保存结果 | 输入知识图谱，结果包含「03-知识与图谱」及分开的知识、图谱片段 | 通过 |
| 9.3 短语、排除、path、tag | Typora 合成样例、无障碍树或保存结果 | 联合输入精确短语、排除词、检索路径和重要标签，返回 06-短语；path:其他/ 无匹配 | 通过 |
| 9.4 英文错拼 | Typora 合成样例、无障碍树或保存结果 | 输入 notebokk，返回 05-英文，标题 Notebook | 通过 |
| 9.5 结果显示文件名、标题和高亮片段 | Typora 合成样例、无障碍树或保存结果 | 实机查询 4873 显示文件名 4873、标题「测试笔记 4873」及蓝色高亮片段 | 通过 |
| 9.6 5,000 文件，300 ms 内响应 | Typora 外部计时含自动化开销；R5 | 5,000 篇实机输入至无障碍树首次观察为 510／663／705／555／636 ms，中位 636 ms；含输入调用和取树开销 | 未验证 |
| 10.1 打开被三篇引用的笔记 | Typora 合成样例、无障碍树或保存结果 | 星河反链列出评审、云岭、验收三篇及各自引用原句 | 通过 |
| 10.2 多种引用写法 | Typora 合成样例、无障碍树或保存结果 | 反链显示相对 Markdown 链接、带标题与别名的 Wiki 链接、裸 Wiki 链接 | 通过 |
| 10.3 未链接提及 | Typora 合成样例、无障碍树或保存结果 | 速记和总计划两条原句出现在「未链接提及」 | 通过 |
| 10.4 parent、上级和同级文件 | Typora 合成样例、无障碍树或保存结果 | 星河上级为总计划，同级为云岭 | 通过 |
| 10.5 标记断链 | Typora 合成样例、无障碍树或保存结果 | 出链的「未知子项」显示断链标记 | 通过 |
| 10.6 切换文档后刷新 | Typora 合成样例、无障碍树或保存结果 | 从汇总切换星河后显示反链、提及、上级、同级和出链 | 通过 |
| 11.1 三种卡片并检查高亮标签 | Typora 合成样例、无障碍树或保存结果 | 独立合成工作区共识别 3 张卡，逐张确认单行、独行问号和标签挖空，普通高亮和围栏内文字未计入 | 通过 |
| 11.2 到期数、翻面和评分 | Typora 合成样例、无障碍树或保存结果 | 可翻面并显示四档评分，选择「记得」后到期 3 → 2 | 通过 |
| 11.3 下次日期符合 SM-2 | Typora 合成样例、无障碍树或保存结果 | 三张首次选择「记得」后，2026-11-24 有 3 张安排，与 SM-2 首次间隔 1 天一致。后续评分间隔 6、16、1、1 天由固定日期测试覆盖 | 通过 |
| 11.4 复习后笔记内容保持原样 | Typora 合成样例、无障碍树或保存结果 | 三次评分后 cmp 对照原样例无差异 | 通过 |
| 11.5 问题修改后变成新卡片 | Typora 合成样例、无障碍树或保存结果 | 只改首张问题后重建，改题显示为今日到期新卡，次日旧排期从 3 张降到 2 张 | 通过 |
| 11.6 两个窗口同时评分 | 双窗同步已有 Typora 证据，同卡同时提交待测；R4 | 两个宿主窗口均显示同一到期卡；第二窗评分后，第一窗也显示到期 0、已复习 4。重复评分拒绝已有模拟回归 | 未验证 |

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
  duration_ms: 1.464458
  type: 'test'
  ...
# Subtest: pie rows become named slices
ok 2 - pie rows become named slices
  ---
  duration_ms: 0.368042
  type: 'test'
  ...
# Subtest: bad rows and empty fences fail with a readable message
ok 3 - bad rows and empty fences fail with a readable message
  ---
  duration_ms: 0.599208
  type: 'test'
  ...
# Subtest: bar and line draw one shape per data point, coloured from the theme accent
ok 4 - bar and line draw one shape per data point, coloured from the theme accent
  ---
  duration_ms: 1.523875
  type: 'test'
  ...
# Subtest: pie draws one slice per item with percentage labels
ok 5 - pie draws one slice per item with percentage labels
  ---
  duration_ms: 0.260125
  type: 'test'
  ...
# Subtest: titles are escaped and each bar series gets its own slot
ok 6 - titles are escaped and each bar series gets its own slot
  ---
  duration_ms: 0.182542
  type: 'test'
  ...
# Subtest: mixed pie and empty series fail with a readable message
ok 7 - mixed pie and empty series fail with a readable message
  ---
  duration_ms: 0.130125
  type: 'test'
  ...
# Subtest: flowchart parses shapes, chains, labels and edge styles
ok 8 - flowchart parses shapes, chains, labels and edge styles
  ---
  duration_ms: 1.38275
  type: 'test'
  ...
# Subtest: flowchart draws a shape per node, an arrow per edge, and keeps back edges inside the canvas
ok 9 - flowchart draws a shape per node, an arrow per edge, and keeps back edges inside the canvas
  ---
  duration_ms: 2.53825
  type: 'test'
  ...
# Subtest: other Mermaid diagrams are rejected with a readable message
ok 10 - other Mermaid diagrams are rejected with a readable message
  ---
  duration_ms: 0.906542
  type: 'test'
  ...
# Subtest: subgraphs parse with titles, nesting and members
ok 11 - subgraphs parse with titles, nesting and members
  ---
  duration_ms: 0.633708
  type: 'test'
  ...
# Subtest: a node mentioned outside first still belongs to the subgraph that lists it
ok 12 - a node mentioned outside first still belongs to the subgraph that lists it
  ---
  duration_ms: 0.142709
  type: 'test'
  ...
# Subtest: subgraph boxes enclose their members and keep other nodes outside
ok 13 - subgraph boxes enclose their members and keep other nodes outside
  ---
  duration_ms: 0.708791
  type: 'test'
  ...
# Subtest: unbalanced subgraphs, edges to a subgraph and overlapping layouts fail readably
ok 14 - unbalanced subgraphs, edges to a subgraph and overlapping layouts fail readably
  ---
  duration_ms: 1.4585
  type: 'test'
  ...
# Subtest: an unknown chart type draws bars, as the official Charts extension does
ok 15 - an unknown chart type draws bars, as the official Charts extension does
  ---
  duration_ms: 0.300291
  type: 'test'
  ...
# Subtest: detects one-sided accent bars
ok 16 - detects one-sided accent bars
  ---
  duration_ms: 0.6555
  type: 'test'
  ...
# Subtest: allows hairlines and resets
ok 17 - allows hairlines and resets
  ---
  duration_ms: 0.061166
  type: 'test'
  ...
# Subtest: theme and slides contain no one-sided accent bar
ok 18 - theme and slides contain no one-sided accent bar
  ---
  duration_ms: 2.156291
  type: 'test'
  ...
# Subtest: spaces between CJK and Latin or digits
ok 19 - spaces between CJK and Latin or digits
  ---
  duration_ms: 0.582125
  type: 'test'
  ...
# Subtest: idempotent
ok 20 - idempotent
  ---
  duration_ms: 0.170708
  type: 'test'
  ...
# Subtest: leaves inline code, math, URLs and HTML alone
ok 21 - leaves inline code, math, URLs and HTML alone
  ---
  duration_ms: 0.097375
  type: 'test'
  ...
# Subtest: spaces a link label but keeps its URL
ok 22 - spaces a link label but keeps its URL
  ---
  duration_ms: 1.10825
  type: 'test'
  ...
# Subtest: leaves code fences, math blocks and front matter alone
ok 23 - leaves code fences, math blocks and front matter alone
  ---
  duration_ms: 0.319667
  type: 'test'
  ...
# Subtest: a shorter fence marker does not close a longer fence
ok 24 - a shorter fence marker does not close a longer fence
  ---
  duration_ms: 0.118291
  type: 'test'
  ...
# Subtest: every palette defines hex diagram colors for light and dark
ok 25 - every palette defines hex diagram colors for light and dark
  ---
  duration_ms: 0.766208
  type: 'test'
  ...
# Subtest: theme.css feeds the diagram colors to the renderer without color-mix
ok 26 - theme.css feeds the diagram colors to the renderer without color-mix
  ---
  duration_ms: 0.659583
  type: 'test'
  ...
# Subtest: sequence: participants, labels, messages and activation parse
ok 27 - sequence: participants, labels, messages and activation parse
  ---
  duration_ms: 1.838459
  type: 'test'
  ...
# Subtest: sequence: draws lifelines, arrows, frames, notes and activation bars
ok 28 - sequence: draws lifelines, arrows, frames, notes and activation bars
  ---
  duration_ms: 0.81075
  type: 'test'
  ...
# Subtest: sequence: bad syntax and unbalanced blocks fail readably
ok 29 - sequence: bad syntax and unbalanced blocks fail readably
  ---
  duration_ms: 0.311166
  type: 'test'
  ...
# Subtest: gantt: dates, durations, after and tags
ok 30 - gantt: dates, durations, after and tags
  ---
  duration_ms: 1.424208
  type: 'test'
  ...
# Subtest: gantt: a task with only a duration starts when the previous one ends
ok 31 - gantt: a task with only a duration starts when the previous one ends
  ---
  duration_ms: 0.485292
  type: 'test'
  ...
# Subtest: gantt: draws one bar per task and a diamond per milestone
ok 32 - gantt: draws one bar per task and a diamond per milestone
  ---
  duration_ms: 1.295542
  type: 'test'
  ...
# Subtest: gantt: unsupported formats and unknown ids fail readably
ok 33 - gantt: unsupported formats and unknown ids fail readably
  ---
  duration_ms: 0.112166
  type: 'test'
  ...
# Subtest: pie: title, showData and quoted or bare labels
ok 34 - pie: title, showData and quoted or bare labels
  ---
  duration_ms: 2.072
  type: 'test'
  ...
# Subtest: dispatcher: routes by diagram type and rejects the rest
ok 35 - dispatcher: routes by diagram type and rejects the rest
  ---
  duration_ms: 4.334375
  type: 'test'
  ...
# Subtest: exported outline sidebar hides heading marks with a zero-width font
ok 36 - exported outline sidebar hides heading marks with a zero-width font
  ---
  duration_ms: 0.839708
  type: 'test'
  ...
# Subtest: exported outline sidebar overrides the exporter's level indents
ok 37 - exported outline sidebar overrides the exporter's level indents
  ---
  duration_ms: 0.174333
  type: 'test'
  ...
# Subtest: formats headings, lists, prose and whitespace in one idempotent pass
ok 38 - formats headings, lists, prose and whitespace in one idempotent pass
  ---
  duration_ms: 3.435416
  type: 'test'
  ...
# Subtest: preserves protected content and its CRLF line endings
ok 39 - preserves protected content and its CRLF line endings
  ---
  duration_ms: 0.471625
  type: 'test'
  ...
# Subtest: supports independent settings and preserves nested list levels
ok 40 - supports independent settings and preserves nested list levels
  ---
  duration_ms: 0.160709
  type: 'test'
  ...
# Subtest: keeps inline literals, decimals and reference destinations while styling prose
ok 41 - keeps inline literals, decimals and reference destinations while styling prose
  ---
  duration_ms: 0.088625
  type: 'test'
  ...
# Subtest: keeps fenced code that starts on a list item and preserves ordered nesting
ok 42 - keeps fenced code that starts on a list item and preserves ordered nesting
  ---
  duration_ms: 0.080166
  type: 'test'
  ...
# Subtest: preserves multi-line inline code and keeps blockquotes as blockquotes
ok 43 - preserves multi-line inline code and keeps blockquotes as blockquotes
  ---
  duration_ms: 0.060375
  type: 'test'
  ...
# Subtest: normalizing list indent keeps wrapped continuations in their item
ok 44 - normalizing list indent keeps wrapped continuations in their item
  ---
  duration_ms: 0.607584
  type: 'test'
  ...
# Subtest: registered formatter reads current settings and preserves the spacing command
ok 45 - registered formatter reads current settings and preserves the spacing command
  ---
  duration_ms: 2.938416
  type: 'test'
  ...
# Subtest: preserves footnote references and definitions
ok 46 - preserves footnote references and definitions
  ---
  duration_ms: 0.744084
  type: 'test'
  ...
# Subtest: preserves English punctuation inside a mixed-language line
ok 47 - preserves English punctuation inside a mixed-language line
  ---
  duration_ms: 0.723375
  type: 'test'
  ...
# Subtest: localizes punctuation after the English sentence ends
ok 48 - localizes punctuation after the English sentence ends
  ---
  duration_ms: 0.234417
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 中文(版本2.5),继续
ok 49 - formats punctuation per acceptance spec: 中文(版本2.5),继续
  ---
  duration_ms: 0.1735
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 中文abc, 继续
ok 50 - formats punctuation per acceptance spec: 中文abc, 继续
  ---
  duration_ms: 0.076791
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 正文Typora, 版本2!
ok 51 - formats punctuation per acceptance spec: 正文Typora, 版本2!
  ---
  duration_ms: 0.078458
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 价格是3,000元,请确认!
ok 52 - formats punctuation per acceptance spec: 价格是3,000元,请确认!
  ---
  duration_ms: 0.068667
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 你好, world
ok 53 - formats punctuation per acceptance spec: 你好, world
  ---
  duration_ms: 0.064084
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: Hello, 世界
ok 54 - formats punctuation per acceptance spec: Hello, 世界
  ---
  duration_ms: 0.069416
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: He said: hello, world. 这是中文。
ok 55 - formats punctuation per acceptance spec: He said: hello, world. 这是中文。
  ---
  duration_ms: 0.075333
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: The cat sat. 然后它走了.
ok 56 - formats punctuation per acceptance spec: The cat sat. 然后它走了.
  ---
  duration_ms: 0.074292
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: f(x) = g(y), see docs.
ok 57 - formats punctuation per acceptance spec: f(x) = g(y), see docs.
  ---
  duration_ms: 0.2785
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 函数(foo)与(bar)
ok 58 - formats punctuation per acceptance spec: 函数(foo)与(bar)
  ---
  duration_ms: 0.075459
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 正文[^1]\\n\\n[^1]: 说明,test
ok 59 - formats punctuation per acceptance spec: 正文[^1]\\n\\n[^1]: 说明,test
  ---
  duration_ms: 0.090875
  type: 'test'
  ...
# Subtest: preserves balanced Markdown link destinations with nested parentheses
ok 60 - preserves balanced Markdown link destinations with nested parentheses
  ---
  duration_ms: 0.154542
  type: 'test'
  ...
# Subtest: parses 明天 with the requested week start
ok 61 - parses 明天 with the requested week start
  ---
  duration_ms: 3.92475
  type: 'test'
  ...
# Subtest: parses 后天 with the requested week start
ok 62 - parses 后天 with the requested week start
  ---
  duration_ms: 0.209708
  type: 'test'
  ...
# Subtest: parses 下周一 with the requested week start
ok 63 - parses 下周一 with the requested week start
  ---
  duration_ms: 0.502167
  type: 'test'
  ...
# Subtest: parses 本周五 with the requested week start
ok 64 - parses 本周五 with the requested week start
  ---
  duration_ms: 0.975542
  type: 'test'
  ...
# Subtest: parses 本周五 with the requested week start
ok 65 - parses 本周五 with the requested week start
  ---
  duration_ms: 0.297625
  type: 'test'
  ...
# Subtest: parses 三天后 with the requested week start
ok 66 - parses 三天后 with the requested week start
  ---
  duration_ms: 0.192083
  type: 'test'
  ...
# Subtest: parses 两周后 with the requested week start
ok 67 - parses 两周后 with the requested week start
  ---
  duration_ms: 0.214334
  type: 'test'
  ...
# Subtest: parses 下个月 5 号 with the requested week start
ok 68 - parses 下个月 5 号 with the requested week start
  ---
  duration_ms: 0.220459
  type: 'test'
  ...
# Subtest: parses 12 月 1 日 with the requested week start
ok 69 - parses 12 月 1 日 with the requested week start
  ---
  duration_ms: 0.7325
  type: 'test'
  ...
# Subtest: parses 下个月 31 号 with the requested week start
ok 70 - parses 下个月 31 号 with the requested week start
  ---
  duration_ms: 0.333459
  type: 'test'
  ...
# Subtest: parses tomorrow with the requested week start
ok 71 - parses tomorrow with the requested week start
  ---
  duration_ms: 0.110542
  type: 'test'
  ...
# Subtest: unknown and invalid dates have an error position
ok 72 - unknown and invalid dates have an error position
  ---
  duration_ms: 0.283291
  type: 'test'
  ...
# Subtest: clamps relative month arithmetic and crosses a year boundary
ok 73 - clamps relative month arithmetic and crosses a year boundary
  ---
  duration_ms: 0.16375
  type: 'test'
  ...
# Subtest: formats ISO, weekday and wiki dates
ok 74 - formats ISO, weekday and wiki dates
  ---
  duration_ms: 0.043875
  type: 'test'
  ...
# Subtest: “周末”取不早于今天的最近一个周六，不受一周起点影响
ok 75 - “周末”取不早于今天的最近一个周六，不受一周起点影响
  ---
  duration_ms: 0.066708
  type: 'test'
  ...
# Subtest: “周末”跨月跨年，本周末和下周末保持原有含义
ok 76 - “周末”跨月跨年，本周末和下周末保持原有含义
  ---
  duration_ms: 0.036041
  type: 'test'
  ...
# Subtest: swaps a complete task branch with its next sibling
ok 77 - swaps a complete task branch with its next sibling
  ---
  duration_ms: 3.70775
  type: 'test'
  ...
# Subtest: upper and lower boundaries are no-ops
ok 78 - upper and lower boundaries are no-ops
  ---
  duration_ms: 0.406666
  type: 'test'
  ...
# Subtest: promotes and demotes a subtree while preserving relative indent
ok 79 - promotes and demotes a subtree while preserving relative indent
  ---
  duration_ms: 0.3135
  type: 'test'
  ...
# Subtest: renumbers ordered siblings and protects code and document boundaries
ok 80 - renumbers ordered siblings and protects code and document boundaries
  ---
  duration_ms: 0.534958
  type: 'test'
  ...
# Subtest: converts indentation to list levels and list levels to headings
ok 81 - converts indentation to list levels and list levels to headings
  ---
  duration_ms: 0.3805
  type: 'test'
  ...
# Subtest: list probes cover protected content, boundaries, and deep branches
ok 82 - list probes cover protected content, boundaries, and deep branches
  ---
  duration_ms: 0.84075
  type: 'test'
  ...
# Subtest: uses the host list range even when copied Markdown loses all or some markers
ok 83 - uses the host list range even when copied Markdown loses all or some markers
  ---
  duration_ms: 2.753333
  type: 'test'
  ...
# Subtest: calculates row expressions and aggregate ranges referencing calculated cells
ok 84 - calculates row expressions and aggregate ranges referencing calculated cells
  ---
  duration_ms: 2.5255
  type: 'test'
  ...
# Subtest: marks invalid references and circular dependencies with errors
ok 85 - marks invalid references and circular dependencies with errors
  ---
  duration_ms: 0.282958
  type: 'test'
  ...
# Subtest: reports the error position for invalid expressions and supports operator precedence
ok 86 - reports the error position for invalid expressions and supports operator precedence
  ---
  duration_ms: 0.239417
  type: 'test'
  ...
# Subtest: aggregates values and resolves absolute and last-row references
ok 87 - aggregates values and resolves absolute and last-row references
  ---
  duration_ms: 0.14825
  type: 'test'
  ...
# Subtest: sorts numbers in both directions with blanks last and stable ties
ok 88 - sorts numbers in both directions with blanks last and stable ties
  ---
  duration_ms: 1.883958
  type: 'test'
  ...
# Subtest: sorts calendar dates and Chinese text
ok 89 - sorts calendar dates and Chinese text
  ---
  duration_ms: 1.122417
  type: 'test'
  ...
# Subtest: parses escaped pipes, code, CRLF and the original alignment row
ok 90 - parses escaped pipes, code, CRLF and the original alignment row
  ---
  duration_ms: 0.4635
  type: 'test'
  ...
# Subtest: accepts header-only tables and rejects non-table blocks
ok 91 - accepts header-only tables and rejects non-table blocks
  ---
  duration_ms: 0.454292
  type: 'test'
  ...
# Subtest: preserves protected Markdown around the target table through a command
ok 92 - preserves protected Markdown around the target table through a command
  ---
  duration_ms: 4.234792
  type: 'test'
  ...
# Subtest: appends totals and transposes while preserving the original table
ok 93 - appends totals and transposes while preserving the original table
  ---
  duration_ms: 0.202167
  type: 'test'
  ...
# Subtest: converts quoted CSV and reports malformed input
ok 94 - converts quoted CSV and reports malformed input
  ---
  duration_ms: 0.432667
  type: 'test'
  ...
# Subtest: locates a table without block text and uses the selected cell's sibling index
ok 95 - locates a table without block text and uses the selected cell's sibling index
  ---
  duration_ms: 1.125333
  type: 'test'
  ...
# Subtest: table commands leave the document untouched when the caret is outside a table
ok 96 - table commands leave the document untouched when the caret is outside a table
  ---
  duration_ms: 0.417042
  type: 'test'
  ...
# Subtest: property-query：从激活到查询代码块出结果
ok 97 - property-query：从激活到查询代码块出结果
  ---
  duration_ms: 128.611834
  type: 'test'
  ...
# Subtest: task-rollup：任务代码块只列出未完成任务
ok 98 - task-rollup：任务代码块只列出未完成任务
  ---
  duration_ms: 114.080417
  type: 'test'
  ...
# Subtest: value-track：图表代码块画出两篇日记的点并跳过没有字段的笔记
ok 99 - value-track：图表代码块画出两篇日记的点并跳过没有字段的笔记
  ---
  duration_ms: 108.036667
  type: 'test'
  ...
# Subtest: backlinks：当前笔记的侧栏数据包含反向链接
ok 100 - backlinks：当前笔记的侧栏数据包含反向链接
  ---
  duration_ms: 56.798584
  type: 'test'
  ...
# Subtest: vault-search：搜索请求得到带高亮片段的结果，不写文档
ok 101 - vault-search：搜索请求得到带高亮片段的结果，不写文档
  ---
  duration_ms: 214.537334
  type: 'test'
  ...
# Subtest: flashcards：重复评分只计一次，重建索引复用缓存且不写文档
ok 102 - flashcards：重复评分只计一次，重建索引复用缓存且不写文档
  ---
  duration_ms: 474.488834
  type: 'test'
  ...
# Subtest: every supported extension maps to a language with rules
ok 103 - every supported extension maps to a language with rules
  ---
  duration_ms: 11.018209
  type: 'test'
  ...
# Subtest: highlighting never changes the text, so it can sit under the textarea
ok 104 - highlighting never changes the text, so it can sit under the textarea
  ---
  duration_ms: 2.758292
  type: 'test'
  ...
# Subtest: unknown extensions come back escaped and unstyled
ok 105 - unknown extensions come back escaped and unstyled
  ---
  duration_ms: 0.072875
  type: 'test'
  ...
# Subtest: javascript colours keywords, calls, strings, comments, numbers and types
ok 106 - javascript colours keywords, calls, strings, comments, numbers and types
  ---
  duration_ms: 0.538792
  type: 'test'
  ...
# Subtest: a keyword followed by a parenthesis is a keyword, not a call
ok 107 - a keyword followed by a parenthesis is a keyword, not a call
  ---
  duration_ms: 0.067
  type: 'test'
  ...
# Subtest: typescript adds type keywords that plain javascript leaves alone
ok 108 - typescript adds type keywords that plain javascript leaves alone
  ---
  duration_ms: 0.143041
  type: 'test'
  ...
# Subtest: python docstrings are strings and decorators are attributes
ok 109 - python docstrings are strings and decorators are attributes
  ---
  duration_ms: 0.067084
  type: 'test'
  ...
# Subtest: rust lifetimes are not mistaken for character literals
ok 110 - rust lifetimes are not mistaken for character literals
  ---
  duration_ms: 0.045792
  type: 'test'
  ...
# Subtest: shell variables and sql keywords in any case
ok 111 - shell variables and sql keywords in any case
  ---
  duration_ms: 0.212417
  type: 'test'
  ...
# Subtest: ini sections, keys and comments
ok 112 - ini sections, keys and comments
  ---
  duration_ms: 0.278375
  type: 'test'
  ...
# Subtest: css colours properties, values, selectors and at-rules
ok 113 - css colours properties, values, selectors and at-rules
  ---
  duration_ms: 0.124041
  type: 'test'
  ...
# Subtest: html highlights style and script bodies with their own rules
ok 114 - html highlights style and script bodies with their own rules
  ---
  duration_ms: 0.713708
  type: 'test'
  ...
# Subtest: unterminated strings and comments do not hang or lose text
ok 115 - unterminated strings and comments do not hang or lose text
  ---
  duration_ms: 0.111042
  type: 'test'
  ...
# Subtest: every inline rule pattern compiles
ok 116 - every inline rule pattern compiles
  ---
  duration_ms: 0.94925
  type: 'test'
  ...
# Subtest: a badge shows only label and value; the wrapper is hidden
ok 117 - a badge shows only label and value; the wrapper is hidden
  ---
  duration_ms: 2.838709
  type: 'test'
  ...
# Subtest: spoiler, ruby and crumb keep their content and hide the wrapper
ok 118 - spoiler, ruby and crumb keep their content and hide the wrapper
  ---
  duration_ms: 2.924041
  type: 'test'
  ...
# Subtest: incomplete syntax is left visible
ok 119 - incomplete syntax is left visible
  ---
  duration_ms: 0.816834
  type: 'test'
  ...
# Subtest: two badges on one line do not swallow each other
ok 120 - two badges on one line do not swallow each other
  ---
  duration_ms: 0.528792
  type: 'test'
  ...
# Subtest: a badge with a single value and the amber and gray colors are supported
ok 121 - a badge with a single value and the amber and gray colors are supported
  ---
  duration_ms: 0.650416
  type: 'test'
  ...
# Subtest: candidates share terms with the target, skip itself and linked notes, and respect the limit
ok 122 - candidates share terms with the target, skip itself and linked notes, and respect the limit
  ---
  duration_ms: 1.47275
  type: 'test'
  ...
# Subtest: similar names for a broken link rank by character overlap
ok 123 - similar names for a broken link rank by character overlap
  ---
  duration_ms: 0.616667
  type: 'test'
  ...
# Subtest: reply parsing keeps only allowed paths, trims text and survives fenced or chatty output
ok 124 - reply parsing keeps only allowed paths, trims text and survives fenced or chatty output
  ---
  duration_ms: 1.397334
  type: 'test'
  ...
# Subtest: reply parsing rejects text without a JSON object
ok 125 - reply parsing rejects text without a JSON object
  ---
  duration_ms: 0.253958
  type: 'test'
  ...
# Subtest: a note request sends a truncated body and candidate lines only, and stores a sanitised result
ok 126 - a note request sends a truncated body and candidate lines only, and stores a sanitised result
  ---
  duration_ms: 0.719584
  type: 'test'
  ...
# Subtest: instructions inside a note cannot make the result name a path outside the candidates
ok 127 - instructions inside a note cannot make the result name a path outside the candidates
  ---
  duration_ms: 1.956125
  type: 'test'
  ...
# Subtest: a broken-link request lists likely notes from similar names
ok 128 - a broken-link request lists likely notes from similar names
  ---
  duration_ms: 0.544208
  type: 'test'
  ...
# Subtest: the switch in settings, model readiness and failures are reported without calling or crashing
ok 129 - the switch in settings, model readiness and failures are reported without calling or crashing
  ---
  duration_ms: 0.917584
  type: 'test'
  ...
# Subtest: a stale request is dropped and a missing ai permission is reported
ok 130 - a stale request is dropped and a missing ai permission is reported
  ---
  duration_ms: 0.739417
  type: 'test'
  ...
# Subtest: in a large vault, terms found in most notes do not count as shared
ok 131 - in a large vault, terms found in most notes do not count as shared
  ---
  duration_ms: 1.209458
  type: 'test'
  ...
# Subtest: empty or blank query yields no filter
ok 132 - empty or blank query yields no filter
  ---
  duration_ms: 0.5225
  type: 'test'
  ...
# Subtest: plain words match the note name ignoring case and width
ok 133 - plain words match the note name ignoring case and width
  ---
  duration_ms: 0.165541
  type: 'test'
  ...
# Subtest: \#tag matches tags by containment and path: matches the path
ok 134 - \#tag matches tags by containment and path: matches the path
  ---
  duration_ms: 0.068416
  type: 'test'
  ...
# Subtest: several terms must all match
ok 135 - several terms must all match
  ---
  duration_ms: 0.29925
  type: 'test'
  ...
# Subtest: broken nodes have no path or tags so only name terms can match
ok 136 - broken nodes have no path or tags so only name terms can match
  ---
  duration_ms: 0.079667
  type: 'test'
  ...
# Subtest: a lone \# or path: prefix is ignored instead of matching everything or nothing
ok 137 - a lone \# or path: prefix is ignored instead of matching everything or nothing
  ---
  duration_ms: 0.048166
  type: 'test'
  ...
# Subtest: arrow navigation picks the nearest node in the pressed direction
ok 138 - arrow navigation picks the nearest node in the pressed direction
  ---
  duration_ms: 0.168292
  type: 'test'
  ...
# Subtest: arrow navigation ignores nodes outside the cone and stays put at the edge
ok 139 - arrow navigation ignores nodes outside the cone and stays put at the edge
  ---
  duration_ms: 0.048125
  type: 'test'
  ...
# Subtest: one rebuild answers every pending refresh request and clears them
ok 140 - one rebuild answers every pending refresh request and clears them
  ---
  duration_ms: 4.604125
  type: 'test'
  ...
# Subtest: a stale request is dropped without rebuilding
ok 141 - a stale request is dropped without rebuilding
  ---
  duration_ms: 0.700583
  type: 'test'
  ...
# Subtest: a failed rebuild is reported in the response and the request is still cleared
ok 142 - a failed rebuild is reported in the response and the request is still cleared
  ---
  duration_ms: 0.407666
  type: 'test'
  ...
# Subtest: polling with no request does nothing
ok 143 - polling with no request does nothing
  ---
  duration_ms: 0.07975
  type: 'test'
  ...
# Subtest: one node per note and one edge per linked pair, no self loops
ok 144 - one node per note and one edge per linked pair, no self loops
  ---
  duration_ms: 1.505916
  type: 'test'
  ...
# Subtest: broken links become dashed nodes named by the link text
ok 145 - broken links become dashed nodes named by the link text
  ---
  duration_ms: 0.313417
  type: 'test'
  ...
# Subtest: same-named notes stay separate and resolve to the nearest one
ok 146 - same-named notes stay separate and resolve to the nearest one
  ---
  duration_ms: 0.176458
  type: 'test'
  ...
# Subtest: local graph keeps the note and its neighbours up to the given depth
ok 147 - local graph keeps the note and its neighbours up to the given depth
  ---
  duration_ms: 0.365
  type: 'test'
  ...
# Subtest: local graph of an unknown path is empty
ok 148 - local graph of an unknown path is empty
  ---
  duration_ms: 0.164625
  type: 'test'
  ...
# Subtest: layout is deterministic, finite and inside the canvas
ok 149 - layout is deterministic, finite and inside the canvas
  ---
  duration_ms: 7.888042
  type: 'test'
  ...
# Subtest: layout handles empty and single-node graphs
ok 150 - layout handles empty and single-node graphs
  ---
  duration_ms: 0.102667
  type: 'test'
  ...
# Subtest: layout of 2000 linked notes finishes within 5 seconds
ok 151 - layout of 2000 linked notes finishes within 5 seconds
  ---
  duration_ms: 329.492542
  type: 'test'
  ...
# Subtest: graph model reuses the layout until the link structure changes
ok 152 - graph model reuses the layout until the link structure changes
  ---
  duration_ms: 17.449959
  type: 'test'
  ...
# Subtest: graph model drops the global graph above the node limit and keeps the local one
ok 153 - graph model drops the global graph above the node limit and keeps the local one
  ---
  duration_ms: 31.378125
  type: 'test'
  ...
# Subtest: parent and up properties become parent edges, links stay link edges
ok 154 - parent and up properties become parent edges, links stay link edges
  ---
  duration_ms: 0.161459
  type: 'test'
  ...
# Subtest: a pair linked and related by parent keeps both edges
ok 155 - a pair linked and related by parent keeps both edges
  ---
  duration_ms: 0.343458
  type: 'test'
  ...
# Subtest: nodes carry their top-level folder as group, root notes get an empty group
ok 156 - nodes carry their top-level folder as group, root notes get an empty group
  ---
  duration_ms: 0.048417
  type: 'test'
  ...
# Subtest: note info summarises tasks, cards, tags and scalar properties
ok 157 - note info summarises tasks, cards, tags and scalar properties
  ---
  duration_ms: 0.104208
  type: 'test'
  ...
# Subtest: note info truncates long values and ignores structure-only keys
ok 158 - note info truncates long values and ignores structure-only keys
  ---
  duration_ms: 0.352833
  type: 'test'
  ...
# Subtest: graph model exposes info for every note and no info for broken nodes
ok 159 - graph model exposes info for every note and no info for broken nodes
  ---
  duration_ms: 3.795583
  type: 'test'
  ...
# Subtest: isolated notes sit in a band below every linked note and never overlap
ok 160 - isolated notes sit in a band below every linked note and never overlap
  ---
  duration_ms: 1.541667
  type: 'test'
  ...
# Subtest: a graph with no links at all is laid out as a grid inside the canvas
ok 161 - a graph with no links at all is laid out as a grid inside the canvas
  ---
  duration_ms: 0.123542
  type: 'test'
  ...
# Subtest: a few hundred isolated notes still fit in the canvas without overlapping
ok 162 - a few hundred isolated notes still fit in the canvas without overlapping
  ---
  duration_ms: 0.521083
  type: 'test'
  ...
# Subtest: formats headings, lists, prose and whitespace in one idempotent pass
ok 163 - formats headings, lists, prose and whitespace in one idempotent pass
  ---
  duration_ms: 3.375875
  type: 'test'
  ...
# Subtest: preserves protected content and its CRLF line endings
ok 164 - preserves protected content and its CRLF line endings
  ---
  duration_ms: 0.483084
  type: 'test'
  ...
# Subtest: supports independent settings and preserves nested list levels
ok 165 - supports independent settings and preserves nested list levels
  ---
  duration_ms: 0.162166
  type: 'test'
  ...
# Subtest: keeps inline literals, decimals and reference destinations while styling prose
ok 166 - keeps inline literals, decimals and reference destinations while styling prose
  ---
  duration_ms: 0.0905
  type: 'test'
  ...
# Subtest: keeps fenced code that starts on a list item and preserves ordered nesting
ok 167 - keeps fenced code that starts on a list item and preserves ordered nesting
  ---
  duration_ms: 0.079459
  type: 'test'
  ...
# Subtest: preserves multi-line inline code and keeps blockquotes as blockquotes
ok 168 - preserves multi-line inline code and keeps blockquotes as blockquotes
  ---
  duration_ms: 0.057667
  type: 'test'
  ...
# Subtest: normalizing list indent keeps wrapped continuations in their item
ok 169 - normalizing list indent keeps wrapped continuations in their item
  ---
  duration_ms: 0.055541
  type: 'test'
  ...
# Subtest: registered formatter reads current settings and preserves the spacing command
ok 170 - registered formatter reads current settings and preserves the spacing command
  ---
  duration_ms: 12.583542
  type: 'test'
  ...
# Subtest: preserves footnote references and definitions
ok 171 - preserves footnote references and definitions
  ---
  duration_ms: 0.2805
  type: 'test'
  ...
# Subtest: preserves English punctuation inside a mixed-language line
ok 172 - preserves English punctuation inside a mixed-language line
  ---
  duration_ms: 0.199375
  type: 'test'
  ...
# Subtest: localizes punctuation after the English sentence ends
ok 173 - localizes punctuation after the English sentence ends
  ---
  duration_ms: 0.050917
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 中文(版本2.5),继续
ok 174 - formats punctuation per acceptance spec: 中文(版本2.5),继续
  ---
  duration_ms: 0.058167
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 中文abc, 继续
ok 175 - formats punctuation per acceptance spec: 中文abc, 继续
  ---
  duration_ms: 0.036209
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 正文Typora, 版本2!
ok 176 - formats punctuation per acceptance spec: 正文Typora, 版本2!
  ---
  duration_ms: 0.034708
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 价格是3,000元,请确认!
ok 177 - formats punctuation per acceptance spec: 价格是3,000元,请确认!
  ---
  duration_ms: 0.041708
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 你好, world
ok 178 - formats punctuation per acceptance spec: 你好, world
  ---
  duration_ms: 0.031167
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: Hello, 世界
ok 179 - formats punctuation per acceptance spec: Hello, 世界
  ---
  duration_ms: 0.030833
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: He said: hello, world. 这是中文。
ok 180 - formats punctuation per acceptance spec: He said: hello, world. 这是中文。
  ---
  duration_ms: 0.039208
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: The cat sat. 然后它走了.
ok 181 - formats punctuation per acceptance spec: The cat sat. 然后它走了.
  ---
  duration_ms: 0.035167
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: f(x) = g(y), see docs.
ok 182 - formats punctuation per acceptance spec: f(x) = g(y), see docs.
  ---
  duration_ms: 0.152792
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 函数(foo)与(bar)
ok 183 - formats punctuation per acceptance spec: 函数(foo)与(bar)
  ---
  duration_ms: 0.40325
  type: 'test'
  ...
# Subtest: formats punctuation per acceptance spec: 正文[^1]\\n\\n[^1]: 说明,test
ok 184 - formats punctuation per acceptance spec: 正文[^1]\\n\\n[^1]: 说明,test
  ---
  duration_ms: 0.04825
  type: 'test'
  ...
# Subtest: preserves balanced Markdown link destinations with nested parentheses
ok 185 - preserves balanced Markdown link destinations with nested parentheses
  ---
  duration_ms: 0.0675
  type: 'test'
  ...
# Subtest: parses 明天 with the requested week start
ok 186 - parses 明天 with the requested week start
  ---
  duration_ms: 2.784417
  type: 'test'
  ...
# Subtest: parses 后天 with the requested week start
ok 187 - parses 后天 with the requested week start
  ---
  duration_ms: 0.156875
  type: 'test'
  ...
# Subtest: parses 下周一 with the requested week start
ok 188 - parses 下周一 with the requested week start
  ---
  duration_ms: 0.114541
  type: 'test'
  ...
# Subtest: parses 本周五 with the requested week start
ok 189 - parses 本周五 with the requested week start
  ---
  duration_ms: 0.101625
  type: 'test'
  ...
# Subtest: parses 本周五 with the requested week start
ok 190 - parses 本周五 with the requested week start
  ---
  duration_ms: 0.094416
  type: 'test'
  ...
# Subtest: parses 三天后 with the requested week start
ok 191 - parses 三天后 with the requested week start
  ---
  duration_ms: 0.068958
  type: 'test'
  ...
# Subtest: parses 两周后 with the requested week start
ok 192 - parses 两周后 with the requested week start
  ---
  duration_ms: 0.089666
  type: 'test'
  ...
# Subtest: parses 下个月 5 号 with the requested week start
ok 193 - parses 下个月 5 号 with the requested week start
  ---
  duration_ms: 0.091583
  type: 'test'
  ...
# Subtest: parses 12 月 1 日 with the requested week start
ok 194 - parses 12 月 1 日 with the requested week start
  ---
  duration_ms: 0.324208
  type: 'test'
  ...
# Subtest: parses 下个月 31 号 with the requested week start
ok 195 - parses 下个月 31 号 with the requested week start
  ---
  duration_ms: 0.260167
  type: 'test'
  ...
# Subtest: parses tomorrow with the requested week start
ok 196 - parses tomorrow with the requested week start
  ---
  duration_ms: 0.169
  type: 'test'
  ...
# Subtest: unknown and invalid dates have an error position
ok 197 - unknown and invalid dates have an error position
  ---
  duration_ms: 0.308959
  type: 'test'
  ...
# Subtest: clamps relative month arithmetic and crosses a year boundary
ok 198 - clamps relative month arithmetic and crosses a year boundary
  ---
  duration_ms: 0.224209
  type: 'test'
  ...
# Subtest: formats ISO, weekday and wiki dates
ok 199 - formats ISO, weekday and wiki dates
  ---
  duration_ms: 0.047334
  type: 'test'
  ...
# Subtest: 列字母与序号互转
ok 200 - 列字母与序号互转
  ---
  duration_ms: 0.44425
  type: 'test'
  ...
# Subtest: XML 实体还原
ok 201 - XML 实体还原
  ---
  duration_ms: 0.163083
  type: 'test'
  ...
# Subtest: 共享字符串合并富文本片段
ok 202 - 共享字符串合并富文本片段
  ---
  duration_ms: 0.487916
  type: 'test'
  ...
# Subtest: 工作表解析：共享字符串、数字、布尔、内联字符串与稀疏单元格
ok 203 - 工作表解析：共享字符串、数字、布尔、内联字符串与稀疏单元格
  ---
  duration_ms: 0.6685
  type: 'test'
  ...
# Subtest: 幻灯片解析：按编号排序，标题与正文分开
ok 204 - 幻灯片解析：按编号排序，标题与正文分开
  ---
  duration_ms: 0.325416
  type: 'test'
  ...
# Subtest: xlsx 日期：内置与自定义日期格式的单元格按日期显示，普通数字不变
ok 205 - xlsx 日期：内置与自定义日期格式的单元格按日期显示，普通数字不变
  ---
  duration_ms: 0.45525
  type: 'test'
  ...
# Subtest: xlsx 日期：序列号转换、纯时间与 1904 纪元
ok 206 - xlsx 日期：序列号转换、纯时间与 1904 纪元
  ---
  duration_ms: 0.097834
  type: 'test'
  ...
# Subtest: swaps a complete task branch with its next sibling
ok 207 - swaps a complete task branch with its next sibling
  ---
  duration_ms: 2.065916
  type: 'test'
  ...
# Subtest: upper and lower boundaries are no-ops
ok 208 - upper and lower boundaries are no-ops
  ---
  duration_ms: 0.265834
  type: 'test'
  ...
# Subtest: promotes and demotes a subtree while preserving relative indent
ok 209 - promotes and demotes a subtree while preserving relative indent
  ---
  duration_ms: 0.951333
  type: 'test'
  ...
# Subtest: renumbers ordered siblings and protects code and document boundaries
ok 210 - renumbers ordered siblings and protects code and document boundaries
  ---
  duration_ms: 0.738417
  type: 'test'
  ...
# Subtest: converts indentation to list levels and list levels to headings
ok 211 - converts indentation to list levels and list levels to headings
  ---
  duration_ms: 0.466583
  type: 'test'
  ...
# Subtest: list probes cover protected content, boundaries, and deep branches
ok 212 - list probes cover protected content, boundaries, and deep branches
  ---
  duration_ms: 0.869833
  type: 'test'
  ...
# Subtest: uses the host list range even when copied Markdown loses all or some markers
ok 213 - uses the host list range even when copied Markdown loses all or some markers
  ---
  duration_ms: 2.73875
  type: 'test'
  ...
# Subtest: splits on top-level rules and drops blank paragraphs
ok 214 - splits on top-level rules and drops blank paragraphs
  ---
  duration_ms: 3.131
  type: 'test'
  ...
# Subtest: without rules, h1 and h2 start new slides but h3 does not
ok 215 - without rules, h1 and h2 start new slides but h3 does not
  ---
  duration_ms: 0.982
  type: 'test'
  ...
# Subtest: children are nested under their parent
ok 216 - children are nested under their parent
  ---
  duration_ms: 0.083583
  type: 'test'
  ...
# Subtest: front matter and empty documents
ok 217 - front matter and empty documents
  ---
  duration_ms: 0.097291
  type: 'test'
  ...
# Subtest: inline markdown
ok 218 - inline markdown
  ---
  duration_ms: 0.276834
  type: 'test'
  ...
# Subtest: links, images, kbd and unknown HTML
ok 219 - links, images, kbd and unknown HTML
  ---
  duration_ms: 0.322083
  type: 'test'
  ...
# Subtest: code spans keep their content literal
ok 220 - code spans keep their content literal
  ---
  duration_ms: 0.248
  type: 'test'
  ...
# Subtest: plain text and heading text
ok 221 - plain text and heading text
  ---
  duration_ms: 0.149667
  type: 'test'
  ...
# Subtest: only safe URLs pass
ok 222 - only safe URLs pass
  ---
  duration_ms: 0.456958
  type: 'test'
  ...
# Subtest: inline components from Ignorance
ok 223 - inline components from Ignorance
  ---
  duration_ms: 0.456
  type: 'test'
  ...
# Subtest: layout comments and the cover fallback
ok 224 - layout comments and the cover fallback
  ---
  duration_ms: 0.362375
  type: 'test'
  ...
# Subtest: kpi items split into value and label
ok 225 - kpi items split into value and label
  ---
  duration_ms: 0.124041
  type: 'test'
  ...
# Subtest: icon shortcodes like :bolt: are dropped from slide text
ok 226 - icon shortcodes like :bolt: are dropped from slide text
  ---
  duration_ms: 1.122708
  type: 'test'
  ...
# Subtest: slideKey changes only when the slide's own content changes
ok 227 - slideKey changes only when the slide's own content changes
  ---
  duration_ms: 0.327625
  type: 'test'
  ...
# Subtest: inline HTML comments are dropped from slide text
ok 228 - inline HTML comments are dropped from slide text
  ---
  duration_ms: 0.099208
  type: 'test'
  ...
# Subtest: footnote references become footnote nodes, not link text
ok 229 - footnote references become footnote nodes, not link text
  ---
  duration_ms: 0.109208
  type: 'test'
  ...
# Subtest: icon shortcodes become icon nodes; times and URLs stay text
ok 230 - icon shortcodes become icon nodes; times and URLs stay text
  ---
  duration_ms: 0.1985
  type: 'test'
  ...
# Subtest: footnote definitions are collected by id from def_footnote blocks
ok 231 - footnote definitions are collected by id from def_footnote blocks
  ---
  duration_ms: 0.221791
  type: 'test'
  ...
# Subtest: listTag: Typora marks ordered lists with listType 'ol'
ok 232 - listTag: Typora marks ordered lists with listType 'ol'
  ---
  duration_ms: 0.192625
  type: 'test'
  ...
# Subtest: 每个文件查看器的入口页都存在，且扩展名不重复
ok 233 - 每个文件查看器的入口页都存在，且扩展名不重复
  ---
  duration_ms: 3.999584
  type: 'test'
  ...
# Subtest: ignorance.file-viewers 满足商店硬性限制
ok 234 - ignorance.file-viewers 满足商店硬性限制
  ---
  duration_ms: 1.280208
  type: 'test'
  ...
# Subtest: ignorance.advanced 满足商店硬性限制
ok 235 - ignorance.advanced 满足商店硬性限制
  ---
  duration_ms: 1.509875
  type: 'test'
  ...
# Subtest: ignorance.property-query 满足商店硬性限制
ok 236 - ignorance.property-query 满足商店硬性限制
  ---
  duration_ms: 0.382708
  type: 'test'
  ...
# Subtest: ignorance.task-rollup 满足商店硬性限制
ok 237 - ignorance.task-rollup 满足商店硬性限制
  ---
  duration_ms: 0.40125
  type: 'test'
  ...
# Subtest: ignorance.value-track 满足商店硬性限制
ok 238 - ignorance.value-track 满足商店硬性限制
  ---
  duration_ms: 0.389042
  type: 'test'
  ...
# Subtest: ignorance.backlinks 满足商店硬性限制
ok 239 - ignorance.backlinks 满足商店硬性限制
  ---
  duration_ms: 0.506917
  type: 'test'
  ...
# Subtest: ignorance.flashcards 满足商店硬性限制
ok 240 - ignorance.flashcards 满足商店硬性限制
  ---
  duration_ms: 0.364334
  type: 'test'
  ...
# Subtest: ignorance.vault-search 满足商店硬性限制
ok 241 - ignorance.vault-search 满足商店硬性限制
  ---
  duration_ms: 0.53
  type: 'test'
  ...
# Subtest: ignorance.md-lint 满足商店硬性限制
ok 242 - ignorance.md-lint 满足商店硬性限制
  ---
  duration_ms: 0.462458
  type: 'test'
  ...
# Subtest: ignorance.table-tools 满足商店硬性限制
ok 243 - ignorance.table-tools 满足商店硬性限制
  ---
  duration_ms: 0.291584
  type: 'test'
  ...
# Subtest: ignorance.outliner 满足商店硬性限制
ok 244 - ignorance.outliner 满足商店硬性限制
  ---
  duration_ms: 0.916584
  type: 'test'
  ...
# Subtest: ignorance.natural-date 满足商店硬性限制
ok 245 - ignorance.natural-date 满足商店硬性限制
  ---
  duration_ms: 0.218291
  type: 'test'
  ...
# Subtest: 文件查看器扩展不申请任何权限
ok 246 - 文件查看器扩展不申请任何权限
  ---
  duration_ms: 0.076917
  type: 'test'
  ...
# Subtest: 主题商店包：只含主题，清单与 theme.toml 满足规则
ok 247 - 主题商店包：只含主题，清单与 theme.toml 满足规则
  ---
  duration_ms: 1.176542
  type: 'test'
  ...
# Subtest: ignorance.advanced 不打包 ECharts 与 Mermaid，演示用内置渲染器
ok 248 - ignorance.advanced 不打包 ECharts 与 Mermaid，演示用内置渲染器
  ---
  duration_ms: 0.959083
  type: 'test'
  ...
# Subtest: calculates row expressions and aggregate ranges referencing calculated cells
ok 249 - calculates row expressions and aggregate ranges referencing calculated cells
  ---
  duration_ms: 2.729875
  type: 'test'
  ...
# Subtest: marks invalid references and circular dependencies with errors
ok 250 - marks invalid references and circular dependencies with errors
  ---
  duration_ms: 0.296875
  type: 'test'
  ...
# Subtest: reports the error position for invalid expressions and supports operator precedence
ok 251 - reports the error position for invalid expressions and supports operator precedence
  ---
  duration_ms: 0.247417
  type: 'test'
  ...
# Subtest: aggregates values and resolves absolute and last-row references
ok 252 - aggregates values and resolves absolute and last-row references
  ---
  duration_ms: 0.156042
  type: 'test'
  ...
# Subtest: sorts numbers in both directions with blanks last and stable ties
ok 253 - sorts numbers in both directions with blanks last and stable ties
  ---
  duration_ms: 2.41675
  type: 'test'
  ...
# Subtest: sorts calendar dates and Chinese text
ok 254 - sorts calendar dates and Chinese text
  ---
  duration_ms: 1.332583
  type: 'test'
  ...
# Subtest: parses escaped pipes, code, CRLF and the original alignment row
ok 255 - parses escaped pipes, code, CRLF and the original alignment row
  ---
  duration_ms: 0.356125
  type: 'test'
  ...
# Subtest: accepts header-only tables and rejects non-table blocks
ok 256 - accepts header-only tables and rejects non-table blocks
  ---
  duration_ms: 0.094542
  type: 'test'
  ...
# Subtest: preserves protected Markdown around the target table through a command
ok 257 - preserves protected Markdown around the target table through a command
  ---
  duration_ms: 5.035042
  type: 'test'
  ...
# Subtest: appends totals and transposes while preserving the original table
ok 258 - appends totals and transposes while preserving the original table
  ---
  duration_ms: 0.224833
  type: 'test'
  ...
# Subtest: converts quoted CSV and reports malformed input
ok 259 - converts quoted CSV and reports malformed input
  ---
  duration_ms: 0.456458
  type: 'test'
  ...
# Subtest: locates a table without block text and uses the selected cell's sibling index
ok 260 - locates a table without block text and uses the selected cell's sibling index
  ---
  duration_ms: 0.931625
  type: 'test'
  ...
# Subtest: table commands leave the document untouched when the caret is outside a table
ok 261 - table commands leave the document untouched when the caret is outside a table
  ---
  duration_ms: 0.960375
  type: 'test'
  ...
# Subtest: 工作区扩展的 core 副本与共享模块逐字节一致
ok 262 - 工作区扩展的 core 副本与共享模块逐字节一致
  ---
  duration_ms: 32.882625
  type: 'test'
  ...
# Subtest: 属性索引只保留属性、标签和诊断
ok 263 - 属性索引只保留属性、标签和诊断
  ---
  duration_ms: 3.640708
  type: 'test'
  ...
# Subtest: indexes properties, nested tasks, heading, links and tags without code
ok 264 - indexes properties, nested tasks, heading, links and tags without code
  ---
  duration_ms: 6.544416
  type: 'test'
  ...
# Subtest: keeps malformed YAML as an indexed note with a diagnostic
ok 265 - keeps malformed YAML as an indexed note with a diagnostic
  ---
  duration_ms: 0.44675
  type: 'test'
  ...
# Subtest: runs the documented path, date, property, field and sort query
ok 266 - runs the documented path, date, property, field and sort query
  ---
  duration_ms: 4.346667
  type: 'test'
  ...
# Subtest: handles grouping, arrays, missing fields and source logic
ok 267 - handles grouping, arrays, missing fields and source logic
  ---
  duration_ms: 0.956417
  type: 'test'
  ...
# Subtest: reports invalid keywords and conditions with source locations
ok 268 - reports invalid keywords and conditions with source locations
  ---
  duration_ms: 0.36825
  type: 'test'
  ...
# Subtest: does not compare invalid date strings as dates and supports the root source
ok 269 - does not compare invalid date strings as dates and supports the root source
  ---
  duration_ms: 0.221375
  type: 'test'
  ...
# Subtest: resolves three backlink sources, mentions, parent and siblings
ok 270 - resolves three backlink sources, mentions, parent and siblings
  ---
  duration_ms: 1.539375
  type: 'test'
  ...
# Subtest: ignores external and attachment links and follows decoded relative paths
ok 271 - ignores external and attachment links and follows decoded relative paths
  ---
  duration_ms: 0.303292
  type: 'test'
  ...
# Subtest: resolves an unquoted wiki parent parsed by YAML as nested flow arrays
ok 272 - resolves an unquoted wiki parent parsed by YAML as nested flow arrays
  ---
  duration_ms: 0.387375
  type: 'test'
  ...
# Subtest: markdown link falls back to a unique note name when the relative path is wrong
ok 273 - markdown link falls back to a unique note name when the relative path is wrong
  ---
  duration_ms: 0.257917
  type: 'test'
  ...
# Subtest: markdown link with a wrong prefix matches the note whose path ends the same way
ok 274 - markdown link with a wrong prefix matches the note whose path ends the same way
  ---
  duration_ms: 0.186125
  type: 'test'
  ...
# Subtest: a bare file name shared by several notes picks the nearest one, and an exact relative path still wins
ok 275 - a bare file name shared by several notes picks the nearest one, and an exact relative path still wins
  ---
  duration_ms: 0.935083
  type: 'test'
  ...
# Subtest: a link path that matches no exact file prefers the candidate sharing the most trailing folders
ok 276 - a link path that matches no exact file prefers the candidate sharing the most trailing folders
  ---
  duration_ms: 0.402625
  type: 'test'
  ...
# Subtest: equally similar candidates resolve to the same note every time
ok 277 - equally similar candidates resolve to the same note every time
  ---
  duration_ms: 1.21725
  type: 'test'
  ...
# Subtest: a markdown link to a name that exists nowhere stays broken and attachments stay ignored
ok 278 - a markdown link to a name that exists nowhere stays broken and attachments stay ignored
  ---
  duration_ms: 0.659916
  type: 'test'
  ...
# Subtest: groups backlinks by source path and keeps each reference location
ok 279 - groups backlinks by source path and keeps each reference location
  ---
  duration_ms: 0.828834
  type: 'test'
  ...
# Subtest: scans inside the root with exclusions and reuses unmodified entries
ok 280 - scans inside the root with exclusions and reuses unmodified entries
  ---
  duration_ms: 4.185417
  type: 'test'
  ...
# Subtest: reports host file and depth ceilings without reading filtered paths
ok 281 - reports host file and depth ceilings without reading filtered paths
  ---
  duration_ms: 14.015625
  type: 'test'
  ...
# Subtest: shares current note edits across controllers using the same cache
ok 282 - shares current note edits across controllers using the same cache
  ---
  duration_ms: 7.252458
  type: 'test'
  ...
# Subtest: relativePath accepts macOS firmlink aliases of the same folder
ok 283 - relativePath accepts macOS firmlink aliases of the same folder
  ---
  duration_ms: 0.156458
  type: 'test'
  ...
# Subtest: relativePath treats composed and decomposed Unicode names as the same
ok 284 - relativePath treats composed and decomposed Unicode names as the same
  ---
  duration_ms: 0.0585
  type: 'test'
  ...
# Subtest: relativePath still rejects files outside the root, including look-alike prefixes
ok 285 - relativePath still rejects files outside the root, including look-alike prefixes
  ---
  duration_ms: 0.051167
  type: 'test'
  ...
# Subtest: relativePath keeps working for ordinary and Windows-style paths
ok 286 - relativePath keeps working for ordinary and Windows-style paths
  ---
  duration_ms: 0.045542
  type: 'test'
  ...
# Subtest: keeps edits to two different notes when both windows publish concurrently
ok 287 - keeps edits to two different notes when both windows publish concurrently
  ---
  duration_ms: 4.408208
  type: 'test'
  ...
# Subtest: announces the first scan when a workspace opens after Worker startup
ok 288 - announces the first scan when a workspace opens after Worker startup
  ---
  duration_ms: 1.371209
  type: 'test'
  ...
# Subtest: ranks 50 fixed fixtures by title and separated Chinese words
ok 289 - ranks 50 fixed fixtures by title and separated Chinese words
  ---
  duration_ms: 2.406458
  type: 'test'
  ...
# Subtest: supports phrase, exclusion, tag, path and English misspelling
ok 290 - supports phrase, exclusion, tag, path and English misspelling
  ---
  duration_ms: 0.852459
  type: 'test'
  ...
# Subtest: returns a heading and marked spans for the matching snippet
ok 291 - returns a heading and marked spans for the matching snippet
  ---
  duration_ms: 0.170458
  type: 'test'
  ...
# Subtest: returns no results for blank searches and still supports filter-only searches
ok 292 - returns no results for blank searches and still supports filter-only searches
  ---
  duration_ms: 0.11375
  type: 'test'
  ...
# Subtest: recognizes three card formats and distinguishes matching questions by path
ok 293 - recognizes three card formats and distinguishes matching questions by path
  ---
  duration_ms: 7.101083
  type: 'test'
  ...
# Subtest: SM-2 intervals follow 1, 6 and ease multiplication, then reset on failure
ok 294 - SM-2 intervals follow 1, 6 and ease multiplication, then reset on failure
  ---
  duration_ms: 1.552042
  type: 'test'
  ...
# Subtest: rejects duplicate or stale scores while pruning deleted cards
ok 295 - rejects duplicate or stale scores while pruning deleted cards
  ---
  duration_ms: 1.092459
  type: 'test'
  ...
# Subtest: filters open tagged tasks and places overdue deadlines first
ok 296 - filters open tagged tasks and places overdue deadlines first
  ---
  duration_ms: 1.899084
  type: 'test'
  ...
# Subtest: the weekly side panel shows seven calendar days of open tasks
ok 297 - the weekly side panel shows seven calendar days of open tasks
  ---
  duration_ms: 0.270416
  type: 'test'
  ...
# Subtest: handles missing dates with a distinct filter and reports invalid syntax
ok 298 - handles missing dates with a distinct filter and reports invalid syntax
  ---
  duration_ms: 0.392292
  type: 'test'
  ...
# Subtest: weekly snapshots do not request an index before the sidebar announces demand
ok 299 - weekly snapshots do not request an index before the sidebar announces demand
  ---
  duration_ms: 3.859291
  type: 'test'
  ...
# Subtest: plots numeric and unit values and marks missing notes and the goal
ok 300 - plots numeric and unit values and marks missing notes and the goal
  ---
  duration_ms: 3.09925
  type: 'test'
  ...
# Subtest: computes weekly average values starting Monday
ok 301 - computes weekly average values starting Monday
  ---
  duration_ms: 0.52525
  type: 'test'
  ...
# Subtest: renders each day in a range as a heatmap cell
ok 302 - renders each day in a range as a heatmap cell
  ---
  duration_ms: 0.835833
  type: 'test'
  ...
# Subtest: static chart snapshots resolve theme colors when SDK variables are empty
ok 303 - static chart snapshots resolve theme colors when SDK variables are empty
  ---
  duration_ms: 7.200042
  type: 'test'
  ...
# Subtest: every color code has a first and second position rule matching only the bare code
ok 304 - every color code has a first and second position rule matching only the bare code
  ---
  duration_ms: 0.87275
  type: 'test'
  ...
# Subtest: theme hides the suffix and colors the previous element
ok 305 - theme hides the suffix and colors the previous element
  ---
  duration_ms: 0.555542
  type: 'test'
  ...
1..305
# tests 305
# suites 0
# pass 305
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1264.866708
```

</details>

## 风险与回退

可回退以「R6」标记的独立提交，恢复原版链接目标识别并移除本轮探测与交付材料。深层括号链接在原版整理时可能被改写。R6 未切换已安装的扩展，实机验收结果仍以对应安装版本为准。

## S1 共享索引模块

- 改动包括 `packages/vault-core/`、`scripts/sync-vault-core.mjs` 和 `tests/vault-core-sync.test.mjs`。
- `npm test` 输出 `tests 230 / pass 230 / fail 0`，涵盖旧工作区扩展测试和新增按需字段测试。旧扩展的 Typora 宿主回归未实测。
- X4 在临时目录用示例扩展验证。首次同步后 `pass 2 / fail 0`，修改副本后 `pass 1 / fail 1`，重新同步后 `pass 2 / fail 0`。实际发布扩展的副本将在 S2 起逐项检查。
- `scripts/build-store.sh` 后运行 `diff -qr advanced/ignorance.vault store/extensions/ignorance.vault -x experiments`，无输出。

## S2 属性查询代码块

- 独立包位于 `advanced/ignorance.property-query/`。首次遇到有效查询才启动索引，仅索引属性和标签。当前文档变更使用 300 ms 防抖。
- `npm test` 输出 `tests 231 / pass 231 / fail 0`，包括新包的属性查询、商店约束和 X4 副本校验。商店构建后新包的 `diff -qr` 无输出。
- 可验收。第 6 项六行及 R2、R3、R4 前半均在 Typora 2.0.0-beta1 实测，详见实测记录 S2。R3 为端到端无障碍观测，包含自动化开销。

## S3 跨文件任务汇总

- 工作区有独立的 `advanced/ignorance.task-rollup/`、两篇专项测试样例和迁移后的任务测试。通过代码块或本周任务侧栏触发索引。
- `npm test` 输出 `tests 233 / pass 233 / fail 0`，含商店包约束和 X4 副本检查。商店构建后 `diff -qr` 无输出。
- 可验收。第 7 项四行已在 Typora 2.0.0-beta1 复测。新增侧栏需求回归测试，先得到 1 次提前请求的失败结果，再验证修正通过。详见实测记录 S3。

## S4 跨文件数值图表

- 可验收。独立商店包位于 `advanced/ignorance.value-track/`，包含 `track` 代码块、图表视图与静态快照。
- `npm test` 输出 `tests 235 / pass 235 / fail 0`，含商店约束和 X4 副本一致性。商店构建后的 `diff -qr` 无输出。
- Typora 复测第 8 项五行。导出快照改为解析具体主题颜色，避免 PDF 黑块。快照回归测试修正前失败、修正后通过。详见实测记录 S4。

## S5 反向链接与关系导航

- 可验收。独立商店包位于 `advanced/ignorance.backlinks/`，由关系侧栏首次使用触发索引。第 10 项六行已在 Typora 实测，见实测记录 S5。
- `npm test` 输出 `tests 236 / pass 236 / fail 0`，含 `vault-relations.test.mjs`、商店约束及 X4 一致性。商店构建后 `diff -qr` 无输出。

## S6 间隔复习卡片

- 可验收。独立商店包位于 `advanced/ignorance.flashcards/`，复习侧栏首次打开时建立卡片索引，定时提醒不会触发首次扫描。
- `npm test` 输出 `tests 237 / pass 237 / fail 0`，包含 SM-2、去重评分、旧记录清理、商店约束和 X4 一致性。商店构建后 `diff -qr` 无输出。
- 第 11 项六行已在 Typora 2.0.0-beta1 实测。R4 后半五轮双窗口提交均在 1 秒内完成，每轮已复习数只增加 1。详见实测记录 S6。

## S7 相关性全文搜索

- 可验收。独立商店包位于 `advanced/ignorance.vault-search/`，命令和侧栏在首次查询时建立仅含搜索字段的索引。
- `npm test` 输出 `tests 238 / pass 238 / fail 0`，包含 50 篇固定排序、过滤、容错、高亮、商店约束和 X4 一致性。商店构建后 `diff -qr` 无输出。
- 第 9 项六行已在 Typora 2.0.0-beta1 实测。5,000 篇宿主暖态 20 次中位数 134.5 ms、p95 191 ms，门槛为中位数不超过 300 ms。临时计时补丁未写入提交。详见实测记录 S7。

## S8 Markdown 规则整理扩展

- 独立包位于 `advanced/ignorance.md-lint/`，权限只有 `document: write`。代码从 `ignorance.advanced` 复制（含 R6 的括号修复），`ignorance.advanced` 未改动。
- `tests/ext-md-lint.test.mjs` 是原测试改指向新包；`scripts/probe-format.mjs` 的第 1 项 10 组探测对新包结果与旧包逐行一致。
- 宿主实测未做，见实测记录 S8，全部为未实测。

## S9 表格工具扩展

- 独立包位于 `advanced/ignorance.table-tools/`。命令、菜单和公式与旧包一致，测试为 `tests/ext-table-tools.test.mjs`、`tests/ext-table-formula.test.mjs`。
- 宿主实测未做，右键菜单和 `/` 菜单条件（`table_cell` 与 `table`）也待测，见实测记录 S9。

## S10 大纲列表扩展

- 独立包位于 `advanced/ignorance.outliner/`，带「列表大纲」侧栏。快捷键仍为 `⌘⇧F7` 至 `⌘⇧F10`。测试为 `tests/ext-outliner.test.mjs`。
- 宿主实测未做，「列表转标题」的宿主跨块选区转换也待测，见实测记录 S10。

## S11 中文自然语言日期扩展

- 独立包位于 `advanced/ignorance.natural-date/`。「周末」新规则见上面的自行决定，`tests/ext-natural-date.test.mjs` 新增 2 个测试覆盖周一、周五、周六、周日、两种一周起点、跨月、跨年。
- 宿主实测未做，见实测记录 S11。

## S12 收尾

- 已删除 `advanced/ignorance.vault/`（含 `experiments/`）和 `tests/vault-integration.test.mjs`。原集成测试改为 `tests/ext-workers.test.mjs`，对 6 个工作区扩展各自从激活跑到出结果，逐个破坏入口注册，对应测试都会失败。其余 vault 测试、基准脚本和 `scripts/probe-vault.mjs` 改指向 `packages/vault-core/` 和各新扩展。
- `scripts/build-store.sh` 里旧 `ignorance.vault` 的拷贝已删除，新增 4 个编辑类扩展；图谱和文件预览的部分未动。商店构建后 10 个新扩展的 `diff -qr` 无输出。
- `ignorance.advanced`、`ignorance.knowledge-graphs`、`ignorance.file-viewers` 的文件在本轮没有改动。
- X2（全部同时安装无冲突）、X3（5,000 篇冷启动总耗时）未实测，需要在 Typora 里安装全部扩展。
- 上面 `npm test` 完整输出为拆分和收尾后的最终结果。
