const HAN = /\p{Script=Han}/u;
const LATIN = /^[a-z]{3,}$/;
const TOKEN = /\p{Script=Han}|[\p{L}\p{N}]+/gu;
const normalize = (value) => value.normalize("NFKC").toLowerCase();
const collator = new Intl.Collator("zh-CN", { numeric: true });

function terms(value) {
  const result = [];
  let previousHan = "";
  let latin = "";
  for (const char of normalize(value)) {
    if (HAN.test(char)) {
      if (latin) result.push(latin);
      latin = "";
      if (previousHan) result.push(previousHan + char);
      result.push(char);
      previousHan = char;
    } else {
      previousHan = "";
      if (/[\p{L}\p{N}]/u.test(char)) latin += char;
      else if (latin) {
        result.push(latin);
        latin = "";
      }
    }
  }
  if (latin) result.push(latin);
  return result;
}

export function parseSearch(source) {
  const query = { required: [], phrases: [], excluded: [], paths: [], tags: [] };
  const pattern = /\s*(-?)(?:(path|tag):)?(?:"([^"]+)"|([^\s"]+))/gy;
  const input = source.trim();
  for (let offset = 0; offset < input.length;) {
    pattern.lastIndex = offset;
    const match = pattern.exec(input);
    if (!match) throw new Error(`第 ${offset + 1} 字符：需要完整关键词或双引号短语`);
    offset = pattern.lastIndex;
    const [, negate, filter, phrase, bare] = match;
    const value = normalize(phrase ?? bare);
    if (negate) query.excluded.push(value);
    else if (filter === "path") query.paths.push(value.replace(/^\.\//, "").replace(/\/$/, ""));
    else if (filter === "tag") query.tags.push(value.replace(/^#/, ""));
    else if (phrase) query.phrases.push(value);
    else query.required.push(value);
  }
  return query;
}

export function createSearchIndex(records) {
  const postings = new Map();
  const wordsByLength = new Map();
  const documents = records.map((note, id) => {
    const headings = note.headings.map(({ text }) => text).join(" ");
    const body = terms(note.body);
    const counts = new Map();
    for (const [values, weight] of [[body, 1], [terms(note.name), 2], [terms(headings), 3]]) {
      for (const token of values) counts.set(token, (counts.get(token) ?? 0) + weight);
    }
    for (const [token, frequency] of counts) {
      if (!postings.has(token)) {
        postings.set(token, new Map());
        if (LATIN.test(token)) {
          if (!wordsByLength.has(token.length)) wordsByLength.set(token.length, []);
          wordsByLength.get(token.length).push(token);
        }
      }
      postings.get(token).set(id, frequency);
    }
    return {
      note, length: Math.max(1, body.length),
      haystack: normalize(`${note.name}\n${headings}\n${note.body}`),
      path: normalize(note.path), tags: note.tags.map(normalize),
    };
  });
  const averageLength = documents.reduce((sum, doc) => sum + doc.length, 0) / documents.length || 1;
  return { documents, postings, wordsByLength, averageLength, alternatives: new Map() };
}

function distance(first, second, limit) {
  let previous = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let row = 1; row <= first.length; row++) {
    const next = [row];
    let smallest = row;
    for (let column = 1; column <= second.length; column++) {
      next[column] = Math.min(previous[column] + 1, next[column - 1] + 1,
        previous[column - 1] + Number(first[row - 1] !== second[column - 1]));
      smallest = Math.min(smallest, next[column]);
    }
    if (smallest > limit) return limit + 1;
    previous = next;
  }
  return previous[second.length];
}

function alternatives(index, term) {
  if (index.postings.has(term) || !LATIN.test(term)) return [[term, 1]];
  const cached = index.alternatives.get(term);
  if (cached) return cached;
  const allowance = term.length >= 7 ? 2 : 1;
  const words = [];
  for (let length = term.length - allowance; length <= term.length + allowance; length++) {
    for (const candidate of index.wordsByLength.get(length) ?? []) {
      const edits = distance(term, candidate, allowance);
      if (edits <= allowance) words.push([candidate, 1 / (1 + edits)]);
    }
  }
  if (index.alternatives.size >= 128) index.alternatives.clear();
  index.alternatives.set(term, words);
  return words;
}

function scoreTerm(index, matches) {
  const scores = new Map();
  for (const [word, weight] of matches) {
    const posting = index.postings.get(word);
    if (!posting) continue;
    const idf = Math.log1p((index.documents.length - posting.size + 0.5) / (posting.size + 0.5));
    for (const [id, tf] of posting) {
      const factor = 0.3 + 0.9 * index.documents[id].length / index.averageLength;
      scores.set(id, Math.max(scores.get(id) ?? 0, weight * idf * (tf * 2.2) / (tf + factor)));
    }
  }
  return scores;
}

function escapePattern(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function excerpt(note, keywords) {
  const usable = [...new Set(keywords)].filter(Boolean).sort((first, second) => second.length - first.length);
  const regex = usable.length ? new RegExp(usable.map(escapePattern).join("|"), "giu") : null;
  let heading = "";
  let best = { heading: note.headings[0]?.text ?? "", line: note.body.split("\n").find(Boolean) ?? note.name, score: 0 };
  for (const raw of note.body.split("\n")) {
    const title = /^#{1,6}\s+(.+)$/.exec(raw.trim());
    if (title) heading = title[1];
    const line = title?.[1] ?? raw.trim();
    const matches = regex ? [...line.matchAll(regex)] : [];
    const score = matches.reduce((total, match) => total + match[0].length ** 2, 0) + (matches.length && title ? 2 : 0);
    if (score > best.score) best = { heading, line, score, start: matches[0]?.index ?? 0 };
  }
  const start = Math.max(0, (best.start ?? 0) - 25);
  const line = (start ? "…" : "") + best.line.slice(start, start + 150) + (best.line.length > start + 150 ? "…" : "");
  const snippet = [];
  let offset = 0;
  for (const match of regex ? line.matchAll(regex) : []) {
    if (offset < match.index) snippet.push({ text: line.slice(offset, match.index), match: false });
    snippet.push({ text: match[0], match: true });
    offset = match.index + match[0].length;
  }
  if (offset < line.length) snippet.push({ text: line.slice(offset), match: false });
  return { name: note.name, path: note.path, heading: best.heading, snippet };
}

export function searchNotes(index, query, limit = 30) {
  const required = [...new Set(query.required.flatMap((term) => term.match(TOKEN) ?? []))];
  const optional = [...new Set(query.required.flatMap(terms))].filter((term) => !required.includes(term));
  const expansions = required.map((term) => alternatives(index, term));
  const groups = expansions.map((matches) => scoreTerm(index, matches));
  groups.sort((a, b) => a.size - b.size);
  const boosts = optional.map((word) => scoreTerm(index, [[word, 0.65]]));
  const candidates = groups.length ? groups[0].keys() : index.documents.keys();
  const hits = [];
  for (const id of candidates) {
    const doc = index.documents[id];
    if (!groups.every((group) => group.has(id))) continue;
    if (!query.paths.every((path) => doc.path === path || doc.path.startsWith(path + "/"))) continue;
    if (!query.tags.every((tag) => doc.tags.includes(tag))) continue;
    if (query.excluded.some((word) => doc.haystack.includes(word))) continue;
    if (!query.phrases.every((phrase) => doc.haystack.includes(phrase))) continue;
    let score = 0;
    for (const group of groups) score += group.get(id);
    for (const boost of boosts) score += boost.get(id) ?? 0;
    for (const phrase of [...query.required, ...query.phrases]) {
      if (doc.haystack.includes(phrase)) score += 1.2;
    }
    hits.push({ note: doc.note, score });
  }
  hits.sort((a, b) => b.score - a.score || collator.compare(a.note.path, b.note.path));
  const keywords = [...query.required, ...query.phrases, ...expansions.flatMap((matches) => matches.map(([word]) => word))];
  return hits.slice(0, limit).map(({ note, score }) => ({ ...excerpt(note, keywords), score }));
}
