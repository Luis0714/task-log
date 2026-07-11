import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchUserStoriesByIds } from "@/lib/azure-devops/fetch-user-stories-by-ids";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

const auth: AdoCallerAuth = {
  mode: "pat",
  organization: "org",
  project: "Proyecto A",
  pat: "secret",
};

function stubFetch(respond: (url: string) => Response | Promise<Response>) {
  const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    return respond(url);
  });
  vi.stubGlobal("fetch", fetchSpy);
  return fetchSpy;
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

describe("fetchUserStoriesByIds", () => {
  it("devuelve [] sin llamar a Azure cuando no hay IDs", async () => {
    const fetchSpy = stubFetch(() => jsonResponse({ value: [] }));
    const result = await fetchUserStoriesByIds(auth, []);
    expect(result).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("descarta IDs no enteros o <= 0", async () => {
    const fetchSpy = stubFetch(() => jsonResponse({ value: [] }));
    await fetchUserStoriesByIds(auth, [0, -1, 1.5, Number.NaN]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("deduplica IDs antes de consultar", async () => {
    let capturedUrl = "";
    stubFetch((url) => {
      capturedUrl = url;
      return jsonResponse({
        value: [
          { id: 1, fields: { "System.Title": "A", "System.State": "Active" } },
        ],
      });
    });

    const result = await fetchUserStoriesByIds(auth, [1, 1, 1, 1]);

    expect(result).toEqual([{ id: 1, title: "A", state: "Active" }]);
    expect(capturedUrl).toContain("ids=1");
    expect(capturedUrl).not.toContain("ids=1,1");
  });

  it("usa título 'Elemento de trabajo N' cuando Azure devuelve título vacío", async () => {
    stubFetch(() =>
      jsonResponse({
        value: [
          { id: 5, fields: { "System.Title": "   ", "System.State": "Active" } },
        ],
      }),
    );

    const result = await fetchUserStoriesByIds(auth, [5]);

    expect(result).toEqual([{ id: 5, title: "Elemento de trabajo 5", state: "Active" }]);
  });

  it("pagina en bloques de 200 cuando hay más IDs", async () => {
    const calls: string[] = [];
    stubFetch((url) => {
      calls.push(url);
      return jsonResponse({ value: [] });
    });

    const ids = Array.from({ length: 250 }, (_, idx) => idx + 1);
    await fetchUserStoriesByIds(auth, ids);

    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatch(/ids=1.*200/);
    expect(calls[1]).toMatch(/ids=201/);
  });

  it("ignora respuestas no-ok por chunk pero concatena los demás", async () => {
    let count = 0;
    stubFetch(() => {
      count += 1;
      if (count === 1) return jsonResponse("error", false, 502);
      return jsonResponse({
        value: [
          { id: 10, fields: { "System.Title": "T", "System.State": "Active" } },
        ],
      });
    });

    const ids = Array.from({ length: 250 }, (_, idx) => idx + 1);
    const result = await fetchUserStoriesByIds(auth, ids);

    expect(result).toEqual([{ id: 10, title: "T", state: "Active" }]);
  });
});