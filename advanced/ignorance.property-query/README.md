Render read-only queries over Markdown note properties in your Typora workspace.

在工作区文档中添加 `query` 代码块，可按目录、标签或属性筛选笔记，并用表格、列表或计数查看结果。首次打开有效查询时建立索引，已有有效缓存时直接读取。

| 权限 | 用途 |
| --- | --- |
| `workspace: read` | 读取工作区 Markdown 文件 |
| `document: read` | 读取当前文档及其未保存的属性变更 |

默认排除 `templates/` 和 `archive/`。旧版 `ignorance.vault` 的设置和复习记录不会迁移，设置从默认值开始。

索引最多读取前 5,000 个文件，目录深度受 Typora 的 8 层扫描范围限制。文件名按钮仅显示相对路径。导出使用查询快照，快照不可用时保留查询源码。
