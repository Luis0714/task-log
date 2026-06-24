import { beforeEach, describe, expect, it, vi } from "vitest";

import { discoverBacklogResponsableFields } from "@/lib/azure-devops/backlog-item-field-discovery";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import * as witFieldMetadata from "@/lib/azure-devops/wit-field-metadata";

const auth: AdoCallerAuth = {
  mode: "pat",
  organization: "test-org",
  project: "test-project",
  pat: "test-pat",
};

function identityField(referenceName: string, name: string) {
  return { referenceName, name, type: { name: "identity" } };
}

function plainField(referenceName: string, name: string, typeName: string) {
  return { referenceName, name, type: { name: typeName } };
}

describe("discoverBacklogResponsableFields", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("discovers Spanish Responsable fields", async () => {
    vi.spyOn(witFieldMetadata, "listWorkItemTypeFields").mockResolvedValue([
      identityField("Custom.ResponsableMaquetacion", "Responsable Maquetación"),
      identityField("Custom.ResponsableIntegrador", "Responsable Integrador"),
      identityField("Custom.ResponsableQA", "Responsable QA"),
    ]);

    const result = await discoverBacklogResponsableFields(auth);

    expect(result.map((f) => f.key).sort()).toEqual(["integrador", "maquetacion", "qa"]);
    expect(result.find((f) => f.key === "integrador")?.referenceName).toBe(
      "Custom.ResponsableIntegrador",
    );
  });

  it("discovers English-named Responsable fields", async () => {
    vi.spyOn(witFieldMetadata, "listWorkItemTypeFields").mockResolvedValue([
      identityField("Custom.IntegrationLead", "Integration Lead"),
      identityField("Custom.DesignLead", "Design Lead"),
      identityField("Custom.TestLead", "Test Lead"),
    ]);

    const result = await discoverBacklogResponsableFields(auth);

    // "Design Lead" requiere marcador de responsable/owner/assigned; sin él, no matchea maquetación.
    expect(result.find((f) => f.key === "integrador")?.referenceName).toBe("Custom.IntegrationLead");
    expect(result.find((f) => f.key === "qa")?.referenceName).toBe("Custom.TestLead");
    // maquetación requiere "responsable/owner/assigned" además del keyword del rol.
    expect(result.find((f) => f.key === "maquetacion")).toBeUndefined();
  });

  it("prefers Responsable Owner over plain Integration when both exist", async () => {
    vi.spyOn(witFieldMetadata, "listWorkItemTypeFields").mockResolvedValue([
      identityField("Custom.Integration", "Integration"),
      identityField("Custom.IntegrationOwner", "Integration Owner"),
    ]);

    const result = await discoverBacklogResponsableFields(auth);

    expect(result.find((f) => f.key === "integrador")?.referenceName).toBe(
      "Custom.IntegrationOwner",
    );
  });

  it("ignores non-identity fields even when label matches", async () => {
    vi.spyOn(witFieldMetadata, "listWorkItemTypeFields").mockResolvedValue([
      plainField("Custom.IntegradorNote", "Responsable Integrador", "string"),
      plainField("Custom.ResponsableQALabel", "Responsable QA", "string"),
    ]);

    const result = await discoverBacklogResponsableFields(auth);

    expect(result).toEqual([]);
  });

  it("returns empty array when discovery endpoint fails", async () => {
    vi.spyOn(witFieldMetadata, "listWorkItemTypeFields").mockResolvedValue([]);
    const result = await discoverBacklogResponsableFields(auth);
    expect(result).toEqual([]);
  });
});