export const codeSentryVersion = "0.1.0";

export type {
  Finding,
  ScanRule,
  Severity,
  SourceFile,
} from "./domain/finding.js";
export { collectSourceFiles } from "./filesystem/walk.js";
export { formatJson, formatText } from "./reporters.js";
export { secretRules } from "./scanner/rules.js";
export { scanRepository } from "./scanner/scan-repository.js";
export { scanText } from "./scanner/scan-text.js";
