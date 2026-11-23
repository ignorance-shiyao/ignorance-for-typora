Review Markdown flashcards with spaced repetition in Typora.

打开「复习」侧栏，翻面并按四档评分安排下次复习。支持行内问答、独行问号分隔和带 `flashcard` 标签的挖空卡片。首次打开侧栏时建立索引，已有有效缓存时直接读取。使用「重建卡片索引」清理旧卡片的排期。

| 权限 | 用途 |
| --- | --- |
| `workspace: read` | 从工作区 Markdown 文件提取卡片 |
| `document: read` | 读取当前文档的卡片变更 |

默认排除 `templates/` 和 `archive/`。旧版 `ignorance.vault` 的设置和复习记录不会迁移，设置从默认值开始。

索引最多扫描前 5,000 个文件和 8 层目录。复习记录存于扩展私有存储。提醒基于已建立的索引，可在设置关闭。
