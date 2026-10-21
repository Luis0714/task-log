import { describe, expect, it } from "vitest";

import { resolvePostLoginPath, sanitizeReturnPath } from "@/lib/auth/return-path";

describe("sanitizeReturnPath", () => {
  it("conserva la ruta compartida con sus filtros", () => {
    const path = "/reports/review-times?month=2026-10&repository=NARP-WEB&project=NARP";
    expect(sanitizeReturnPath(path)).toBe(path);
  });

  it("rechaza direcciones externas y las pantallas de acceso", () => {
    expect(sanitizeReturnPath("https://evil.example/phish")).toBeNull();
    expect(sanitizeReturnPath("//evil.example")).toBeNull();
    expect(sanitizeReturnPath("/\\evil.example")).toBeNull();
    expect(sanitizeReturnPath("/%2F%2Fevil.example")).toBeNull();
    expect(sanitizeReturnPath("/login")).toBeNull();
    expect(sanitizeReturnPath("/api/auth/azdo/start")).toBeNull();
    expect(sanitizeReturnPath("")).toBeNull();
  });
});

describe("resolvePostLoginPath", () => {
  it("vuelve a la url compartida antes que al inicio del rol", () => {
    expect(
      resolvePostLoginPath("/reports/review-times?month=2026-10", "developer"),
    ).toBe("/reports/review-times?month=2026-10");
  });

  it("usa el inicio del rol cuando no hay una vuelta segura", () => {
    expect(resolvePostLoginPath(null, "developer")).toBe("/");
    expect(resolvePostLoginPath("https://evil.example", "qa")).toBe("/time-log");
  });
});
