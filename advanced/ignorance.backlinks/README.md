Show backlinks, mentions and note relationships in Typora.

打开「关系」侧栏，查看当前笔记的反向链接、未链接提及、父子关系和出链。首次打开侧栏时建立索引，已有有效缓存时直接读取。

| 权限 | 用途 |
| --- | --- |
| `workspace: read` | 读取工作区 Markdown 文件中的链接、正文和属性 |
| `document: read` | 读取当前文档和链接变更 |

默认排除 `templates/` 和 `archive/`。旧版 `ignorance.vault` 的设置和复习记录不会迁移，设置从默认值开始。

索引最多读取前 5,000 个文件和 8 层目录。相对路径可显示和复制。
