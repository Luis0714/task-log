import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/novedades/news-story-link", () => ({
  isNewsStoryLinked: vi.fn(),
}));
vi.mock("@/lib/filters/load-project-roster", () => ({
  loadProjectRoster: vi.fn(),
}));
vi.mock("@/lib/auth/resolve-ado-profile", () => ({
  resolveAdoProfile: vi.fn(),
}));

import { loadProjectRoster, type ProjectRosterMember } from "@/lib/filters/load-project-roster";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { isNewsStoryLinked } from "@/lib/novedades/news-story-link";
import {
  assertSolicitudContext,
  findAssigneeByUniqueName,
  mapAdoFailureToSolicitud,
  resolveAssigneeFromRoster,
  resolveSolicitudTiming,
} from "@/lib/novedades/solicitud-context";
import { SOLICITUD_ERROR_CODES } from "@/lib/solicitudes/error-codes";
import type { CreateSolicitudBody } from "@/lib/schemas/solicitudes";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

const auth: AdoCallerAuth = {
  mode: "pat",
  organization: "org",
  project: "p",
  pat: "t",
};

function buildBody(partial: Partial<CreateSolicitudBody> = {}): CreateSolicitudBody {
  return {
    project: "p",
    team: null,
    newsStoryId: 100,
    assignedTo: "user@org.com",
    tipo: "Vacaciones",
    description: "",
    value: 8,
    unit: "horas",
    startDate: "2026-06-10",
    startTime: "08:00",
    endDate: "2026-06-10",
    endTime: "16:00",
    fechaReintegro: "2026-06-11",
    reintegroTime: "08:00",
    state: "",
    title: "Vacaciones de Luis",
    ...partial,
  };
}

const MEMBER: ProjectRosterMember = {
  uniqueName: "user@org.com",
  displayName: "Luis Pérez",
  teamNames: ["Team A"],
};

describe("assertSolicitudContext", () => {
  it("devuelve error 400 cuando la HU no está vinculada al proyecto/equipo", async () => {
    vi.mocked(isNewsStoryLinked).mockResolvedValueOnce(false);

    const result = await assertSolicitudContext(auth, buildBody());

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.message).toBe(SOLICITUD_ERROR_CODES.newsStoryNotLinked);
    expect(loadProjectRoster).not.toHaveBeenCalled();
  });

  it("carga el roster y lo expone cuando la HU sí está vinculada", async () => {
    vi.mocked(isNewsStoryLinked).mockResolvedValueOnce(true);
    vi.mocked(loadProjectRoster).mockResolvedValueOnce([MEMBER]);

    const result = await assertSolicitudContext(
      auth,
      buildBody({ team: "team-a" }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.members).toEqual([MEMBER]);
    expect(isNewsStoryLinked).toHaveBeenCalledWith("p", "team-a", 100);
  });

  it("normaliza team faltante a null (HU a nivel proyecto)", async () => {
    vi.mocked(isNewsStoryLinked).mockResolvedValueOnce(true);
    vi.mocked(loadProjectRoster).mockResolvedValueOnce([MEMBER]);

    await assertSolicitudContext(auth, buildBody({ team: "   " }));

    expect(isNewsStoryLinked).toHaveBeenCalledWith("p", null, 100);
  });
});

describe("resolveSolicitudTiming", () => {
  it("combina horas, zona horaria del proyecto y reintegro como DateTime ADO", () => {
    const timing = resolveSolicitudTiming(
      buildBody({ value: 1, unit: "dias" }),
    );

    expect(timing.hours).toBe(8);
    expect(timing.timeZone).toBeTruthy();
    // El reintegro se construye como DateTime ADO usando esa misma zona.
    expect(timing.fechaReintegro).toMatch(/^2026-06-11T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("reusa la misma fecha civil + hora para el reintegro", () => {
    const timing = resolveSolicitudTiming(buildBody());
    // buildWorkingDateTimeValue: la primera parte ISO antes de 'T' es la fecha civil.
    expect(timing.fechaReintegro.startsWith("2026-06-11")).toBe(true);
  });
});

describe("findAssigneeByUniqueName", () => {
  const members: readonly ProjectRosterMember[] = [
    MEMBER,
    { uniqueName: "otro@org.com", displayName: "Otra", teamNames: [] },
  ];

  it("encuentra al miembro por uniqueName exacto", () => {
    expect(findAssigneeByUniqueName(members, "user@org.com")).toBe(MEMBER);
  });

  it("devuelve null si no hay match", () => {
    expect(findAssigneeByUniqueName(members, "no-existe@org.com")).toBeNull();
  });

  it("no aplica matching case-insensitive (es la estrategia estricta)", () => {
    expect(findAssigneeByUniqueName(members, "USER@ORG.COM")).toBeNull();
  });
});

describe("resolveAssigneeFromRoster", () => {
  const members: readonly ProjectRosterMember[] = [
    MEMBER,
    { uniqueName: "otra@org.com", displayName: "Ana Ruiz", teamNames: [] },
  ];

  it("matchea por displayName ignorando mayúsculas y espacios", async () => {
    vi.mocked(resolveAdoProfile).mockReset();

    const value = await resolveAssigneeFromRoster(
      auth,
      members,
      "  luis pérez  ",
    );

    expect(value).toBe("Luis Pérez <user@org.com>");
    expect(resolveAdoProfile).not.toHaveBeenCalled();
  });

  it("matchea por uniqueName si el displayName no calza", async () => {
    vi.mocked(resolveAdoProfile).mockReset();

    const value = await resolveAssigneeFromRoster(
      auth,
      members,
      "USER@org.com",
    );

    expect(value).toBe("Luis Pérez <user@org.com>");
  });

  it("cae al profile del usuario logueado si nadie del roster calza", async () => {
    vi.mocked(resolveAdoProfile).mockReset();
    vi.mocked(resolveAdoProfile).mockResolvedValueOnce({
      id: "u-99",
      displayName: "Perfil Logueado",
    });

    const value = await resolveAssigneeFromRoster(
      auth,
      members,
      "Perfil Logueado",
    );

    expect(value).toBe("Perfil Logueado");
  });

  it("tolera que el profile falle y devuelve el identifier crudo como último recurso", async () => {
    vi.mocked(resolveAdoProfile).mockReset();
    vi.mocked(resolveAdoProfile).mockRejectedValueOnce(new Error("boom"));

    const value = await resolveAssigneeFromRoster(
      auth,
      members,
      "Alguien Nuevo",
    );

    expect(value).toBe("Alguien Nuevo");
  });
});

describe("mapAdoFailureToSolicitud", () => {
  it("conserva 403 (permisos del caller)", () => {
    const failure = mapAdoFailureToSolicitud(403, "TF400813");
    expect(failure).toEqual({
      ok: false,
      status: 403,
      message: "TF400813",
    });
  });

  it("degrada cualquier otro status a 502 (fallo aguas arriba)", () => {
    expect(mapAdoFailureToSolicitud(500, "x").status).toBe(502);
    expect(mapAdoFailureToSolicitud(404, "x").status).toBe(502);
    expect(mapAdoFailureToSolicitud(0, "network").status).toBe(502);
  });
});
