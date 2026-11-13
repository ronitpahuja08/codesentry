import type { Finding, ScanRule, SourceFile } from "../domain/finding.js";
import { createFingerprint, normalizePath } from "../domain/finding.js";
import { secretRules } from "./rules.js";

export function scanText(
  source: SourceFile,
  rules: readonly ScanRule[] = secretRules,
): readonly Finding[] {
  const findings = rules.flatMap((rule) =>
    rule.find(source).map((match) => {
      const location = locationAt(source.content, match.index);
      return {
        ruleId: rule.id,
        title: rule.title,
        severity: rule.severity,
        file: normalizePath(source.path),
        line: location.line,
        column: location.column,
        evidence: redact(match.value),
        remediation: rule.remediation,
        fingerprint: createFingerprint(rule.id, source.path, match.value),
      } satisfies Finding;
    }),
  );

  return findings.sort(
    (left, right) =>
      left.file.localeCompare(right.file) || left.line - right.line || left.column - right.column,
  );
}

function locationAt(content: string, index: number): { line: number; column: number } {
  const before = content.slice(0, index);
  const lines = before.split("\n");
  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
  };
}

function redact(value: string): string {
  if (value.length <= 8) {
    return "*".repeat(value.length);
  }
  return `${value.slice(0, 4)}${"*".repeat(Math.min(value.length - 8, 16))}${value.slice(-4)}`;
}
