import { parseVaultNote } from "./parse.js";

const MAX_FILES = 5000;
const MAX_DEPTH = 8;
const NOTE_EXTENSION = /\.(?:md|markdown)$/i;

export function relativePath(root, file) {
  const base = root.replaceAll("\\", "/").replace(/\/+$/, "");
  const normalized = file.replaceAll("\\", "/");
  const path = normalized.startsWith(base + "/") ? normalized.slice(base.length + 1) : normalized;
  if (!path || /^(?:\/|[a-z]:)/i.test(path) || path.split("/").some((part) => part === ".." || part === "." || !part)) return null;
  return path;
}

export function excludedPath(path, patterns) {
  const folders = path.split("/").slice(0, -1).join("/");
  return patterns.some((pattern) => {
    const folder = pattern.trim().replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
    if (!folder) return false;
    if (!folder.includes("/")) return folders.split("/").includes(folder);
    return folders === folder || folders.startsWith(folder + "/");
  });
}

export async function contentHash(text, cryptoProvider = globalThis.crypto) {
  const bytes = new TextEncoder().encode(text);
  const buffer = await cryptoProvider.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function scanNotes(workspace, root, previous, options = {}) {
  const { exclude = [], hash = contentHash, onProgress = () => {} } = options;
  const listed = await workspace.listFiles(root);
  const notes = listed.slice(0, MAX_FILES).flatMap((file) => {
    const path = relativePath(root, file);
    return path && NOTE_EXTENSION.test(path) && !excludedPath(path, exclude) ? [{ file, path }] : [];
  });
  const cached = new Map((previous?.entries ?? []).map((entry) => [entry.note.path, entry]));
  const entries = [];
  const unreadable = [];
  let reused = 0;
  for (let offset = 0; offset < notes.length; offset += 16) {
    const batch = await Promise.all(notes.slice(offset, offset + 16).map(async ({ file, path }) => {
      try {
        const contents = await workspace.readFile(file);
        const digest = await hash(contents);
        const saved = cached.get(path);
        if (saved?.hash === digest) {
          return { hash: digest, note: saved.note, live: saved.live, reused: true };
        }
        return { hash: digest, note: parseVaultNote(path, contents) };
      } catch {
        const saved = cached.get(path);
        unreadable.push(path);
        return saved;
      }
    }));
    for (const entry of batch) {
      if (!entry) continue;
      const { reused: isReused, ...record } = entry;
      if (isReused) reused++;
      entries.push(record);
    }
    onProgress(Math.min(offset + 16, notes.length), notes.length);
  }
  return {
    entries, reused, unreadable,
    limit: listed.length >= MAX_FILES,
    depthLimit: listed.some((file) => (relativePath(root, file)?.split("/").length ?? 0) >= MAX_DEPTH),
  };
}
