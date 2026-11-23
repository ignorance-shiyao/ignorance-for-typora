Search Markdown notes by relevance in your Typora workspace.

使用命令或「工作区搜索」侧栏即时检索文件名、标题和正文，支持短语、排除词、目录和标签筛选。首次搜索时建立索引，已有有效缓存时直接读取。

| 权限 | 用途 |
| --- | --- |
| `workspace: read` | 读取工作区 Markdown 文件并建立搜索索引 |
| `document: read` | 读取当前文档的未保存变更 |

默认排除 `templates/` 和 `archive/`。旧版 `ignorance.vault` 的设置和复习记录不会迁移，设置从默认值开始。

索引最多读取前 5,000 个文件和 8 层目录。PDF 与 Office 附件内容不参与搜索。结果中的文件名可展开相对路径。
