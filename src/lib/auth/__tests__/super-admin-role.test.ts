import { describe, expect, it } from "vitest";

import {
  isSuperAdminRole,
  SUPER_ADMIN_ROLE,
  toAssignableLoginRole,
} from "@/lib/auth/super-admin-role";

describe("toAssignableLoginRole", () => {
  it("deja pasar roles del equipo", () => {
    expect(toAssignableLoginRole("developer")).toBe("developer");
    expect(toAssignableLoginRole(" qa ")).toBe("qa");
  });

  it("nunca asigna super_admin desde el selector de login", () => {
    expect(toAssignableLoginRole(SUPER_ADMIN_ROLE)).toBeUndefined();
    expect(isSuperAdminRole(SUPER_ADMIN_ROLE)).toBe(true);
  });

  it("ignora valores vacíos", () => {
    expect(toAssignableLoginRole(null)).toBeUndefined();
    expect(toAssignableLoginRole("")).toBeUndefined();
    expect(toAssignableLoginRole("   ")).toBeUndefined();
  });
});
