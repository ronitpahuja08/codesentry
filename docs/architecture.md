# Architecture

CodeSentry separates collection, detection, and reporting so each layer can evolve independently.

## Repository walker

The walker owns filesystem boundaries. It skips known generated directories, symbolic links, oversized files, and binary content before any rule receives data.

## Rule engine

Rules are pure functions over a source file. A rule declares its identifier, title, severity, and remediation, then returns exact matches. Pure rules keep tests deterministic and make future parallel scanning straightforward.

## Finding model

Every finding contains a stable rule identifier, location, redacted evidence, and fingerprint. Reporters consume this model without knowing how the finding was produced.

## Reporters

The initial reporters are terminal text and JSON. SARIF will use the same finding model, avoiding security logic in presentation code.

## Trust boundaries

- scanned repositories are untrusted input
- file contents must never be executed
- evidence is redacted before it reaches logs
- symbolic links are not followed
- provider integrations will remain optional adapters
