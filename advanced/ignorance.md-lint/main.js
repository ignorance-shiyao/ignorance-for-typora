import { cjkSpacing } from "./format/cjk-spacing.js";
import { lintMarkdown } from "./format/lint.js";

export async function activate(ctx) {
  ctx.subscriptions.push(
    typora.formatters.register("cjk-spacing", (markdown) => cjkSpacing(markdown), { title: "中英文之间加空格" }),
    typora.formatters.register(
      "markdown-lint",
      (markdown) => lintMarkdown(markdown, typora.settings.get()),
      { title: "整理 Markdown" },
    ),
  );
}
