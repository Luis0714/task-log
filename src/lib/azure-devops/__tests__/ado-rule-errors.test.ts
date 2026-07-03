import { describe, expect, it } from "vitest";

import {
  looksLikeResponsableLabel,
  parseAdoRuleErrorDetails,
  parseRequiredEmptyFieldsFromAdoError,
} from "@/lib/azure-devops/ado-rule-errors";

const buildBody = (entries: Array<{
  fieldReferenceName: string;
  fieldStatusFlags: string;
  errorMessage?: string;
}>) =>
  JSON.stringify({
    customProperties: {
      RuleValidationErrors: entries.map((e) => ({
        fieldReferenceName: e.fieldReferenceName,
        fieldStatusFlags: e.fieldStatusFlags,
        errorMessage: e.errorMessage ?? `TF401320: Rule Error for field ${e.fieldReferenceName}.`,
      })),
    },
  });

describe("parseAdoRuleErrorDetails", () => {
  it("extracts required+invalidEmpty Responsable details with the parsed label", () => {
    const body = buildBody([
      {
        fieldReferenceName: "Custom.ResponsableIntegrador",
        fieldStatusFlags: "required, hasValues, limitedToValues, allowsOldValue, invalidEmpty",
        errorMessage: "TF401320: Rule Error for field Responsable Integrador. Error code: Required.",
      },
    ]);

    const details = parseAdoRuleErrorDetails(body);
    expect(details).toHaveLength(1);
    expect(details[0]).toMatchObject({
      fieldReferenceName: "Custom.ResponsableIntegrador",
      label: "Responsable Integrador",
      flags: {
        required: true,
        invalidEmpty: true,
        limitedToValues: true,
        hasValues: true,
      },
    });
  });

  it("skips entries with empty reference name", () => {
    const body = JSON.stringify({
      customProperties: {
        RuleValidationErrors: [
          { fieldReferenceName: "  ", fieldStatusFlags: "required, invalidEmpty" },
          {
            fieldReferenceName: "Custom.Foo",
            fieldStatusFlags: "required, invalidEmpty",
            errorMessage: "TF401320: Rule Error for field Foo.",
          },
        ],
      },
    });

    const details = parseAdoRuleErrorDetails(body);
    expect(details).toHaveLength(1);
    expect(details[0]!.fieldReferenceName).toBe("Custom.Foo");
  });

  it("returns empty array when body is not JSON", () => {
    expect(parseAdoRuleErrorDetails("not-json")).toEqual([]);
  });

  it("returns empty array when RuleValidationErrors is missing", () => {
    const body = JSON.stringify({ customProperties: { ErrorMessage: "boom" } });
    expect(parseAdoRuleErrorDetails(body)).toEqual([]);
  });

  it("parseRequiredEmptyFieldsFromAdoError keeps back-compat (only required+invalidEmpty)", () => {
    const body = buildBody([
      { fieldReferenceName: "Custom.A", fieldStatusFlags: "required, invalidEmpty" },
      { fieldReferenceName: "Custom.B", fieldStatusFlags: "limitedToValues, hasValues" },
      { fieldReferenceName: "Custom.C", fieldStatusFlags: "required, invalidEmpty" },
    ]);
    expect(parseRequiredEmptyFieldsFromAdoError(body)).toEqual(["Custom.A", "Custom.C"]);
  });
});

describe("looksLikeResponsableLabel", () => {
  it("matches Spanish Responsable labels", () => {
    expect(looksLikeResponsableLabel("Responsable Integrador")).toBe(true);
    expect(looksLikeResponsableLabel("Responsable Maquetación")).toBe(true);
    expect(looksLikeResponsableLabel("Responsable QA")).toBe(true);
  });

  it("matches English Responsible and Owner labels", () => {
    expect(looksLikeResponsableLabel("Integration Owner")).toBe(true);
    expect(looksLikeResponsableLabel("QA Responsible")).toBe(true);
  });

  it("does not match unrelated labels", () => {
    expect(looksLikeResponsableLabel("Start Date")).toBe(false);
    expect(looksLikeResponsableLabel("Completed Work")).toBe(false);
    expect(looksLikeResponsableLabel("")).toBe(false);
    expect(looksLikeResponsableLabel(undefined)).toBe(false);
  });
});