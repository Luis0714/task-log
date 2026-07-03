import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/azure-devops/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/azure-devops/client")>(
    "@/lib/azure-devops/client",
  );
  return {
    ...actual,
    adoFetch: vi.fn(),
    adoProjectBase: vi.fn(() => "https://dev.azure.com/o/p"),
    adoAuthHeader: vi.fn(() => "h"),
  };
});
vi.mock("@/lib/azure-devops/backlog-item-fields", () => ({
  resolveBacklogResponsableFields: vi.fn(),
  getBacklogItemFetchFieldNames: vi.fn(async () => []),
}));
vi.mock("@/lib/azure-devops/backlog-item-field-discovery", () => ({
  discoverBacklogResponsableFields: vi.fn(async () => []),
}));
vi.mock("@/lib/azure-devops/validate-backlog-transition", () => ({
  validateBacklogStateTransition: vi.fn(() => null),
}));
vi.mock("@/lib/azure-devops/resolve-identity-patch-value", () => ({
  resolveIdentityPatchValue: vi.fn(async (_auth: unknown, displayName: string) => displayName),
}));
vi.mock("@/lib/azure-devops/work-item-type-states", () => ({
  listTeamMembers: vi.fn(async () => []),
  listBacklogItemStates: vi.fn(async () => []),
}));
vi.mock("@/lib/auth/resolve-ado-profile", () => ({
  resolveAdoProfile: vi.fn(async () => ({
    id: "u-1",
    displayName: "Luis Logueado",
  })),
}));
vi.mock("@/lib/work-items/patch-user-story-workflow-tag", () => ({
  buildWorkItemTagsPatchOp: vi.fn(() => null),
  buildWorkflowTagPatchOp: vi.fn(() => null),
  SYSTEM_TAGS_FIELD: "System.Tags",
}));

import * as client from "@/lib/azure-devops/client";
import * as bf from "@/lib/azure-devops/backlog-item-fields";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { updateBacklogItemState } from "@/lib/azure-devops/update-backlog-item-state";

const auth: AdoCallerAuth = { mode: "pat", organization: "o", project: "p", pat: "t" };

const BACKEND = {
  key: "Custom.ResponsableBackend",
  referenceName: "Custom.ResponsableBackend",
  label: "Responsable Backend",
  defaultToCurrentUser: true,
};
const QA = {
  key: "Custom.ResponsableQA",
  referenceName: "Custom.ResponsableQA",
  label: "Responsable QA",
  defaultToCurrentUser: false,
};

describe("updateBacklogItemState — default to current user", () => {
  beforeEach(() => {
    vi.mocked(bf.resolveBacklogResponsableFields).mockResolvedValue([BACKEND, QA]);
  });
  afterEach(() => vi.mocked(client.adoFetch).mockReset());

  it("rellena los Responsables con defaultToCurrentUser=true usando el usuario logueado", async () => {
    const fetchMock = vi.mocked(client.adoFetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ fields: {} }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 200 }));

    // El usuario deja Backend vacío (debería rellenarse con "Luis Logueado")
    // y completa QA manualmente.
    const result = await updateBacklogItemState(
      {
        workItemId: 1,
        state: "QA",
        responsables: { "Custom.ResponsableQA": "QA Manual" },
      },
      auth,
    );

    expect(result.ok).toBe(true);

    const patchBody = JSON.parse(
      String(fetchMock.mock.calls[1]?.[2]?.body ?? "[]"),
    ) as Array<{ path: string; value?: string }>;
    const backendOp = patchBody.find((op) => op.path === "/fields/Custom.ResponsableBackend");
    expect(backendOp?.value).toBe("Luis Logueado");
    const qaOp = patchBody.find((op) => op.path === "/fields/Custom.ResponsableQA");
    expect(qaOp?.value).toBe("QA Manual");
  });

  it("respeta el valor explícito del usuario aunque el campo tenga defaultToCurrentUser=true", async () => {
    const fetchMock = vi.mocked(client.adoFetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ fields: {} }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 200 }));

    await updateBacklogItemState(
      {
        workItemId: 1,
        state: "QA",
        responsables: {
          "Custom.ResponsableBackend": "Otra Persona",
          "Custom.ResponsableQA": "QA",
        },
      },
      auth,
    );

    const patchBody = JSON.parse(
      String(fetchMock.mock.calls[1]?.[2]?.body ?? "[]"),
    ) as Array<{ path: string; value?: string }>;
    const backendOp = patchBody.find((op) => op.path === "/fields/Custom.ResponsableBackend");
    expect(backendOp?.value).toBe("Otra Persona");
  });
});