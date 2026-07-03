import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import {
  adoListErrorMessage,
  buildWiqlIdsQuery,
  filterWorkItemIdsByCondition,
  runWiqlIdsQuery,
  toWiqlDateLiteral,
} from "@/lib/azure-devops/wiql";

const auth: AdoCallerAuth = {
  mode: "pat",
  organization: "org",
  project: "Proyecto",
  pat: "secret",
};

function mockFetchResponse(body: unknown, ok = true, status = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok,
      status,
      json: async () => body,
      text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildWiqlIdsQuery", () => {
  it("une condiciones con AND", () => {
    const query = buildWiqlIdsQuery(["[A] = '1'", "[B] = '2'"]);
    expect(query).toBe("SELECT [System.Id] FROM WorkItems WHERE [A] = '1' AND [B] = '2'");
  });

  it("agrega ORDER BY cuando se indica", () => {
    const query = buildWiqlIdsQuery(["[A] = '1'"], "[System.ChangedDate] DESC");
    expect(query).toBe(
      "SELECT [System.Id] FROM WorkItems WHERE [A] = '1' ORDER BY [System.ChangedDate] DESC",
    );
  });
});

describe("toWiqlDateLiteral", () => {
  it("acepta fechas civiles YYYY-MM-DD", () => {
    expect(toWiqlDateLiteral("2026-08-01")).toBe("2026-08-01");
  });

  it("recorta valores ISO a la parte de fecha", () => {
    expect(toWiqlDateLiteral("2026-08-01T00:00:00Z")).toBe("2026-08-01");
  });

  it("rechaza valores vacíos o inválidos", () => {
    expect(toWiqlDateLiteral(undefined)).toBeNull();
    expect(toWiqlDateLiteral(null)).toBeNull();
    expect(toWiqlDateLiteral("")).toBeNull();
    expect(toWiqlDateLiteral("no-fecha")).toBeNull();
  });
});

describe("adoListErrorMessage", () => {
  it("usa el snippet del body cuando existe", () => {
    const res = { status: 400 } as Response;
    expect(adoListErrorMessage(res, "detalle del error", "fallback")).toBe(
      "HTTP 400: detalle del error",
    );
  });

  it("usa el fallback con body vacío", () => {
    const res = { status: 500 } as Response;
    expect(adoListErrorMessage(res, "   ", "fallback")).toBe("HTTP 500: fallback");
  });
});

describe("runWiqlIdsQuery", () => {
  it("devuelve los ids de la respuesta WIQL", async () => {
    mockFetchResponse({ workItems: [{ id: 1 }, { id: 2 }] });
    const ids = await runWiqlIdsQuery(auth, "SELECT ...", "fallo");
    expect(ids).toEqual([1, 2]);
  });

  it("lanza con el mensaje de fallback cuando la respuesta no es ok", async () => {
    mockFetchResponse("", false, 502);
    await expect(runWiqlIdsQuery(auth, "SELECT ...", "fallo esperado")).rejects.toThrow(
      /fallo esperado/,
    );
  });
});

describe("filterWorkItemIdsByCondition", () => {
  it("devuelve vacío sin consultar cuando no hay ids", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const ids = await filterWorkItemIdsByCondition(auth, [], "[A] = '1'", "fallo");
    expect(ids).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("filtra por la condición vía WIQL", async () => {
    mockFetchResponse({ workItems: [{ id: 7 }] });
    const ids = await filterWorkItemIdsByCondition(auth, [7, 9], "[A] = '1'", "fallo");
    expect(ids).toEqual([7]);
  });
});
