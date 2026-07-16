import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/azure-devops/list-reported-news", () => ({
  listReportedNews: vi.fn(),
}));

import {
  listReportedNews,
  type ReportedNewsDetail,
} from "@/lib/azure-devops/list-reported-news";
import { listSolicitudesForUser } from "@/lib/novedades/list-solicitudes-for-user";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { WORK_ITEM_ASSIGNEE_ME } from "@/lib/schemas/work-item-filters";

const auth: AdoCallerAuth = {
  mode: "pat",
  organization: "org",
  project: "Proyecto",
  pat: "t",
};

const SCOPES = [{ projectId: "Proyecto", teamId: null }] as const;

const ITEM: ReportedNewsDetail = {
  id: 1,
  title: "Vacaciones",
  state: "Active",
  assignedTo: "Luis Pérez <luis@org.com>",
  description: null,
  fechaInicio: "2026-06-10",
  fechaInicioHora: "08:00",
  fechaFin: "2026-06-10",
  fechaFinHora: "16:00",
  fechaReintegro: "2026-06-11",
  fechaReintegroHora: "08:00",
  tipoNovedad: "Permiso",
  parentId: 100,
  createdDate: null,
  completedWork: 8,
};

describe("listSolicitudesForUser", () => {
  it("devuelve [] cuando no hay scopes", async () => {
    const result = await listSolicitudesForUser(
      { auth, scopes: [] },
      { isManagement: true, currentUserDisplayName: "Yo" },
    );
    expect(result).toEqual([]);
    expect(listReportedNews).not.toHaveBeenCalled();
  });

  it("respeta el filtro de asignación cuando el usuario es management", async () => {
    vi.mocked(listReportedNews).mockResolvedValueOnce([ITEM]);

    const result = await listSolicitudesForUser(
      {
        auth,
        scopes: SCOPES,
        dateFilter: { kind: "month", monthKey: "2026-06" },
        assigneeFilter: "Ana|all",
      },
      { isManagement: true, currentUserDisplayName: "Yo" },
    );

    expect(listReportedNews).toHaveBeenCalledWith({
      auth,
      scopes: SCOPES,
      dateFilter: { kind: "month", monthKey: "2026-06" },
      assignee: "Ana|all",
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 1,
      title: "Vacaciones",
      tipo: "Permiso",
      hours: 8,
      parentId: 100,
    });
  });

  it("fuerza assigneeFilter a 'me' cuando el usuario NO es management", async () => {
    vi.mocked(listReportedNews).mockResolvedValueOnce([]);

    await listSolicitudesForUser(
      {
        auth,
        scopes: SCOPES,
        dateFilter: { kind: "none" },
        assigneeFilter: "all",
      },
      {
        isManagement: false,
        currentUserDisplayName: "Luis Pérez",
      },
    );

    expect(listReportedNews).toHaveBeenCalledWith({
      auth,
      scopes: SCOPES,
      dateFilter: { kind: "none" },
      assignee: WORK_ITEM_ASSIGNEE_ME,
    });
  });

  it("mapea los campos de ReportedNewsDetail al shape SolicitudDto", async () => {
    vi.mocked(listReportedNews).mockResolvedValueOnce([ITEM]);

    const result = await listSolicitudesForUser(
      { auth, scopes: SCOPES },
      { isManagement: true, currentUserDisplayName: null },
    );

    expect(result[0]).toEqual({
      id: 1,
      title: "Vacaciones",
      tipo: "Permiso",
      assignedTo: "Luis Pérez <luis@org.com>",
      description: null,
      fechaInicio: "2026-06-10",
      fechaInicioHora: "08:00",
      fechaFin: "2026-06-10",
      fechaFinHora: "16:00",
      fechaReintegro: "2026-06-11",
      fechaReintegroHora: "08:00",
      parentId: 100,
      hours: 8,
      state: "Active",
      url: expect.stringContaining("_workitems/edit/1"),
    });
  });
});
