# Ignorance Table Tools

Sort, calculate, total and transpose Markdown tables. The UI is in Simplified Chinese.

用于 Typora 2.0 的表格工具。光标在表格里时，在命令面板执行下列命令，只改这一张表，记为一次撤销。

## 命令

- 按列升序、降序排序：数字按数值，日期按先后，文本按中文拼音，空单元格排最后，表头不动。
- 重新计算表格：读取表格下方的注释公式，写入结果。例如 `<!-- tblfm: $4 = $2 * $3 -->`。支持 `sum`、`avg`、`min`、`max`、`count` 和四则运算，`$n` 是第 n 列，`@n` 是第 n 行，`@>` 是最后一行。引用不存在或非数字时写 `#ERR` 并提示原因。
- 追加合计行、转置表格。
- 将选中的 CSV 转为表格，带引号的逗号按一个单元格处理。

公式写在 HTML 注释里，用别的编辑器打开时只是一个表格加一条看不见的注释。

## 权限

| 权限 | 用途 |
| --- | --- |
| `document: write` | 把改动写回当前表格 |

不联网，不读工作区。

## 已知限制

- Typora 2.0.0-beta1 的右键菜单不显示扩展命令，请用命令面板。
- 与 `Ignorance Advanced` 同时启用时会出现重复的命令，请只启用其中一个。
