import { describe, expect, it } from "vitest";

import {
  DEFAULT_ROLE_LANDING,
  resolveRoleLanding,
} from "@/lib/auth/role-landing";

describe("resolveRoleLanding", () => {
  it("lleva a desarrolladores y super admin al dashboard", () => {
    expect(resolveRoleLanding("developer")).toBe("/");
    expect(resolveRoleLanding("super_admin")).toBe("/");
  });

  it("lleva a diseñadores y QA al registro de tiempo", () => {
    expect(resolveRoleLanding("designer")).toBe("/time-log");
    expect(resolveRoleLanding("qa")).toBe("/time-log");
  });

  it("lleva a roles de gestión al reporte de horas", () => {
    expect(resolveRoleLanding("product_owner")).toBe("/reports/time-log");
    expect(resolveRoleLanding("scrum_master")).toBe("/reports/time-log");
    expect(resolveRoleLanding("product_manager")).toBe("/reports/time-log");
  });

  it("usa el dashboard como fallback para rol desconocido, null o undefined", () => {
    expect(resolveRoleLanding("otro_rol")).toBe(DEFAULT_ROLE_LANDING);
    expect(resolveRoleLanding(null)).toBe(DEFAULT_ROLE_LANDING);
    expect(resolveRoleLanding(undefined)).toBe(DEFAULT_ROLE_LANDING);
    expect(resolveRoleLanding("")).toBe(DEFAULT_ROLE_LANDING);
  });
});
