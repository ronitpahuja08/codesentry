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

export function formatSarif(findings: readonly Finding[]): string {
  const rules = uniqueRules(findings).map((finding) => ({
    id: finding.ruleId,
    name: finding.title,
    shortDescription: { text: finding.title },
    help: { text: finding.remediation },
    defaultConfiguration: { level: sarifLevel(finding.severity) },
  }));
  const results = findings.map((finding) => ({
    ruleId: finding.ruleId,
    level: sarifLevel(finding.severity),
    message: { text: `${finding.title}: ${finding.evidence}` },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: finding.file },
          region: { startLine: finding.line, startColumn: finding.column },
        },
      },
    ],
    partialFingerprints: { codesentryFinding: finding.fingerprint },
  }));

  return JSON.stringify(
    {
      $schema: "https://json.schemastore.org/sarif-2.1.0.json",
      version: "2.1.0",
      runs: [
        {
          tool: {
            driver: {
              name: "CodeSentry",
              informationUri: "https://github.com/ronitpahuja08/codesentry",
              rules,
            },
          },
          results,
        },
      ],
    },
    null,
    2,
  );
}

function uniqueRules(findings: readonly Finding[]): readonly Finding[] {
  return [...new Map(findings.map((finding) => [finding.ruleId, finding])).values()];
}

function sarifLevel(severity: Finding["severity"]): "error" | "warning" | "note" {
  if (severity === "critical" || severity === "high") {
    return "error";
  }
  if (severity === "medium") {
    return "warning";
  }
  return "note";
}
