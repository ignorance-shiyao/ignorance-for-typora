import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { parseVaultNote } from "../advanced/ignorance.vault-search/core/parse.js";
import { createSearchIndex, parseSearch, searchNotes } from "../advanced/ignorance.vault-search/index/search.js";

const root = new URL("./fixtures/vault/检索/", import.meta.url);
const notePaths = readdirSync(root).sort();
const index = createSearchIndex(notePaths.map((file) => parseVaultNote("检索/" + file, readFileSync(new URL(file, root), "utf8"))));
const names = (source) => searchNotes(index, parseSearch(source), 3).map(({ name }) => name);

test("ranks 50 fixed fixtures by title and separated Chinese words", () => {
  assert.equal(notePaths.length, 50);
  assert.deepEqual(names("极光定位"), ["01-极光"]);
  assert.deepEqual(names("知识图谱"), ["02-知识图谱", "03-知识与图谱", "04-概念"]);
});

test("supports phrase, exclusion, tag, path and English misspelling", () => {
  assert.deepEqual(names('"完整短语" -排除词 path:检索/ tag:#重要'), ["06-短语"]);
  assert.deepEqual(names("notebokk"), ["05-英文"]);
  assert.deepEqual(names("path:其他/"), []);
  assert.throws(() => parseSearch('"坏短语'), /第 1 字符/);
});

test("returns a heading and marked spans for the matching snippet", () => {
  const [result] = searchNotes(index, parseSearch("知识图谱"), 3);
  assert.equal(result.heading, "知识图谱");
  assert.ok(result.snippet.some(({ match }) => match));
});

test("returns no results for blank searches and still supports filter-only searches", () => {
  assert.deepEqual(names(""), []);
  assert.deepEqual(names(" \t\n"), []);
  assert.ok(names("path:检索/").length > 0);
});
