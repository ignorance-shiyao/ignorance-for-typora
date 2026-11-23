# Ignorance Markdown Lint

Tidies a Markdown document with one command. The UI is in Simplified Chinese.

用于 Typora 2.0 的 Markdown 整理扩展。在命令面板手动执行「Format Document: 整理 Markdown」，整个文档按规则整理，记为一次撤销。

## 整理内容

- 标题：只保留一个一级标题，标题不跳级，`#` 后补空格，标题前后留一个空行。
- 列表：无序列表统一为 `-`，有序列表重新编号，缩进可选保留、2 或 4 空格。
- 空白：合并连续空行，删除行尾空白（保留 Markdown 硬换行），文件末尾保留一个换行。
- 中文：紧邻汉字的半角标点转全角，括号成对转换，中英文之间加空格，统一斜体标记。
- 围栏代码、数学块、表格、Front Matter、行内代码、链接地址、脚注和 HTML 保持原样。

中文标点规则：标点紧挨汉字，或所在句子里它之前出现过汉字，转全角；`, ; :` 后面跳过空格再遇汉字也转。数字之间的 `,` `.` 不转。

另有命令「Format Document: 中英文之间加空格」，只处理间距。

每条规则可在扩展设置里单独关闭。

## 权限

| 权限 | 用途 |
| --- | --- |
| `document: write` | 把整理结果写回当前文档 |

不联网，不读工作区。

## 已知限制

- Typora 的格式化命令只能手动执行，不能保存时自动运行。
- 与 `Ignorance Advanced` 同时启用时会出现重复的命令，请只启用其中一个。
