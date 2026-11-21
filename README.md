# Ignorance for Typora

给 Typora 2.0 用的主题和扩展：一套干净的排版风格，加上演示、图表和格式转换。能在主题里实现的放在主题，主题做不到的放在扩展。

## 主题

- 八套配色：天蓝、松绿、书卷、石墨、赤陶、深海青、紫藤、琥珀，各有浅色和深色。
- 主题选项（设置 ▸ 视图）：阅读宽度、段落节奏、双猫、标题编号、表格十字高亮、墨水屏。
- 提示块：note、tip、important、warning、caution 各有图标和配色。
- `::: 名称` 容器：说明类（note、info、tip、success、warning、danger、question、important）、布局类（kpi、cols、tabs、details、card、chapter、compare）、流程类（timeline、steps、process、roadmap）。
- 引用、表格、代码、行内标记、前置信息卡的统一样式。
- 导出 HTML 同样生效。

## 扩展

- 演示面板：按 `---` 或标题分页，支持版式注释、脚注、图标短码、KaTeX 公式、ECharts 和 Mermaid，可全屏放映。
- ECharts 代码块：单击图例、悬停提示可用。
- Mermaid 代码块：配色跟随主题的强调色和明暗。
- 格式化命令「中英文之间加空格」。
- 片段和模板。

## 目录

| 路径 | 内容 |
|---|---|
| `theme/src/` | 主题源码：`theme.css`、`base.toml`（颜色与元素）、`layout.toml`（阅读宽度、段落节奏、标题编号、十字高亮、墨水屏）、`mascot.toml`（双猫） |
| `theme/assets/` | 构建时内联为 data URI 的图片 |
| `advanced/ignorance.advanced/` | 扩展：演示面板、ECharts 与 Mermaid 渲染器、格式化命令、片段、模板 |
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
- 导出的 HTML 只有一种明暗。
- Word 导出走 Pandoc，不带主题样式。
- `tabs` 容器在编辑器里是各页签上下堆叠，不能切换；`details` 容器在编辑器里不折叠。

## 许可

本项目代码使用 MIT 许可，见 `LICENSE`。`advanced/ignorance.advanced/vendor/` 里的 ECharts、Mermaid、KaTeX、Lucide 各自保留原许可文件。
