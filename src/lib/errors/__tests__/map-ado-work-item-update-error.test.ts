import { describe, expect, it } from "vitest";

import { mapAdoWorkItemUpdateError } from "@/lib/errors/map-ado-work-item-update-error";

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

describe("mapAdoWorkItemUpdateError — Responsable-specific TF401320", () => {
  it("nombres el campo Responsable Integrador con su ReferenceName y la env var", () => {
    const body = tf401320Body("Custom.ResponsableIntegrador", "Responsable Integrador");
    const message = mapAdoWorkItemUpdateError(400, body);

    expect(message).toContain("Responsable Integrador");
    expect(message).toContain("Custom.ResponsableIntegrador");
    expect(message).toContain("AZDO_PBI_FIELD_INTEGRADOR");
  });

  it("nombres el campo Responsable Maquetación", () => {
    const body = tf401320Body("Custom.ResponsableMaquetacion", "Responsable Maquetación");
    const message = mapAdoWorkItemUpdateError(400, body);

    expect(message).toContain("Responsable Maquetación");
    expect(message).toContain("AZDO_PBI_FIELD_MAQUETACION");
  });

  it("nombres el campo Responsable QA", () => {
    const body = tf401320Body("Custom.ResponsableQA", "Responsable QA");
    const message = mapAdoWorkItemUpdateError(400, body);

    expect(message).toContain("Responsable QA");
    expect(message).toContain("AZDO_PBI_FIELD_QA");
  });

  it("reconoce labels en inglés (Integration Owner) y mapea a Integrador", () => {
    const body = tf401320Body("Custom.IntegrationOwner", "Integration Owner");
    const message = mapAdoWorkItemUpdateError(400, body);

    expect(message).toContain("Responsable Integrador");
    expect(message).toContain("AZDO_PBI_FIELD_INTEGRADOR");
  });

  it("cae al mensaje genérico cuando el campo no parece Responsable", () => {
    const body = tf401320Body("Custom.WorkingDate", "Working Date");
    expect(mapAdoWorkItemUpdateError(400, body)).toBe(
      "Azure DevOps necesita la fecha de trabajo para este cambio.",
    );
  });

  it("devuelve permisosInsufficient en 403", () => {
    expect(mapAdoWorkItemUpdateError(403, "")).toContain("permisos");
  });
});