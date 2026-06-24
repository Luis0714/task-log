import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/azure-devops/client", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/azure-devops/client")>(
      "@/lib/azure-devops/client",
    );
  return {
    ...actual,
    adoFetch: vi.fn(),
    adoProjectBase: vi.fn(() => "https://dev.azure.com/test-org/test-project"),
    adoAuthHeader: vi.fn(() => "auth-header"),
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
}));

vi.mock("@/lib/work-items/patch-user-story-workflow-tag", () => ({
  buildWorkItemTagsPatchOp: vi.fn(() => null),
  buildWorkflowTagPatchOp: vi.fn(() => null),
  SYSTEM_TAGS_FIELD: "System.Tags",
}));

import * as client from "@/lib/azure-devops/client";
import * as backlogFields from "@/lib/azure-devops/backlog-item-fields";
import * as discovery from "@/lib/azure-devops/backlog-item-field-discovery";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { updateBacklogItemState } from "@/lib/azure-devops/update-backlog-item-state";

const auth: AdoCallerAuth = {
  mode: "pat",
  organization: "test-org",
  project: "test-project",
  pat: "test-pat",
};

const MAQUET = {
  key: "maquetacion" as const,
  referenceName: "Custom.ResponsableMaquetacion",
  label: "Responsable Maquetación",
  defaultToCurrentUser: true,
};

const QA = {
  key: "qa" as const,
  referenceName: "Custom.ResponsableQA",
  label: "Responsable QA",
  defaultToCurrentUser: false,
};

const INTEGRADOR_DISCOVERED = {
  key: "integrador" as const,
  referenceName: "Custom.ResponsableIntegrador",
  label: "Responsable Integrador",
  defaultToCurrentUser: true,
};

function tf401320Body(fieldReferenceName: string, label: string): string {
  return JSON.stringify({
    customProperties: {
      RuleValidationErrors: [
        {
          fieldReferenceName,
          fieldStatusFlags: "required, hasValues, limitedToValues, allowsOldValue, invalidEmpty",
          errorMessage: `TF401320: Rule Error for field ${label}. Error code: Required.`,
        },
      ],
    },
  });
}

describe("updateBacklogItemState — TF401320 retry path", () => {
  beforeEach(() => {
    // El cache de responsableFields no incluye Integrador (discovery falló inicialmente).
    vi.mocked(backlogFields.resolveBacklogResponsableFields).mockResolvedValue([MAQUET, QA]);
  });

  afterEach(() => {
    vi.mocked(client.adoFetch).mockReset();
    vi.mocked(discovery.discoverBacklogResponsableFields).mockReset();
  });

  it("discover el campo Integrador on-demand y reintenta el PATCH", async () => {
    vi.mocked(discovery.discoverBacklogResponsableFields).mockResolvedValue([
      MAQUET,
      INTEGRADOR_DISCOVERED,
      QA,
    ]);

    const fetchMock = vi.mocked(client.adoFetch);
    fetchMock
      // 1) GET inicial → ok con campos vacíos
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ fields: { "System.State": "Active" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      // 2) Primer PATCH → 400 TF401320 sobre Custom.ResponsableIntegrador
      .mockResolvedValueOnce(
        new Response(tf401320Body("Custom.ResponsableIntegrador", "Responsable Integrador"), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      )
      // 3) Retry PATCH → 200
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 256484 }), { status: 200 }));

    const result = await updateBacklogItemState(
      {
        workItemId: 256484,
        state: "QA",
        responsableMaquetacion: "Maquet X",
        responsableIntegrador: "Integrador Y",
        responsableQA: "QA Z",
      },
      auth,
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state).toBe("QA");

    // 3 llamadas: GET, primer PATCH, retry PATCH.
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // El primer PATCH NO debe llevar Integrador (porque el cache inicial no lo tenía).
    const firstPatchBody = JSON.parse(
      String(fetchMock.mock.calls[1]?.[1]?.body ?? "[]"),
    ) as Array<{ path: string }>;
    expect(
      firstPatchBody.some((op) => op.path === "/fields/Custom.ResponsableIntegrador"),
    ).toBe(false);

    // El retry PATCH SÍ debe llevar Integrador con el valor del usuario.
    const retryBody = JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body ?? "[]")) as Array<{
      op: string;
      path: string;
      value?: string;
    }>;
    const integradorOp = retryBody.find((op) => op.path === "/fields/Custom.ResponsableIntegrador");
    expect(integradorOp).toBeDefined();
    expect(integradorOp?.op).toBe("add");
    expect(integradorOp?.value).toBe("Integrador Y");

    // El discovery on-demand debe haberse llamado.
    expect(discovery.discoverBacklogResponsableFields).toHaveBeenCalledTimes(1);
  });

  it("no reintenta si el campo TF401320 no es Responsable", async () => {
    const fetchMock = vi.mocked(client.adoFetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ fields: {} }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(tf401320Body("Custom.WorkingDate", "Working Date"), { status: 400 }),
      );

    const result = await updateBacklogItemState(
      {
        workItemId: 256484,
        state: "QA",
        responsableIntegrador: "Integrador Y",
      },
      auth,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.body).toContain("Working Date");
    }
    // Solo 2 llamadas: GET + PATCH inicial. Sin retry.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // El discovery on-demand no se invoca (no hay campo Responsable desconocido).
    expect(discovery.discoverBacklogResponsableFields).not.toHaveBeenCalled();
  });
});