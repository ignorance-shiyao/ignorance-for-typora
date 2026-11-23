import { test } from "node:test";
import assert from "node:assert/strict";
import "../advanced/ignorance.file-viewers/viewers/code/highlight.js";

const { highlight, EXTENSIONS } = globalThis.codeHighlight;
const plain = (html) => html.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const spans = (ext, src, cls) => [...highlight(ext, src).matchAll(/<span class="([^"]+)">([^<]*)<\/span>/g)].filter(([, c]) => c === cls).map(([, , text]) => text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));

const SAMPLES = {
  js: 'import { a } from "./x.js";\n// note\nconst re = `t ${a}`; async function Load(url) { return fetch(url).then((r) => r.json()); }\n/* open',
  ts: 'interface User { id: number }\nexport class Store<T> { private items: T[] = []; get(): User | null { return null; } }',
  py: '@dataclass\nclass P:\n    """doc\n    string"""\n    def run(self, n=0x1f): return f"{n}" # tail',
  java: '@Override public static void main(String[] args) { System.out.println("hi"); } // c',
  go: 'package main\nfunc main() { fmt.Println("hi", 3.5) }\n/* x */',
  rs: "fn main<'a>(x: &'a str) { let c = 'x'; println!(\"{}\", x); }\n#[derive(Debug)]\nstruct S;",
  c: '#include <stdio.h>\nint main(void) { printf("%d\\n", 0x10); return 0; } /* done */',
  sh: '#!/bin/sh\nfor f in *.md; do echo "$f" ${HOME}; done\nbuild() { make; }',
  sql: "SELECT id, count(*) FROM t WHERE name = 'a' -- tail\nORDER BY id DESC;",
  ini: '; comment\n[core]\nname = "x"\nflag = true',
  css: '@media (min-width: 600px) { .card > a:hover, #id { color: #3b6fe8; margin: -2px 1.5rem; background: var(--bg); } }',
  html: '<!doctype html>\n<html lang="zh"><head><style>.a { color: red; }</style></head><body><script>const x = 1;</script><p class="t">a &amp; b</p><!-- c --></body></html>',
};

test("every supported extension maps to a language with rules", () => {
  for (const ext of Object.keys(EXTENSIONS)) assert.equal(typeof highlight(ext, "x"), "string", ext);
});

test("highlighting never changes the text, so it can sit under the textarea", () => {
  for (const [ext, src] of Object.entries(SAMPLES)) assert.equal(plain(highlight(ext, src)), src, ext);
});

test("unknown extensions come back escaped and unstyled", () => {
  assert.equal(highlight("txt", "a < b & c"), "a &lt; b &amp; c");
});

test("javascript colours keywords, calls, strings, comments, numbers and types", () => {
  const src = 'const total = add(1, 2.5); // sum\nconst s = "a"; class Box {}';
  assert.deepEqual(spans("js", src, "c-kw"), ["const", "const", "class"]);
  assert.deepEqual(spans("js", src, "c-fn"), ["add"]);
  assert.deepEqual(spans("js", src, "c-num"), ["1", "2.5"]);
  assert.deepEqual(spans("js", src, "c-str"), ['"a"']);
  assert.deepEqual(spans("js", src, "c-cm"), ["// sum"]);
  assert.deepEqual(spans("js", src, "c-type"), ["Box"]);
});

test("a keyword followed by a parenthesis is a keyword, not a call", () => {
  assert.deepEqual(spans("js", "if (a) { run(); }", "c-kw"), ["if"]);
  assert.deepEqual(spans("js", "if (a) { run(); }", "c-fn"), ["run"]);
});

test("typescript adds type keywords that plain javascript leaves alone", () => {
  assert.deepEqual(spans("ts", "interface A { n: number }", "c-kw"), ["interface", "number"]);
  assert.deepEqual(spans("js", "interface A { n: number }", "c-kw"), []);
});

test("python docstrings are strings and decorators are attributes", () => {
  const src = '@dataclass\ndef f():\n    """doc"""\n    return None';
  assert.deepEqual(spans("py", src, "c-str"), ['"""doc"""']);
  assert.deepEqual(spans("py", src, "c-attr"), ["@dataclass"]);
  assert.deepEqual(spans("py", src, "c-kw"), ["def", "return"]);
});

test("rust lifetimes are not mistaken for character literals", () => {
  const src = "fn f<'a>(x: &'a str) { let c = 'z'; }";
  assert.deepEqual(spans("rs", src, "c-str"), ["'z'"]);
});

test("shell variables and sql keywords in any case", () => {
  assert.deepEqual(spans("sh", 'echo "$HOME" ${PATH}', "c-var"), ["${PATH}"]);
  assert.deepEqual(spans("sql", "select a from t Where b = 1", "c-kw"), ["select", "from", "Where"]);
});

test("ini sections, keys and comments", () => {
  const src = "; c\n[core]\nname = x";
  assert.deepEqual(spans("ini", src, "c-cm"), ["; c"]);
  assert.deepEqual(spans("ini", src, "c-tag"), ["[core]"]);
  assert.deepEqual(spans("ini", src, "c-attr"), ["name"]);
});

test("css colours properties, values, selectors and at-rules", () => {
  const src = ".card { color: #3b6fe8; margin: -2px; }\n@media (min-width: 600px) {}";
  assert.deepEqual(spans("css", src, "c-tag"), [".card"]);
  assert.deepEqual(spans("css", src, "c-attr"), ["color", "margin"]);
  assert.deepEqual(spans("css", src, "c-num"), ["#3b6fe8", "-2px", "600px"]);
  assert.deepEqual(spans("css", src, "c-kw"), ["@media"]);
});

test("html highlights style and script bodies with their own rules", () => {
  const src = "<style>.a { color: red; }</style><script>const x = 1;</script><p id=\"t\">hi</p>";
  assert.deepEqual(spans("html", src, "c-attr"), ["color", "id"]);
  assert.deepEqual(spans("html", src, "c-kw"), ["const"]);
  assert.ok(["<style", "</style", "<script", "</script", "<p", "</p"].every((t) => spans("html", src, "c-tag").includes(t)));
});

test("unterminated strings and comments do not hang or lose text", () => {
  const src = 'const a = "open\nconst b = `x${\n/* never closed';
  assert.equal(plain(highlight("js", src)), src);
});
