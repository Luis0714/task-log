/**
 * Parsers for Azure DevOps TF401320 rule validation errors.
 *
 * `TF401320` is the canonical error code for field rule violations (required,
 * allowed values, allowed-pattern, etc.). The response body contains a
 * `customProperties.RuleValidationErrors[]` array — each entry exposes a
 * `fieldReferenceName` and a `fieldStatusFlags` string of comma-separated
 * tokens. This util extracts those details so the rest of the platform can
 * decide what to do (retry, surface a better error, etc.).
 */

export type AdoRuleErrorFlags = {
  required: boolean;
  invalidEmpty: boolean;
  limitedToValues: boolean;
  hasValues: boolean;
};

export type AdoRuleErrorDetail = {
  /** Reference Name del campo (p. ej. `Custom.ResponsableIntegrador`). */
  fieldReferenceName: string;
  /** Etiqueta legible cuando se puede derivar del `errorMessage`. */
  label?: string;
  flags: AdoRuleErrorFlags;
};

type RawRuleError = {
  fieldReferenceName?: unknown;
  fieldStatusFlags?: unknown;
  errorMessage?: unknown;
};

function parseFlags(rawFlags: unknown): AdoRuleErrorFlags {
  if (typeof rawFlags !== "string") {
    return { required: false, invalidEmpty: false, limitedToValues: false, hasValues: false };
  }
  const tokens = new Set(
    rawFlags
      .toLowerCase()
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean),
  );
  return {
    required: tokens.has("required"),
    // ADO returns tokens in camelCase (`invalidEmpty`); lowercase removes the camelCase boundary.
    invalidEmpty: tokens.has("invalidempty"),
    limitedToValues: tokens.has("limitedtovalues"),
    hasValues: tokens.has("hasvalues"),
  };
}

const FIELD_LABEL_REGEX = /Rule Error for field\s+([^\n.]+)\./i;

function parseLabelFromMessage(message: unknown): string | undefined {
  if (typeof message !== "string") return undefined;
  const match = message.match(FIELD_LABEL_REGEX);
  return match?.[1]?.trim() || undefined;
}

type ParsedBody = { customProperties?: { RuleValidationErrors?: RawRuleError[] } } | null;

export function parseAdoRuleErrorDetails(body: string): AdoRuleErrorDetail[] {
  if (!body || typeof body !== "string") return [];

  let parsed: ParsedBody = null;
  try {
    parsed = JSON.parse(body) as ParsedBody;
  } catch {
    return [];
  }

  const entries = parsed?.customProperties?.RuleValidationErrors;
  if (!Array.isArray(entries)) return [];

  const details: AdoRuleErrorDetail[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const fieldReferenceName =
      typeof entry.fieldReferenceName === "string" ? entry.fieldReferenceName.trim() : "";
    if (!fieldReferenceName) continue;
    details.push({
      fieldReferenceName,
      label: parseLabelFromMessage(entry.errorMessage),
      flags: parseFlags(entry.fieldStatusFlags),
    });
  }
  return details;
}

/**
 * Lista los `fieldReferenceName` que ADO reporta como required+invalidEmpty.
 * Mantenido por compatibilidad con `parseRequiredEmptyFieldsFromAdoError`.
 */
export function parseRequiredEmptyFieldsFromAdoError(body: string): string[] {
  return parseAdoRuleErrorDetails(body)
    .filter((detail) => detail.flags.required && detail.flags.invalidEmpty)
    .map((detail) => detail.fieldReferenceName);
}

/** True si la etiqueta del campo parece un campo "Responsable" (responsable/responsible/owner). */
export function looksLikeResponsableLabel(label: string | undefined): boolean {
  if (!label) return false;
  const normalized = label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (!normalized) return false;
  return (
    normalized.includes("responsable") ||
    normalized.includes("responsible") ||
    normalized.endsWith(" owner") ||
    normalized === "owner"
  );
}