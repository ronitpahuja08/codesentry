import { createHash } from "node:crypto";

export type Severity = "critical" | "high" | "medium" | "low";

export interface SourceFile {
  readonly path: string;
  readonly content: string;
}

export interface Finding {
  readonly ruleId: string;
  readonly title: string;
  readonly severity: Severity;
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly evidence: string;
  readonly remediation: string;
  readonly fingerprint: string;
}

export interface RuleMatch {
  readonly index: number;
  readonly value: string;
}

export interface ScanRule {
  readonly id: string;
  readonly title: string;
  readonly severity: Severity;
  readonly remediation: string;
  find(source: SourceFile): readonly RuleMatch[];
}

export function createFingerprint(ruleId: string, file: string, value: string): string {
  return createHash("sha256")
    .update(`${ruleId}\0${normalizePath(file)}\0${value}`)
    .digest("hex")
    .slice(0, 24);
}

export function normalizePath(path: string): string {
  return path.replaceAll("\\", "/");
}
