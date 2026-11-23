import { cp, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const ids = ["property-query", "task-rollup", "value-track", "backlinks", "flashcards", "vault-search"];
export const source = new URL("../packages/vault-core/", import.meta.url);

export async function destinations() {
  const targets = [];
  for (const id of ids) {
    const extension = new URL(`../advanced/ignorance.${id}/`, import.meta.url);
    const info = await stat(extension).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
    if (info?.isDirectory()) targets.push(new URL("core/", extension));
  }
  return targets;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const target of await destinations()) {
    await rm(target, { recursive: true, force: true });
    await cp(source, target, { recursive: true });
    process.stdout.write(fileURLToPath(target) + "\n");
  }
}
