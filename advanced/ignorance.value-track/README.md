Plot numeric properties from workspace notes in Typora.

使用 `track` 代码块绘制折线图、柱状图或日历热力图，支持目标线、周或月汇总。首次打开有效图表时建立索引，已有有效缓存时直接读取。

| 权限 | 用途 |
| --- | --- |
| `workspace: read` | 读取工作区笔记中的数值和日期 |
| `document: read` | 读取当前文档的属性变更 |

默认排除 `templates/` 和 `archive/`。旧版 `ignorance.vault` 的设置和复习记录不会迁移，设置从默认值开始。

索引最多读取前 5,000 个文件和 8 层目录。图表只读，无法解析的值会跳过。导出使用静态 SVG，快照不可用时保留源码。
