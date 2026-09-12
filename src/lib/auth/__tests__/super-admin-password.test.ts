import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isSuperAdminUnlockConfigured,
  resolveSuperAdminEmail,
  verifySuperAdminPassword,
} from "@/lib/auth/super-admin-password";

describe("super-admin-password", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("está desactivado si no hay secreto configurado", () => {
    vi.stubEnv("SUPER_ADMIN_PASSWORD", "");
    vi.stubEnv("SUPER_ADMIN_PASSWORD_HASH", "");
    expect(isSuperAdminUnlockConfigured()).toBe(false);
  });

  it("acepta la contraseña en texto de entorno", async () => {
    vi.stubEnv("SUPER_ADMIN_PASSWORD", "owner-secret");
    vi.stubEnv("SUPER_ADMIN_PASSWORD_HASH", "");
    expect(isSuperAdminUnlockConfigured()).toBe(true);
    await expect(verifySuperAdminPassword("owner-secret")).resolves.toBe(true);
    await expect(verifySuperAdminPassword("nope")).resolves.toBe(false);
  });

  it("lee el correo opcional para desambiguar", () => {
    vi.stubEnv("SUPER_ADMIN_EMAIL", "  yo@org.com  ");
    expect(resolveSuperAdminEmail()).toBe("yo@org.com");
  });
});
