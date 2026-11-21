# Ignorance for Typora

给 Typora 2.0 用的主题和扩展：一套干净的排版风格，加上演示、图表和格式转换。能在主题里实现的放在主题，主题做不到的放在扩展。

## 主题

- 八套配色：天蓝、松绿、书卷、石墨、赤陶、深海青、紫藤、琥珀，各有浅色和深色。
- 主题选项（设置 ▸ 视图）：阅读宽度、段落节奏、双猫、标题编号、表格十字高亮、墨水屏。
- 提示块：note、tip、important、warning、caution 各有图标和配色。
- `::: 名称` 容器：说明类（note、info、tip、success、warning、danger、question、important）、布局类（kpi、cols、tabs、details、card、chapter、compare）、流程类（timeline、steps、process、roadmap）。
- 引用、表格、代码、行内标记的统一样式。嵌套引用撑满父级宽度、文字左对齐，靠底色叠加和引号变淡区分层级；嵌套列表缩进收窄，靠字号和标记颜色区分。
- 目录（`[TOC]`）不用缩进，靠字号、字重和明暗区分层级。
- 属性（前置信息）卡：字段表单里每个常用字段（title、author、date、tags、source 等）有各自的图标。
- 侧栏与右侧面板：圆角悬浮卡片布局；文件树按文件类型显示不同图标（文档、代码、数据、表格、图片、网页、PDF、归档、音频、视频、演示）。
- 导出 HTML 同样生效。

## 扩展

- 演示面板：按 `---` 或标题分页，支持版式注释、脚注、图标短码、KaTeX 公式、ECharts 和 Mermaid，可全屏放映。
- ECharts 代码块：单击图例、悬停提示可用。
- Mermaid 代码块：配色跟随主题的强调色和明暗。
- 文件预览：在文件树里点开非 Markdown 文件，在编辑区预览，见下节。
- 格式化命令「中英文之间加空格」。
- 片段和模板。

### 文件预览

文件树默认只列 Markdown 和纯文本。要显示其他文件，在设置 ▸ 文件里把文件树过滤改为「全部文件」（`files.treeFileFilterMode = 'all'`），改完重启 Typora。

| 类型 | 扩展名 | 预览方式 |
|---|---|---|
| 结构化数据 | json、yaml、yml、toml、xml | 可折叠的树，可切换到源码；出错时显示错误并回到源码 |
| 代码与网页 | html、htm、css、js、mjs、cjs、ts、tsx、jsx、py、java、go、rs、c、cpp、h、sh、zsh、sql、ini | 行号与简易着色的源码，可编辑并保存（Tab 缩进、⌘S）；HTML 另有预览模式 |
| Office 文档 | docx、xlsx、pptx | 只读：docx 转为文档，xlsx 按工作表显示，pptx 按页显示文字 |

图片、音频、视频和 PDF 使用 Typora 自带预览，csv、tsv 可用 Typora 官方的 CSV Viewer 扩展。

## 目录

| 路径 | 内容 |
|---|---|
| `theme/src/` | 主题源码：`theme.css`、`base.toml`（颜色与元素）、`layout.toml`（阅读宽度、段落节奏、标题编号、十字高亮、墨水屏）、`mascot.toml`（双猫） |
| `theme/assets/` | 构建时内联为 data URI 的图片 |
| `advanced/ignorance.advanced/` | 扩展：演示面板、ECharts 与 Mermaid 渲染器、文件预览（`viewers/`）、格式化命令、片段、模板 |
| `scripts/` | 构建与安装脚本、八套配色生成器、样式检查 |
| `tests/` | 单元测试（`node --test`） |

## 安装

需要 macOS、zsh、Python 3、Typora 2.0.0-beta1。

```bash
zsh scripts/install.sh
```

主题复制到 `~/.config/Typora/Themes/ignorance`，扩展以软链接放到 `~/.config/Typora/Extensions/ignorance.advanced`，装完重启 Typora。主题选项在 设置 ▸ 视图，配色有八套。

卸载：

```bash
REMOVE=1 zsh scripts/install.sh
```

## 开发

```bash
npm install
npm test
node scripts/check-styles.mjs
zsh scripts/build-theme.sh
```

`theme/ignorance/` 是构建产物，不进版本库。

## 限制

- 扩展不能改编辑器 DOM，所以编辑器里的交互只能靠主题 CSS 实现。
- 属性块默认以 YAML 源码显示，这是 Typora 渲染器写死的默认值，主题和扩展都改不了，需要在每篇文档里手动切到字段表单。
- 属性字段表单里 `cssclasses` 等列表项前的「- 」是 YAML 数据本身，样式去不掉。
- 侧栏和右侧面板的内部元素只能通过主题配色键调整。
- 导出的 HTML 只有一种明暗。
- Word 导出走 Pandoc，不带主题样式。
- HTML 预览里页面脚本不执行，相对路径的样式和图片不加载。
- 代码着色是简易正则，不处理 HTML 内嵌的 script 与 style。
- Office 预览只支持 docx、xlsx、pptx：xlsx 日期显示为序列号、公式只显示缓存值、不合并单元格；pptx 看不到图片与图表；docx 的页眉页脚、文本框会丢失。
- `tabs` 容器在编辑器里是各页签上下堆叠，不能切换；`details` 容器在编辑器里不折叠。

## 许可

本项目代码使用 MIT 许可，见 `LICENSE`。`advanced/ignorance.advanced/vendor/` 里的 ECharts、Mermaid、KaTeX、Lucide、js-yaml、smol-toml、jszip、mammoth 各自保留原许可文件。
