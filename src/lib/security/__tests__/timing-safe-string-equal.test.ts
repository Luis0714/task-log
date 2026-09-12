import { describe, expect, it } from "vitest";

import { timingSafeStringEqual } from "@/lib/security/timing-safe-string-equal";

describe("timingSafeStringEqual", () => {
  it("acepta strings idénticos", () => {
    expect(timingSafeStringEqual("secret", "secret")).toBe(true);
  });

  it("rechaza strings distintos de la misma longitud", () => {
    expect(timingSafeStringEqual("secret", "secreT")).toBe(false);
  });

  it("rechaza strings de distinta longitud", () => {
    expect(timingSafeStringEqual("ab", "abc")).toBe(false);
    expect(timingSafeStringEqual("", "a")).toBe(false);
  });

  it("acepta strings vacíos", () => {
    expect(timingSafeStringEqual("", "")).toBe(true);
  });
});
