# CodeSentry

CodeSentry is a repository security scanner built for fast, explainable checks in local development and CI. It walks a codebase, applies deterministic security rules, and reports findings with file locations, severity, evidence, and remediation guidance.

The first milestone focuses on accidental secret exposure. Later milestones will add risky configuration checks, dependency advisories, baseline suppression, SARIF output, pull-request annotations, and a small review dashboard.

## Why this project

Security scanners are most useful when developers can understand why something was flagged and how to fix it. CodeSentry keeps rules explicit and findings structured instead of hiding decisions behind a single risk score.

## Initial capabilities

- recursive repository walking with ignored build and version-control directories
- text-file detection and file-size limits
- high-confidence secret patterns for common credential formats
- generic credential assignment checks with placeholder filtering
- normalized finding fingerprints for future baselines
- human-readable and JSON CLI output
- deterministic offline tests

## Planned architecture

```text
repository walker
    -> file eligibility checks
    -> rule engine
    -> normalized findings
    -> console / JSON / SARIF reporters
    -> CI and pull-request integrations
```

## Roadmap

1. Local secret scanner and CLI
2. Configuration and infrastructure-as-code rules
3. Git-aware changed-line scanning and baselines
4. SARIF reports and GitHub Actions integration
5. Dependency advisory ingestion and policy gates
6. Review dashboard with repository risk trends

## Development

Requires Node.js 24 or newer.

```bash
npm install
npm run check
npm test
npm run build
```

After building:

```bash
node dist/cli.js scan .
node dist/cli.js scan . --format json
```

## License

MIT
