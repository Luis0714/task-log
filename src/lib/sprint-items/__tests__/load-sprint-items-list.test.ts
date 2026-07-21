import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { loadSprintItemsList } from "@/lib/sprint-items/load-sprint-items-list";
import {
  listBugsByCreatedDateRange,
  listTasksInWorkingDateRange,
} from "@/lib/azure-devops/work-items-by-date";
import { enrichItemsWithParentTitles } from "@/lib/azure-devops/work-items";
import { withAdoProject } from "@/lib/azure-devops/projects";

vi.mock("@/lib/ado/require-ado-caller", () => ({
  requireAdoCaller: vi.fn(),
}));
vi.mock("@/lib/azure-devops/projects", () => ({
  withAdoProject: vi.fn((auth: unknown) => auth),
}));
vi.mock("@/lib/azure-devops/work-items-by-date", () => ({
  listBugsByCreatedDateRange: vi.fn(),
  listTasksInWorkingDateRange: vi.fn(),
}));
vi.mock("@/lib/azure-devops/work-items", () => ({
  enrichItemsWithParentTitles: vi.fn(async (_auth, items) => items),
}));

const requireAdoCallerMock = vi.mocked(requireAdoCaller);
const listTasksInWorkingDateRangeMock = vi.mocked(listTasksInWorkingDateRange);
const listBugsByCreatedDateRangeMock = vi.mocked(listBugsByCreatedDateRange);
const withAdoProjectMock = vi.mocked(withAdoProject);
const enrichItemsWithParentTitlesMock = vi.mocked(enrichItemsWithParentTitles);

function makeCatalog(overrides: Partial<AdoCatalogSnapshot> = {}): AdoCatalogSnapshot {
  return {
    projects: [],
    teams: [],
    teamsByProject: {},
    sprints: [
      {
        id: "1",
        name: "Sprint 42",
        path: "Proyecto A\\Sprint 42",
        startDate: "2026-07-01",
        finishDate: "2026-07-14",
      },
    ],
    defaultProject: null,
    defaultTeam: null,
    suggestedTeam: null,
    project: "Proyecto A",
    team: "Equipo A",
    sprintPath: "Proyecto A\\Sprint 42",
    errors: { projects: null, teams: null, sprints: null },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdoCallerMock.mockResolvedValue({
    ok: true,
    auth: {
      mode: "pat",
      organization: "org",
      project: "Proyecto A",
      pat: "secret",
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("loadSprintItemsList", () => {
  it("para tareas consulta por fecha de trabajo (workingDateField) y NUNCA por iteration path", async () => {
    listTasksInWorkingDateRangeMock.mockResolvedValue([
      { id: 1, title: "Tarea", type: "Task", state: "Active" } as never,
    ]);

    const catalog = makeCatalog();
    await loadSprintItemsList("tasks", catalog, "@me");

    expect(listTasksInWorkingDateRangeMock).toHaveBeenCalledTimes(1);
    expect(listBugsByCreatedDateRangeMock).not.toHaveBeenCalled();
    const [, rangeArg, filtersArg] = listTasksInWorkingDateRangeMock.mock.calls[0]!;
    expect(rangeArg).toEqual({ startDate: "2026-07-01", finishDate: "2026-07-14" });
    expect(filtersArg).toEqual({ assignee: "@me", team: "Equipo A" });
  });

  it("para bugs consulta por fecha de creación (System.CreatedDate) y NUNCA por iteration path", async () => {
    listBugsByCreatedDateRangeMock.mockResolvedValue([
      { id: 2, title: "Bug", type: "Bug", state: "New" } as never,
    ]);

    const catalog = makeCatalog();
    const result = await loadSprintItemsList("bugs", catalog, "@me");

    expect(listBugsByCreatedDateRangeMock).toHaveBeenCalledTimes(1);
    expect(listTasksInWorkingDateRangeMock).not.toHaveBeenCalled();
    const [, rangeArg, filtersArg] = listBugsByCreatedDateRangeMock.mock.calls[0]!;
    expect(rangeArg).toEqual({ startDate: "2026-07-01", finishDate: "2026-07-14" });
    expect(filtersArg).toEqual({ assignee: "@me", team: "Equipo A" });
    expect(result.items).toEqual([
      { id: 2, title: "Bug", type: "Bug", state: "New" },
    ]);
  });

  it("devuelve lista vacía si el sprint no tiene fechas (no consulta ADO)", async () => {
    const catalog = makeCatalog({ sprints: [] });
    const result = await loadSprintItemsList("bugs", catalog, "@me");

    expect(listBugsByCreatedDateRangeMock).not.toHaveBeenCalled();
    expect(listTasksInWorkingDateRangeMock).not.toHaveBeenCalled();
    expect(result).toEqual({ items: [], error: null });
  });

  it("envuelve el error con contexto humano sin propagar la excepción", async () => {
    listBugsByCreatedDateRangeMock.mockRejectedValue(new Error("HTTP 500: boom"));
    const result = await loadSprintItemsList("bugs", makeCatalog(), "@me");

    expect(result.items).toEqual([]);
    expect(result.error).toMatch(/Bugs del sprint/);
    expect(result.error).toMatch(/HTTP 500: boom/);
  });

  it("consume el resultado del caller autenticado y aplica withAdoProject", async () => {
    listTasksInWorkingDateRangeMock.mockResolvedValue([]);
    const catalog = makeCatalog();

    await loadSprintItemsList("tasks", catalog, "@me");

    expect(requireAdoCallerMock).toHaveBeenCalledTimes(1);
    expect(withAdoProjectMock).toHaveBeenCalledTimes(1);
    expect(enrichItemsWithParentTitlesMock).toHaveBeenCalledTimes(1);
  });
});
