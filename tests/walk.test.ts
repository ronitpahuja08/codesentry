import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { collectSourceFiles } from "../src/filesystem/walk.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true })));
});

describe("repository walker", () => {
  it("collects text while ignoring dependencies and binary files", async () => {
    const root = await mkdtemp(join(tmpdir(), "codesentry-"));
    temporaryDirectories.push(root);
    await mkdir(join(root, "src"));
    await mkdir(join(root, "node_modules"));
    await writeFile(join(root, "src", "app.ts"), "export const ready = true;\n");
    await writeFile(join(root, "src", "logo.bin"), Buffer.from([1, 0, 2]));
    await writeFile(join(root, "node_modules", "ignored.js"), "credential = 'not-scanned';\n");

    const files = await collectSourceFiles(root);

    expect(files).toEqual([{ path: "src/app.ts", content: "export const ready = true;\n" }]);
  });

  it("honors the maximum file size", async () => {
    const root = await mkdtemp(join(tmpdir(), "codesentry-"));
    temporaryDirectories.push(root);
    await writeFile(join(root, "large.txt"), "123456789");

    expect(await collectSourceFiles(root, { maxFileBytes: 4 })).toEqual([]);
  });
});
