import { lstat, readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

import type { SourceFile } from "../domain/finding.js";
import { normalizePath } from "../domain/finding.js";

const defaultIgnoredDirectories = new Set([
  ".git",
  ".hg",
  ".svn",
  ".venv",
  "coverage",
  "dist",
  "node_modules",
  "target",
  "vendor",
]);

export interface WalkOptions {
  readonly maxFileBytes?: number;
  readonly ignoredDirectories?: ReadonlySet<string>;
}

export async function collectSourceFiles(
  root: string,
  options: WalkOptions = {},
): Promise<readonly SourceFile[]> {
  const absoluteRoot = resolve(root);
  const maxFileBytes = options.maxFileBytes ?? 1_000_000;
  const ignoredDirectories = options.ignoredDirectories ?? defaultIgnoredDirectories;
  const files: SourceFile[] = [];

  await visit(absoluteRoot);
  return files.sort((left, right) => left.path.localeCompare(right.path));

  async function visit(path: string): Promise<void> {
    const metadata = await lstat(path);
    if (metadata.isSymbolicLink()) {
      return;
    }
    if (metadata.isDirectory()) {
      const entries = await readdir(path, { withFileTypes: true });
      for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
        if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
          continue;
        }
        await visit(resolve(path, entry.name));
      }
      return;
    }
    if (!metadata.isFile() || metadata.size > maxFileBytes) {
      return;
    }

    const buffer = await readFile(path);
    if (buffer.includes(0)) {
      return;
    }
    files.push({
      path: normalizePath(relative(absoluteRoot, path) || path),
      content: buffer.toString("utf8"),
    });
  }
}
