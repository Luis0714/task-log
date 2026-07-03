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

  it("descubre TODOS los campos Responsable del proyecto (genérico)", async () => {
    vi.spyOn(witFieldMetadata, "listWorkItemTypeFields").mockResolvedValue([
      identityField("Custom.ResponsableMaquetacion", "Responsable Maquetación"),
      identityField("Custom.ResponsableIntegrador", "Responsable Integrador"),
      identityField("Custom.ResponsableQA", "Responsable QA"),
      identityField("Custom.ResponsableBackend", "Responsable Backend"),
    ]);

    const result = await discoverBacklogResponsableFields(auth);
    const refNames = result.map((f) => f.referenceName).sort();

    expect(refNames).toEqual([
      "Custom.ResponsableBackend",
      "Custom.ResponsableIntegrador",
      "Custom.ResponsableMaquetacion",
      "Custom.ResponsableQA",
    ]);
    // Genérico: la `key` es el referenceName mismo (no un rol fijo).
    expect(result.every((f) => f.key === f.referenceName)).toBe(true);
  });

  it("incluye campos en inglés (Integration Lead, Test Lead)", async () => {
    vi.spyOn(witFieldMetadata, "listWorkItemTypeFields").mockResolvedValue([
      identityField("Custom.IntegrationLead", "Integration Lead"),
      identityField("Custom.DesignLead", "Design Lead"),
      identityField("Custom.TestLead", "Test Lead"),
    ]);

    const result = await discoverBacklogResponsableFields(auth);
    const refNames = result.map((f) => f.referenceName).sort();
    expect(refNames).toEqual(["Custom.DesignLead", "Custom.IntegrationLead", "Custom.TestLead"]);
  });

  it("ignora campos que no son de tipo Identity", async () => {
    vi.spyOn(witFieldMetadata, "listWorkItemTypeFields").mockResolvedValue([
      plainField("Custom.ResponsableNote", "Responsable Backend", "string"),
      plainField("Custom.ResponsableMaquetacion", "Responsable Maquetación", "double"),
    ]);

    const result = await discoverBacklogResponsableFields(auth);
    expect(result).toEqual([]);
  });

  it("devuelve [] cuando no hay campos Responsable", async () => {
    vi.spyOn(witFieldMetadata, "listWorkItemTypeFields").mockResolvedValue([
      identityField("System.AssignedTo", "Assigned To"),
      identityField("Custom.StartDate", "Start Date"),
    ]);
    const result = await discoverBacklogResponsableFields(auth);
    expect(result).toEqual([]);
  });

  it("devuelve [] cuando el endpoint de WIT fields falla", async () => {
    vi.spyOn(witFieldMetadata, "listWorkItemTypeFields").mockResolvedValue([]);
    const result = await discoverBacklogResponsableFields(auth);
    expect(result).toEqual([]);
  });
});