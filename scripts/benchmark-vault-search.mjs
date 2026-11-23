import { performance } from "node:perf_hooks";
import { readFileSync, readdirSync } from "node:fs";
import { parseVaultNote } from "../packages/vault-core/parse.js";
import { createSearchIndex, parseSearch, searchNotes } from "../advanced/ignorance.vault-search/index/search.js";

const folder = new URL("../tests/fixtures/vault/检索/", import.meta.url);
const samples = readdirSync(folder).sort().map((file) =>
  parseVaultNote("检索/" + file, readFileSync(new URL(file, folder), "utf8")));
const notes = Array.from({ length: 5000 }, (_, index) => {
  const sample = samples[index % samples.length];
  return { ...sample, path: `批次${index}/${sample.path}` };
});

const beforeIndex = performance.now();
const searchIndex = createSearchIndex(notes);
const indexMs = performance.now() - beforeIndex;
const queries = ["知识图谱", "notebokk", '"完整短语" -排除词 tag:#重要', "测试记录", "极光定位"];
const durations = Array.from({ length: 50 }, (_, index) => {
  const before = performance.now();
  searchNotes(searchIndex, parseSearch(queries[index % queries.length]));
  return performance.now() - before;
}).sort((a, b) => a - b);
const fixed = (number) => Number(number.toFixed(2));
console.log(JSON.stringify({
  runtime: process.version, platform: process.platform, arch: process.arch,
  files: notes.length, rounds: durations.length, indexMs: fixed(indexMs),
  medianMs: fixed((durations[24] + durations[25]) / 2),
  p95Ms: fixed(durations[47]), maxMs: fixed(durations.at(-1)),
}));
