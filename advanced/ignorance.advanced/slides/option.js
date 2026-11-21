// Reads an ```echarts fence into an option object without eval (the view
// sandbox forbids it). Accepts strict JSON and the JS object style people
// paste from the ECharts examples: unquoted keys, single quotes, trailing
// commas, // and /* */ comments. Functions are not supported.

function skipBlank(source, j) {
  for (;;) {
    while (j < source.length && /\s/.test(source[j])) j++;
    if (source.startsWith("//", j)) {
      while (j < source.length && source[j] !== "\n") j++;
    } else if (source.startsWith("/*", j)) {
      const end = source.indexOf("*/", j + 2);
      j = end < 0 ? source.length : end + 2;
    } else return j;
  }
}

export function toJson(source) {
  let out = "";
  let i = 0;
  const n = source.length;
  while (i < n) {
    const c = source[i];
    if (c === "/" && source[i + 1] === "/") {
      while (i < n && source[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      i = end < 0 ? n : end + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      let s = "";
      i++;
      while (i < n && source[i] !== c) {
        if (source[i] === "\\" && i + 1 < n) {
          const next = source[i + 1];
          s += next === "'" ? "'" : "\\" + next;
          i += 2;
          continue;
        }
        s += source[i] === '"' ? '\\"' : source[i] === "\n" ? "\\n" : source[i];
        i++;
      }
      if (i >= n) throw new Error("Unclosed string.");
      i++;
      out += '"' + s + '"';
      continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let word = "";
      while (i < n && /[\w$]/.test(source[i])) word += source[i++];
      let j = i;
      while (j < n && /\s/.test(source[j])) j++;
      if (source[j] === ":") out += '"' + word + '"';
      else if (word === "true" || word === "false" || word === "null") out += word;
      else if (word === "undefined") out += "null";
      else throw new Error(`Unsupported value "${word}". Functions and variables are not supported; use plain data.`);
      continue;
    }
    if (c === ",") {
      const j = skipBlank(source, i + 1);
      if (source[j] === "}" || source[j] === "]") {
        i++;
        continue;
      }
    }
    out += c;
    i++;
  }
  return out;
}

export function parseOption(source) {
  let text = source.trim();
  // Allow `option = {...};` as copied from the examples site.
  text = text.replace(/^(?:const|let|var)?\s*option\s*=\s*/, "").replace(/;\s*$/, "");
  if (!text) throw new Error("Empty chart.");
  const value = JSON.parse(toJson(text));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("The fence must contain one ECharts option object.");
  return value;
}
