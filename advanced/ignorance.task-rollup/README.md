Collect Markdown tasks across your workspace in Typora.

使用 `tasks` 代码块按目录、状态、截止日期和标签汇总任务，或打开「本周任务」查看从今天起七个日历日内到期的未完成任务。首次打开有效任务代码块或侧栏时开始索引，已有有效缓存时直接读取。

| 权限 | 用途 |
| --- | --- |
| `workspace: read` | 读取工作区 Markdown 文件中的任务 |
| `document: read` | 读取当前文档的任务变更 |

默认排除 `templates/` 和 `archive/`。旧版 `ignorance.vault` 的设置和复习记录不会迁移，设置从默认值开始。

索引最多读取前 5,000 个文件，目录深度受 Typora 的 8 层扫描范围限制。文件名按钮仅显示相对路径。任务汇总为只读，源文档中的任务状态请在源文档里修改。
