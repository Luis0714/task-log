import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

// Mock the DB-backed process-profile resolver so the test doesn't need
// a real DATABASE_URL. The process profile provides the work-item type
// reference names that the WIQL queries embed.
vi.mock("@/lib/azure-devops/project-config-resolver", () => ({
  resolveOrDiscoverProjectConfig: vi.fn(async () => ({
    workingDateField: "Microsoft.VSTS.Scheduling.StartDate",
    workingDateFieldSource: "default",
    configSource: "default",
    timezone: "America/Bogota",
    completedWorkField: "Microsoft.VSTS.Scheduling.CompletedWork",
    originalEstimateField: "Microsoft.VSTS.Scheduling.OriginalEstimate",
    remainingWorkField: "Microsoft.VSTS.Scheduling.RemainingWork",
    activityField: "Microsoft.VSTS.Common.Activity",
    taskWorkItemType: "Task",
    bugWorkItemType: "Bug",
    backlogItemType: "Product Backlog Item",
    taskTodoState: "To Do",
    taskDoneState: "Done",
    responsableFields: [],
  })),
}));

// The team-field helper makes a network call to resolve area paths;
// stub it to return no scope so the WIQL doesn't include team conditions.
vi.mock("@/lib/azure-devops/team-field-values", () => ({
  buildTeamScopeWiqlCondition: vi.fn(async () => null),
}));

const { listBugsForSprint } = await import(
  "@/lib/azure-devops/work-items-by-date"
);

const auth: AdoCallerAuth = {
  mode: "pat",
  organization: "org",
  project: "Proyecto A",
  pat: "secret",
};

const RANGE = { startDate: "2026-07-01", finishDate: "2026-07-14" } as const;
const SPRINT_PATH = "Proyecto A\\Sprint 42";
const FILTERS = { assignee: "@me" } as const;

function makeFetchStub() {
  const calls: { body: string }[] = [];
  const stub = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ body: init?.body?.toString() ?? "" });
    const body = init?.body?.toString() ?? "";
    let query = "";
    try {
      query = JSON.parse(body).query as string;
    } catch {
      query = "";
    }
    // El endpoint WIQL devuelve `workItems` (no `value`); lo mismo aplica
    // al batch GET de work items. `runWiqlIdsQuery` mapea `data.workItems`
    // a ids, así que devolvemos esa forma.
    if (query.includes("[System.WorkItemType] = 'Product Backlog Item'")) {
      return new Response(
        JSON.stringify({ workItems: [{ id: 100 }] }),
        { status: 200 },
      );
    }
    // Para todo lo demás (WIQL de bugs, batch GET de work items),
    // responder vacío.
    return new Response(JSON.stringify({ workItems: [], value: [] }), {
      status: 200,
    });
  });
  return { stub, calls };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listBugsForSprint (integration via fetch mock)", () => {
  it("envía tres WIQL: uno por cada criterio OR (creación, iteración, padre)", async () => {
    const { stub, calls } = makeFetchStub();
    vi.stubGlobal("fetch", stub);

    await listBugsForSprint(auth, RANGE, SPRINT_PATH, FILTERS);

    const queries = calls.map((c) => JSON.parse(c.body).query as string);

    // Criterio 1: System.CreatedDate en rango
    const createdDateQuery = queries.find(
      (q) =>
        q.includes("[System.CreatedDate] >=") && q.includes("[System.CreatedDate] <"),
    );
    expect(createdDateQuery).toBeDefined();

    // Criterio 2: System.IterationPath bajo sprint path (directo al bug)
    const iterationQuery = queries.find(
      (q) =>
        q.includes(`[System.IterationPath] UNDER 'Proyecto A\\Sprint 42'`) &&
        q.includes(`[System.WorkItemType] = 'Bug'`),
    );
    expect(iterationQuery).toBeDefined();

    // Criterio 3: System.Parent IN (story ids en sprint)
    const parentQuery = queries.find(
      (q) =>
        q.includes("[System.Parent] IN (") &&
        q.includes(`[System.WorkItemType] = 'Bug'`),
    );
    expect(parentQuery).toBeDefined();
  });
});
