#!/usr/bin/env node

import { resolve } from "node:path";

import { formatJson, formatText } from "./reporters.js";
import { scanRepository } from "./scanner/scan-repository.js";

const args = process.argv.slice(2);
const command = args[0];

if (command !== "scan") {
  console.error("Usage: codesentry scan [path] [--format text|json]");
  process.exitCode = 2;
} else {
  const parsed = parseScanArguments(args.slice(1));
  if (parsed.error !== undefined) {
    console.error(parsed.error);
    process.exitCode = 2;
  } else {
    const target = resolve(parsed.target);
    const findings = await scanRepository(target);
    console.log(parsed.format === "json" ? formatJson(findings) : formatText(findings));
    process.exitCode = findings.length === 0 ? 0 : 1;
  }
}

interface ScanArguments {
  readonly target: string;
  readonly format: "text" | "json";
  readonly error?: string;
}

function parseScanArguments(values: readonly string[]): ScanArguments {
  let target = ".";
  let targetSeen = false;
  let format: ScanArguments["format"] = "text";

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--format") {
      const requested = values[index + 1];
      if (requested !== "text" && requested !== "json") {
        return { target, format, error: "--format must be text or json" };
      }
      format = requested;
      index += 1;
      continue;
    }
    if (value?.startsWith("--")) {
      return { target, format, error: `Unknown option: ${value}` };
    }
    if (value !== undefined && !targetSeen) {
      target = value;
      targetSeen = true;
      continue;
    }
    if (value !== undefined) {
      return { target, format, error: `Unexpected argument: ${value}` };
    }
  }

  return { target, format };
}
