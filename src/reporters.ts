import type { Finding } from "./domain/finding.js";

export function formatText(findings: readonly Finding[]): string {
  if (findings.length === 0) {
    return "CodeSentry found no issues.";
  }

  const rows = findings.map(
    (finding) =>
      `${finding.severity.toUpperCase()} ${finding.ruleId} ${finding.file}:${finding.line}:${finding.column}\n` +
      `  ${finding.title}: ${finding.evidence}\n` +
      `  Fix: ${finding.remediation}`,
  );
  return [`CodeSentry found ${findings.length} issue(s).`, "", ...rows].join("\n");
}

export function formatJson(findings: readonly Finding[]): string {
  return JSON.stringify({ version: 1, findings }, null, 2);
}
