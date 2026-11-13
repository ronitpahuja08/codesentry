import { describe, expect, it } from "vitest";

import { scanText } from "../src/scanner/scan-text.js";

describe("secret scanner", () => {
  it("finds provider credentials with locations and redacted evidence", () => {
    const githubToken = `gh${"p"}_${"a".repeat(24)}`;
    const openAiKey = `sk-${"b".repeat(24)}`;
    const findings = scanText({
      path: "src/config.ts",
      content: `const first = "safe";\nconst github = "${githubToken}";\nconst model = "${openAiKey}";`,
    });

    expect(findings.map((finding) => finding.ruleId)).toEqual([
      "secret.github-token",
      "secret.openai-key",
    ]);
    expect(findings.map((finding) => finding.line)).toEqual([2, 3]);
    expect(findings.every((finding) => !finding.evidence.includes("aaaaaaaa"))).toBe(true);
    expect(new Set(findings.map((finding) => finding.fingerprint)).size).toBe(2);
  });

  it("finds credential assignments but ignores documented placeholders", () => {
    const liveValue = ["sup", "er", "-se", "cret", "-value"].join("");
    const findings = scanText({
      path: ".env.example",
      content: `password="change-me"\nclient_secret='${liveValue}'`,
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.ruleId).toBe("secret.generic-assignment");
  });

  it("returns findings in source order", () => {
    const first = `AK${"IA"}${"A".repeat(16)}`;
    const second = `gh${"o"}_${"z".repeat(24)}`;
    const findings = scanText({ path: "config.txt", content: `${first}\n${second}` });

    expect(findings.map((finding) => finding.line)).toEqual([1, 2]);
  });
});
