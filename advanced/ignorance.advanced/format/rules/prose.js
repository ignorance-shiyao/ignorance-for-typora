import { spaceText } from "../cjk-spacing.js";

const HAN_PUNCTUATION = /(?<=\p{Script=Han})[.,;:!?()]|[.,;:!?()](?=\p{Script=Han})/gu;
const PUNCTUATION = { ",": "，", ".": "。", ";": "；", ":": "：", "!": "！", "?": "？", "(": "（", ")": "）" };
const FULL_WIDTH = /[ \t]*([，。；：！？（）])[ \t]*/g;
const INLINE = /(?<ticks>`+)(?!`)[\s\S]*?(?<!`)\k<ticks>(?!`)|\$\$[\s\S]*?\$\$|\$[^$\n]+\$|!?\[(?:\\.|[^\]\\\n])*\](?:\((?:\\.|[^()\\\n]|\((?:\\.|[^()\\\n])*\))*\)|\[[^\]\n]*\])|\[\[[^\]\n]+\]\]|\[\^[^\]\n]+\]|<!--[^]*?-->|<[^>\n]+>|(?:https?:\/\/|www\.)[^\s<>，。；：！？（）]+|\\[^\s]/gu;

export function formatProse(line, options) {
  const spans = [...line.matchAll(INLINE)];
  const chunks = [];
  let start = 0;
  for (const match of spans) {
    chunks.push(line.slice(start, match.index));
    start = match.index + match[0].length;
  }
  chunks.push(line.slice(start));

  return chunks.map((chunk, index) => {
    if (options.lintEmphasis !== false) {
      chunk = chunk.replace(/(?<![\p{L}\p{N}_])_([^_\s](?:[^_]*?[^_\s])?)_(?![\p{L}\p{N}_])/gu, "*$1*");
    }
    if (options.lintPunctuation !== false) {
      chunk = chunk.replace(HAN_PUNCTUATION, (mark) => PUNCTUATION[mark]).replace(FULL_WIDTH, "$1");
    }
    if (options.lintCjkSpacing !== false) chunk = spaceText(chunk);
    return chunk + (spans[index]?.[0] ?? "");
  }).join("");
}
