import { describe, expect, it } from "vitest";

import { ADO_FIELD_DEFAULTS } from "@/lib/azure-devops/ado-field-defaults";
import { originalEstimateFields } from "@/lib/azure-devops/original-estimate-field";

const STANDARD = ADO_FIELD_DEFAULTS.originalEstimateField;

describe("originalEstimateFields", () => {
  it("usa el campo estándar cuando el perfil no lo trae", () => {
    expect(originalEstimateFields(null)).toEqual([STANDARD]);
    expect(originalEstimateFields("  ")).toEqual([STANDARD]);
  });

  it("no lo repite cuando el perfil ya apunta al estándar", () => {
    expect(originalEstimateFields(STANDARD)).toEqual([STANDARD]);
  });

  it("manda el campo del perfil y el estándar cuando son distintos", () => {
    expect(originalEstimateFields("Custom.Estimate")).toEqual(["Custom.Estimate", STANDARD]);
  });
});
