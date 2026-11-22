import { spaceText } from "../cjk-spacing.js";

const HAN = /\p{Script=Han}/u;
const PUNCTUATION = { ",": "，", ".": "。", ";": "；", ":": "：", "!": "！", "?": "？", "(": "（", ")": "）" };
const FULL_WIDTH = /[ \t]*([，。；：！？（）])[ \t]*/g;
const INLINE = /(?<ticks>`+)(?!`)[\s\S]*?(?<!`)\k<ticks>(?!`)|\$\$[\s\S]*?\$\$|\$[^$\n]+\$|!?\[(?:\\.|[^\]\\\n])*\](?:\((?:\\.|[^()\\\n]|\((?:\\.|[^()\\\n])*\))*\)|\[[^\]\n]*\])|\[\[[^\]\n]+\]\]|<!--[^]*?-->|<[^>\n]+>|(?:https?:\/\/|www\.)[^\s<>，。；：！？（）]+|\\[^\s]/gu;

export function formatProse(line, options) {
  const spans = [...line.matchAll(INLINE)];
  const chunks = [];
  let start = 0;
  for (const match of spans) {
    chunks.push(line.slice(start, match.index));
    start = match.index + match[0].length;
  }
  chunks.push(line.slice(start));
  const chinese = chunks.some((chunk) => HAN.test(chunk));

  return chunks.map((chunk, index) => {
    if (options.lintEmphasis !== false) {
      chunk = chunk.replace(/(?<![\p{L}\p{N}_])_([^_\s](?:[^_]*?[^_\s])?)_(?![\p{L}\p{N}_])/gu, "*$1*");
    }
    if (chinese && options.lintPunctuation !== false && !/^\s{0,3}([-*_])(?:[ \t]*\1){2,}\s*$/.test(line)) {
      chunk = chunk.replace(/[.,;:!?()]/g, (mark, offset, source) => {
        const before = source[offset - 1] ?? "";
        const after = source[offset + 1] ?? "";
        if (/[\w]/.test(before) && /[\w]/.test(after)) return mark;
        if ((mark === "(" || mark === ")") && /[()]/.test(before + after)) return mark;
        return PUNCTUATION[mark];
      }).replace(FULL_WIDTH, "$1");
    }
    if (options.lintCjkSpacing !== false) chunk = spaceText(chunk);
    return chunk + (spans[index]?.[0] ?? "");
  }).join("");
}
