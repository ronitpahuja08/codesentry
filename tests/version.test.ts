import { describe, expect, it } from "vitest";

import { codeSentryVersion } from "../src/index.js";

describe("CodeSentry package", () => {
  it("exposes a semantic version", () => {
    expect(codeSentryVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
