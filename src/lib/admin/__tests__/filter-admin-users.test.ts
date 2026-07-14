import { describe, expect, it } from "vitest";

import type { UserWithRole } from "@/lib/db/ports/user.repository.port";
import { filterAdminUsersByQuery } from "@/lib/admin/filter-admin-users";

const user = (overrides: Partial<UserWithRole>): UserWithRole => ({
  id: "id",
  displayName: null,
  email: null,
  authProvider: "local",
  roleId: null,
  roleName: null,
  roleDisplayName: null,
  project: null,
  adoOrganization: null,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const users: UserWithRole[] = [
  user({ id: "1", displayName: "Sandra Pérez", project: "TaskPilot" }),
  user({ id: "2", displayName: "Diego López", project: "Mi Proyecto" }),
  user({ id: "3", displayName: "Ana Ruiz", project: "TASKPILOT" }),
  user({ id: "4", displayName: "Carlos Méndez", project: null }),
];

describe("filterAdminUsersByQuery", () => {
  it("devuelve todos los usuarios cuando el query está vacío", () => {
    expect(filterAdminUsersByQuery(users, "")).toEqual(users);
    expect(filterAdminUsersByQuery(users, "   ")).toEqual(users);
  });

  it("filtra por nombre de usuario (case-insensitive, sin acentos)", () => {
    const result = filterAdminUsersByQuery(users, "sandra");
    expect(result.map((u) => u.id)).toEqual(["1"]);
  });

  it("ignora acentos al buscar por nombre", () => {
    expect(filterAdminUsersByQuery(users, "lopez").map((u) => u.id)).toEqual([
      "2",
    ]);
    expect(filterAdminUsersByQuery(users, "pérez").map((u) => u.id)).toEqual([
      "1",
    ]);
  });

  it("filtra por nombre de proyecto", () => {
    expect(
      filterAdminUsersByQuery(users, "mi proyecto").map((u) => u.id),
    ).toEqual(["2"]);
  });

  it("case-insensitive también en proyecto", () => {
    expect(filterAdminUsersByQuery(users, "taskpilot").map((u) => u.id)).toEqual(
      ["1", "3"],
    );
  });

  it("coincidencia parcial: subcadena dentro del nombre o proyecto", () => {
    expect(filterAdminUsersByQuery(users, "an").map((u) => u.id)).toEqual([
      "1", // "Sandra" contiene "an"
      "3", // "Ana"
    ]);
  });

  it("si el usuario no tiene proyecto no rompe el filtro", () => {
    expect(filterAdminUsersByQuery(users, "carlos").map((u) => u.id)).toEqual([
      "4",
    ]);
  });

  it("no devuelve resultados cuando no hay coincidencias", () => {
    expect(filterAdminUsersByQuery(users, "zzz")).toEqual([]);
  });
});
