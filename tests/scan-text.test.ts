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

  it("flags mutable image tags only in Dockerfiles", () => {
    const dockerfile = scanText({
      path: "containers/Dockerfile",
      content: "FROM node:latest\nRUN node --version\n",
    });
    const markdown = scanText({
      path: "docs/containers.md",
      content: "Use FROM node:latest only for a local experiment.",
    });

    expect(dockerfile.map((finding) => finding.ruleId)).toContain("container.mutable-image-tag");
    expect(markdown).toHaveLength(0);
  });

  it("flags Dockerfiles that explicitly select the root user", () => {
    const findings = scanText({
      path: "Dockerfile",
      content: 'FROM node:24-bookworm\nUSER root\nCMD ["node", "app.js"]\n',
    });

    expect(findings).toEqual(
      expect.arrayContaining([expect.objectContaining({ ruleId: "container.root-user", line: 2 })]),
    );
  });

  it("flags mutable action tags only inside GitHub workflow files", () => {
    const workflow = scanText({
      path: ".github/workflows/ci.yml",
      content: "steps:\n  - uses: actions/checkout@v4\n",
    });
    const document = scanText({
      path: "docs/actions.md",
      content: "Use actions/checkout@v4 in a workflow.",
    });

    expect(workflow.map((finding) => finding.ruleId)).toContain("workflow.unpinned-action");
    expect(document).toHaveLength(0);
  });

  it("flags pull_request_target triggers only inside GitHub workflow files", () => {
    const workflow = scanText({
      path: ".github/workflows/privileged.yml",
      content: "on:\n  pull_request_target:\n    types: [opened]\n",
    });
    const document = scanText({
      path: "docs/workflow-security.md",
      content: "Avoid pull_request_target: unless a workflow needs it.",
    });

    expect(workflow).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "workflow.pull-request-target",
          line: 2,
          severity: "high",
        }),
      ]),
    );
    expect(document).toHaveLength(0);
  });
});
