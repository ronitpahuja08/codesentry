import type { ScanRule, SourceFile } from "../domain/finding.js";

interface PatternRuleOptions {
  readonly id: string;
  readonly title: string;
  readonly severity: ScanRule["severity"];
  readonly remediation: string;
  readonly pattern: RegExp;
  readonly valueGroup?: number;
  readonly reject?: (value: string) => boolean;
  readonly appliesTo?: (source: SourceFile) => boolean;
}

const placeholders = [
  "example",
  "sample",
  "dummy",
  "test",
  "replace-me",
  "change-me",
  "changeme",
  "your-key",
  "your_key",
  "redacted",
  "placeholder",
];

function isPlaceholder(value: string): boolean {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("${") ||
    placeholders.some((placeholder) => normalized.includes(placeholder))
  );
}

function patternRule(options: PatternRuleOptions): ScanRule {
  return {
    id: options.id,
    title: options.title,
    severity: options.severity,
    remediation: options.remediation,
    find(source: SourceFile) {
      if (options.appliesTo && !options.appliesTo(source)) {
        return [];
      }
      const flags = options.pattern.flags.includes("g")
        ? options.pattern.flags
        : `${options.pattern.flags}g`;
      const pattern = new RegExp(options.pattern.source, flags);
      const matches = [];

      for (const match of source.content.matchAll(pattern)) {
        const raw = match[options.valueGroup ?? 0];
        if (raw === undefined || match.index === undefined || options.reject?.(raw)) {
          continue;
        }
        const fullMatch = match[0];
        const offset = fullMatch.indexOf(raw);
        matches.push({ index: match.index + Math.max(offset, 0), value: raw });
      }

      return matches;
    },
  };
}

const rotateCredential =
  "Remove the credential from history, rotate it with the provider, and load the replacement from a secret manager.";

function isDockerfile(source: SourceFile): boolean {
  return source.path.split(/[\\/]/).at(-1)?.toLowerCase() === "dockerfile";
}

export const secretRules: readonly ScanRule[] = [
  patternRule({
    id: "secret.github-token",
    title: "GitHub access token",
    severity: "critical",
    remediation: rotateCredential,
    pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,255}\b/g,
  }),
  patternRule({
    id: "secret.openai-key",
    title: "OpenAI API key",
    severity: "critical",
    remediation: rotateCredential,
    pattern: /\bsk-[A-Za-z0-9_-]{20,255}\b/g,
  }),
  patternRule({
    id: "secret.aws-access-key",
    title: "AWS access key identifier",
    severity: "critical",
    remediation: rotateCredential,
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
  }),
  patternRule({
    id: "secret.private-key",
    title: "Private key material",
    severity: "critical",
    remediation:
      "Remove the private key, revoke its certificate or credential, and issue a new key pair.",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  }),
  patternRule({
    id: "secret.generic-assignment",
    title: "Hard-coded credential assignment",
    severity: "high",
    remediation:
      "Move the value to a secret manager or environment variable and rotate it if it is live.",
    pattern:
      /(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*["']([^"'\r\n]{8,})["']/gi,
    valueGroup: 1,
    reject: isPlaceholder,
  }),
  patternRule({
    id: "container.mutable-image-tag",
    title: "Mutable container image tag",
    severity: "medium",
    remediation:
      "Pin the base image to an immutable version or digest so builds remain reproducible.",
    pattern: /^\s*FROM\s+[^\s#]+:latest\b/gim,
    appliesTo: isDockerfile,
  }),
  patternRule({
    id: "container.root-user",
    title: "Container runs as root",
    severity: "medium",
    remediation:
      "Create and select an unprivileged user before the final container stage whenever the workload does not require root.",
    pattern: /^\s*USER\s+root\s*$/gim,
    appliesTo: isDockerfile,
  }),
];
