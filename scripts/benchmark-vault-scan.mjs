import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdir, readFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { scanNotes } from "../advanced/ignorance.vault/index/scan.js";

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const workspace = { listFiles, readFile: (path) => readFile(path, "utf8") };
const generator = fileURLToPath(new URL("./generate-vault-probe.mjs", import.meta.url));
const milliseconds = (start) => Number((performance.now() - start).toFixed(2));
const median = (values) => [...values].sort((a, b) => a - b)[1];

for (const files of [1000, 3000, 5000]) {
  const root = execFileSync(process.execPath, [generator, String(files)], { encoding: "utf8" }).trim();
  try {
    const firstMs = [];
    const againMs = [];
    for (let round = 0; round < 3; round++) {
      const firstStart = performance.now();
      const initial = await scanNotes(workspace, root);
      firstMs.push(milliseconds(firstStart));
      assert.equal(initial.entries.length, files);

      const againStart = performance.now();
      const repeated = await scanNotes(workspace, root, JSON.parse(JSON.stringify(initial)));
      againMs.push(milliseconds(againStart));
      assert.equal(repeated.entries.length, files);
      assert.equal(repeated.reused, files);
    }
    console.log(JSON.stringify({
      files, runtime: process.version, source: "node:fs", firstMs, againMs,
      firstMedianMs: median(firstMs), againMedianMs: median(againMs),
    }));
  } finally {
    // The generator owns this unique directory and populated it for this run.
    await rm(dirname(root), { recursive: true, force: true });
  }
}
