import type {
  BacklogResponsableFieldDto,
  BacklogResponsableFieldKey,
} from "@/lib/work-items/backlog-field-types";

export type BacklogResponsableFieldConfig = {
  /**
   * Identificador estable del campo. Para campos del env o descubiertos, es
   * el `referenceName` del campo (p. ej. `Custom.ResponsableIntegrador`).
   * Roles legacy (`maquetacion`/`integrador`/`qa`) sólo se usan para
   * compatibilidad hacia atrás y se mapean al `referenceName` correspondiente.
   */
  key: BacklogResponsableFieldKey | string;
  referenceName: string;
  label: string;
  defaultToCurrentUser: boolean;
};

export const PBI_START_DATE_FIELD = "Microsoft.VSTS.Scheduling.StartDate";
export const PBI_TARGET_DATE_FIELD = "Microsoft.VSTS.Scheduling.TargetDate";

export const RESPONSABLE_ENV_KEYS: Record<BacklogResponsableFieldKey, string> = {
  maquetacion: "AZDO_PBI_FIELD_MAQUETACION",
  integrador: "AZDO_PBI_FIELD_INTEGRADOR",
  qa: "AZDO_PBI_FIELD_QA",
};

type LegacyRole = {
  key: BacklogResponsableFieldKey;
  label: string;
  defaultToCurrentUser: boolean;
  /** Keyword usada en el label del proceso para descubrir el campo. */
  labelKeyword: string;
};

const LEGACY_ROLES: ReadonlyArray<LegacyRole> = [
  {
    key: "maquetacion",
    label: "Responsable Maquetación",
    defaultToCurrentUser: true,
    labelKeyword: "maquet",
  },
  {
    key: "integrador",
    label: "Responsable Integrador",
    defaultToCurrentUser: true,
    labelKeyword: "integr",
  },
  {
    key: "qa",
    label: "Responsable QA",
    defaultToCurrentUser: false,
    labelKeyword: "qa",
  },
];

function readEnvReferenceName(envKey: string): string | null {
  const value = process.env[envKey]?.trim();
  return value || null;
}

/** Compatibilidad hacia atrás: lee los 3 roles legacy desde env vars. */
export function buildBacklogResponsableFieldsFromEnv(): BacklogResponsableFieldConfig[] {
  const fields: BacklogResponsableFieldConfig[] = [];

  for (const role of LEGACY_ROLES) {
    const envKey = RESPONSABLE_ENV_KEYS[role.key];
    const referenceName = readEnvReferenceName(envKey);
    if (!referenceName) continue;

    fields.push({
      key: role.key,
      referenceName,
      label: role.label,
      defaultToCurrentUser: role.defaultToCurrentUser,
    });
  }

  return fields;
}

/** Keyword legacy usada para hacer matching de un campo descubierto a un rol legacy. */
export function legacyRoleKeyword(role: BacklogResponsableFieldKey): string {
  return LEGACY_ROLES.find((r) => r.key === role)?.labelKeyword ?? "";
}

/** Default legacy para un rol (true para maquet/integrador, false para qa). */
export function legacyRoleDefaultToCurrentUser(role: BacklogResponsableFieldKey): boolean {
  return LEGACY_ROLES.find((r) => r.key === role)?.defaultToCurrentUser ?? true;
}

export function toBacklogResponsableFieldDto(
  config: BacklogResponsableFieldConfig,
  source: "env" | "discovered",
): BacklogResponsableFieldDto {
  const keyStr = String(config.key);
  const envKey =
    typeof config.key === "string" && (RESPONSABLE_ENV_KEYS as Record<string, string>)[config.key]
      ? (RESPONSABLE_ENV_KEYS as Record<string, string>)[config.key]!
      : null;
  return {
    key: keyStr,
    referenceName: config.referenceName,
    label: config.label,
    defaultToCurrentUser: config.defaultToCurrentUser,
    source,
    envKey,
  };
}