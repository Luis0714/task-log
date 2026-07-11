import { afterEach, describe, expect, it, vi } from "vitest";

import { searchUserStories } from "@/lib/azure-devops/search-user-stories";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

const auth: AdoCallerAuth = {
  mode: "pat",
  organization: "org",
  project: "Proyecto A",
  pat: "secret",
};

type FetchCall = { url: string; init?: RequestInit };

function stubFetch(routes: Array<{
  match: (call: FetchCall) => boolean;
  respond: () => Response | Promise<Response>;
}>) {
  const calls: FetchCall[] = [];
  const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const call: FetchCall = { url, init };
    calls.push(call);
    for (const route of routes) {
      if (route.match(call)) return route.respond();
    }
    throw new Error(`Unhandled fetch: ${url}`);
  });
  vi.stubGlobal("fetch", fetchSpy);
  return calls;
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchUserStories", () => {
  it("devuelve las HUs más recientes cuando no hay query", async () => {
    const calls = stubFetch([
      {
        match: ({ url }) => url.includes("/_apis/wit/wiql"),
        respond: () =>
          jsonResponse({ workItems: [{ id: 1 }, { id: 2 }] }),
      },
      {
        match: ({ url }) => url.includes("/_apis/wit/workitems"),
        respond: () =>
          jsonResponse({
            value: [
              {
                id: 1,
                fields: { "System.Title": "A", "System.State": "Active" },
              },
              {
                id: 2,
                fields: {
                  "System.Title": "B",
                  "System.State": "Resolved",
                  "System.AreaPath": "Proyecto A\\Backend",
                },
              },
            ],
          }),
      },
    ]);

    const hits = await searchUserStories(auth, {});

    expect(hits).toEqual([
      { id: 1, title: "A", state: "Active", areaPath: null },
      {
        id: 2,
        title: "B",
        state: "Resolved",
        areaPath: "Proyecto A\\Backend",
      },
    ]);
    const wiqlBody = JSON.parse((calls[0].init?.body as string) ?? "{}");
    expect(wiqlBody.query).toContain("[System.WorkItemType] = 'User Story'");
    expect(wiqlBody.query).not.toContain("CONTAINS");
    expect(wiqlBody.query).not.toContain("[System.Id] =");
  });

  it("usa WIQL por título CONTAINS cuando la query es texto", async () => {
    const calls = stubFetch([
      {
        match: ({ url }) => url.includes("/_apis/wit/wiql"),
        respond: () => jsonResponse({ workItems: [{ id: 7 }] }),
      },
      {
        match: ({ url }) => url.includes("/_apis/wit/workitems"),
        respond: () =>
          jsonResponse({
            value: [
              {
                id: 7,
                fields: { "System.Title": "Novedades Junio", "System.State": "Active" },
              },
            ],
          }),
      },
    ]);

    const hits = await searchUserStories(auth, { query: "Novedades" });

    expect(hits).toHaveLength(1);
    const wiqlBody = JSON.parse((calls[0].init?.body as string) ?? "{}");
    expect(wiqlBody.query).toContain(
      "[System.Title] CONTAINS 'Novedades'",
    );
    expect(wiqlBody.query).not.toContain("[System.Id] =");
  });

  it("usa WIQL exacto por ID cuando la query es numérica", async () => {
    const calls = stubFetch([
      {
        match: ({ url }) => url.includes("/_apis/wit/wiql"),
        respond: () => jsonResponse({ workItems: [{ id: 3421 }] }),
      },
      {
        match: ({ url }) => url.includes("/_apis/wit/workitems"),
        respond: () =>
          jsonResponse({
            value: [
              {
                id: 3421,
                fields: {
                  "System.Title": "Novedades Julio",
                  "System.State": "Active",
                },
              },
            ],
          }),
      },
    ]);

    const hits = await searchUserStories(auth, { query: "3421" });

    expect(hits).toEqual([
      {
        id: 3421,
        title: "Novedades Julio",
        state: "Active",
        areaPath: null,
      },
    ]);
    const wiqlBody = JSON.parse((calls[0].init?.body as string) ?? "{}");
    expect(wiqlBody.query).toContain("[System.Id] = 3421");
    expect(wiqlBody.query).not.toContain("CONTAINS");
  });

  it("ignora work items cuyo ID devuelto por WIQL no coincide con la query numérica", async () => {
    stubFetch([
      {
        match: ({ url }) => url.includes("/_apis/wit/wiql"),
        respond: () =>
          jsonResponse({
            workItems: [{ id: 100 }, { id: 3421 }, { id: 999 }],
          }),
      },
      {
        match: ({ url }) => url.includes("/_apis/wit/workitems"),
        respond: () =>
          jsonResponse({
            value: [
              {
                id: 3421,
                fields: {
                  "System.Title": "Match exacto",
                  "System.State": "Active",
                },
              },
            ],
          }),
      },
    ]);

    const hits = await searchUserStories(auth, { query: "3421" });

    expect(hits).toEqual([
      {
        id: 3421,
        title: "Match exacto",
        state: "Active",
        areaPath: null,
      },
    ]);
  });

  it("agrega filtro por equipo en el área path", async () => {
    const calls = stubFetch([
      {
        match: ({ url }) => url.includes("/_apis/wit/wiql"),
        respond: () => jsonResponse({ workItems: [{ id: 5 }] }),
      },
      {
        match: ({ url }) => url.includes("/_apis/wit/workitems"),
        respond: () =>
          jsonResponse({
            value: [
              {
                id: 5,
                fields: { "System.Title": "HU", "System.State": "Active" },
              },
            ],
          }),
      },
    ]);

    await searchUserStories(auth, { query: "3421", team: "Backend" });

    const wiqlBody = JSON.parse((calls[0].init?.body as string) ?? "{}");
    expect(wiqlBody.query).toContain(
      "[System.AreaPath] UNDER 'Backend'",
    );
  });

  it("devuelve [] cuando Azure falla con WIQL", async () => {
    stubFetch([
      {
        match: ({ url }) => url.includes("/_apis/wit/wiql"),
        respond: () => jsonResponse("error", false, 502),
      },
    ]);

    const hits = await searchUserStories(auth, { query: "3421" });

    expect(hits).toEqual([]);
  });

  it("filtra entradas sin título válido", async () => {
    stubFetch([
      {
        match: ({ url }) => url.includes("/_apis/wit/wiql"),
        respond: () => jsonResponse({ workItems: [{ id: 1 }, { id: 2 }] }),
      },
      {
        match: ({ url }) => url.includes("/_apis/wit/workitems"),
        respond: () =>
          jsonResponse({
            value: [
              { id: 1, fields: { "System.Title": "   ", "System.State": "Active" } },
              {
                id: 2,
                fields: { "System.Title": "Válida", "System.State": "Active" },
              },
            ],
          }),
      },
    ]);

    const hits = await searchUserStories(auth, {});

    expect(hits).toEqual([
      { id: 2, title: "Válida", state: "Active", areaPath: null },
    ]);
  });
});