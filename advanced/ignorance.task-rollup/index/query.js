const collator = new Intl.Collator("zh-CN", { numeric: true });
const DAY = 86_400_000;
const TOKEN = /\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|!=|<=|>=|[()<>=+]|-\d+(?:\.\d+)?|-|[^\s()<>=!+"']+)/gy;

export function queryError(line, message, column = 1) {
  return new Error(`第 ${line} 行第 ${column} 列：${message}`);
}

export function readOptions(source, allowed) {
  const options = new Map();
  for (const [index, raw] of source.split(/\r\n|\n|\r/).entries()) {
    const line = index + 1;
    if (!raw.trim()) continue;
    const match = /^\s*([a-z]+)\s*:\s*(.*?)\s*$/i.exec(raw);
    if (!match) throw queryError(line, "需要「关键字: 值」");
    const key = match[1].toLowerCase();
    if (!allowed.includes(key)) throw queryError(line, `未知关键字 ${key}`);
    if (options.has(key)) throw queryError(line, `重复的关键字 ${key}`);
    if (!match[2]) throw queryError(line, `${key} 缺少值`);
    options.set(key, { value: match[2], line });
  }
  return options;
}

class Expression {
  constructor(source, line) {
    this.source = source;
    this.line = line;
    this.tokens = [];
    for (let offset = 0; offset < source.length;) {
      TOKEN.lastIndex = offset;
      const match = TOKEN.exec(source);
      if (!match) throw queryError(line, "无法识别字符", offset + 1);
      this.tokens.push({ text: match[1], offset: TOKEN.lastIndex - match[1].length });
      offset = TOKEN.lastIndex;
    }
    this.index = 0;
  }

  get token() { return this.tokens[this.index]?.text ?? ""; }

  error(message) {
    return queryError(this.line, message, (this.tokens[this.index]?.offset ?? this.source.length) + 1);
  }

  take(text) {
    if (this.token.toLowerCase() !== text) return false;
    this.index++;
    return true;
  }

  required(message) {
    const token = this.token;
    if (!token || token === ")" || /^(?:and|or)$/i.test(token)) throw this.error(message);
    this.index++;
    return token;
  }

  atom(predicate) {
    if (this.take("(")) {
      const value = this.or(predicate);
      if (!this.take(")")) throw this.error("需要右括号");
      return value;
    }
    return predicate(this);
  }

  and(predicate) {
    let left = this.atom(predicate);
    while (this.take("and")) left = { logic: "and", left, right: this.atom(predicate) };
    return left;
  }

  or(predicate) {
    let left = this.and(predicate);
    while (this.take("or")) left = { logic: "or", left, right: this.and(predicate) };
    return left;
  }

  parse(predicate) {
    const result = this.or(predicate);
    if (this.token) throw this.error("多余的表达式");
    return result;
  }
}

function unquote(value) {
  if (!/^["']/.test(value)) return value;
  return value.slice(1, -1).replace(/\\(["'\\])/g, "$1");
}

function sourcePredicate(parser) {
  const value = unquote(parser.required("需要目录或标签"));
  if (!value || /^[+<>=!\-]$/.test(value)) throw parser.error("需要有效的目录或标签");
  if (value.startsWith("#")) {
    if (value.length === 1) throw parser.error("标签不能为空");
    return { tag: value.slice(1) };
  }
  const folder = value.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/$/, "");
  if (folder.split("/").includes("..") || folder.startsWith("/")) throw parser.error("需要工作区相对目录");
  return { folder };
}

export function parseSource(option) {
  return option ? new Expression(option.value, option.line).parse(sourcePredicate) : null;
}

function expressionMatches(node, predicate) {
  if (!node) return true;
  if (node.logic === "and") return expressionMatches(node.left, predicate) && expressionMatches(node.right, predicate);
  if (node.logic === "or") return expressionMatches(node.left, predicate) || expressionMatches(node.right, predicate);
  return predicate(node);
}

export function sourceIncludes(source, record) {
  return expressionMatches(source, ({ tag, folder }) => tag === undefined
    ? !folder || record.path.startsWith(folder + "/")
    : (record.tags ?? []).includes(tag));
}

export function dayOffset(baseline, days) {
  const date = new Date(Date.parse(`${baseline}T00:00:00Z`) + days * DAY);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : undefined;
}

export function localToday(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function calendarDate(text) {
  if (typeof text !== "string") return undefined;
  const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(text.trim());
  if (!match) return undefined;
  const iso = [match[1], match[2].padStart(2, "0"), match[3].padStart(2, "0")].join("-");
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : undefined;
}

export function compareValue(left, right) {
  if (typeof left === "number" && typeof right === "number") return left - right;
  const leftDate = calendarDate(left);
  const rightDate = calendarDate(right);
  if (leftDate && rightDate) return collator.compare(leftDate, rightDate);
  return collator.compare(String(left), String(right));
}
