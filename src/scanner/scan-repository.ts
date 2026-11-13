import type { Finding } from "../domain/finding.js";
import { collectSourceFiles } from "../filesystem/walk.js";
import { scanText } from "./scan-text.js";

export async function scanRepository(root: string): Promise<readonly Finding[]> {
  const sources = await collectSourceFiles(root);
  return sources.flatMap((source) => scanText(source));
}
