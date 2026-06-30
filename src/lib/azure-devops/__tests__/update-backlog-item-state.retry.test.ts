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
  listBacklogItemStates: vi.fn(async () => []),
}));

vi.mock("@/lib/auth/resolve-ado-profile", () => ({
  resolveAdoProfile: vi.fn(async () => null),
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

const INTEGRADOR_DISCOVERED = {
  key: "Custom.ResponsableIntegrador",
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
    vi.mocked(backlogFields.resolveBacklogResponsableFields).mockResolvedValue([BACKEND, QA]);
  });

  afterEach(() => {
    vi.mocked(client.adoFetch).mockReset();
    vi.mocked(discovery.discoverBacklogResponsableFields).mockReset();
  });

  it("discover el campo Integrador on-demand y reintenta el PATCH", async () => {
    vi.mocked(discovery.discoverBacklogResponsableFields).mockResolvedValue([
      BACKEND,
      INTEGRADOR_DISCOVERED,
      QA,
    ]);

    const fetchMock = vi.mocked(client.adoFetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ fields: { "System.State": "Active" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(tf401320Body("Custom.ResponsableIntegrador", "Responsable Integrador"), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 256484 }), { status: 200 }));

    const result = await updateBacklogItemState(
      {
        workItemId: 256484,
        state: "QA",
        responsables: {
          "Custom.ResponsableBackend": "Backend X",
          "Custom.ResponsableIntegrador": "Integrador Y",
          "Custom.ResponsableQA": "QA Z",
        },
      },
      auth,
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state).toBe("QA");
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const firstPatchBody = JSON.parse(
      String(fetchMock.mock.calls[1]?.[2]?.body ?? "[]"),
    ) as Array<{ path: string }>;
    expect(
      firstPatchBody.some((op) => op.path === "/fields/Custom.ResponsableIntegrador"),
    ).toBe(false);

    const retryBody = JSON.parse(String(fetchMock.mock.calls[2]?.[2]?.body ?? "[]")) as Array<{
      op: string;
      path: string;
      value?: string;
    }>;
    const integradorOp = retryBody.find((op) => op.path === "/fields/Custom.ResponsableIntegrador");
    expect(integradorOp).toBeDefined();
    expect(integradorOp?.op).toBe("add");
    expect(integradorOp?.value).toBe("Integrador Y");

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
        responsables: {
          "Custom.ResponsableBackend": "Backend X",
        },
      },
      auth,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.body).toContain("Working Date");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(discovery.discoverBacklogResponsableFields).not.toHaveBeenCalled();
  });
});