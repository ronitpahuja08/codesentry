import { describe, expect, it } from "vitest";

import type { Finding } from "../src/domain/finding.js";
import { formatJson, formatSarif, formatText } from "../src/reporters.js";

const finding: Finding = {
  ruleId: "secret.demo",
  title: "Demo secret",
  severity: "high",
  file: "src/app.ts",
  line: 4,
  column: 9,
  evidence: "demo****alue",
  remediation: "Rotate it.",
  fingerprint: "abc123",
};

describe("reporters", () => {
  it("renders a readable terminal report", () => {
    expect(formatText([finding])).toContain("HIGH secret.demo src/app.ts:4:9");
  });

  it("renders a versioned JSON report", () => {
    expect(JSON.parse(formatJson([finding]))).toEqual({ version: 1, findings: [finding] });
  });

  it("reports a clean scan", () => {
    expect(formatText([])).toBe("CodeSentry found no issues.");
  });

  it("renders portable SARIF with rule and source locations", () => {
    const report = JSON.parse(formatSarif([finding])) as {
      version: string;
      runs: Array<Record<string, unknown>>;
    };

    expect(report.version).toBe("2.1.0");
    expect(report.runs[0]).toMatchObject({
      tool: { driver: { name: "CodeSentry", rules: [{ id: "secret.demo" }] } },
      results: [
        {
          level: "error",
          locations: [{ physicalLocation: { artifactLocation: { uri: "src/app.ts" } } }],
        },
      ],
    });
  });
});
