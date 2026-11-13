import { describe, expect, it } from "vitest";

import type { Finding } from "../src/domain/finding.js";
import { formatJson, formatText } from "../src/reporters.js";

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
});
