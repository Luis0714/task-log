import type {
  BacklogResponsableFieldDto,
  BacklogResponsableFieldKey,
} from "@/lib/work-items/backlog-field-types";

export type BacklogResponsableFieldConfig = {
  key: BacklogResponsableFieldKey;
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

const RESPONSABLE_DEFINITIONS: ReadonlyArray<{
  key: BacklogResponsableFieldKey;
  label: string;
  defaultToCurrentUser: boolean;
}> = [
  {
    key: "maquetacion",
    label: "Responsable Maquetación",
    defaultToCurrentUser: true,
  },
  {
    key: "integrador",
    label: "Responsable Integrador",
    defaultToCurrentUser: true,
  },
  {
    key: "qa",
    label: "Responsable QA",
    defaultToCurrentUser: false,
  },
];

function readEnvReferenceName(envKey: string): string | null {
  const value = process.env[envKey]?.trim();
  return value || null;
}

export function buildBacklogResponsableFieldsFromEnv(): BacklogResponsableFieldConfig[] {
  const fields: BacklogResponsableFieldConfig[] = [];

  for (const definition of RESPONSABLE_DEFINITIONS) {
    const envKey = RESPONSABLE_ENV_KEYS[definition.key];
    const referenceName = readEnvReferenceName(envKey);
    if (!referenceName) continue;

    fields.push({
      key: definition.key,
      referenceName,
      label: definition.label,
      defaultToCurrentUser: definition.defaultToCurrentUser,
    });
  }

  return fields;
}

export function toBacklogResponsableFieldDto(
  config: BacklogResponsableFieldConfig,
  source: "env" | "discovered",
): BacklogResponsableFieldDto {
  return {
    key: config.key,
    referenceName: config.referenceName,
    label: config.label,
    defaultToCurrentUser: config.defaultToCurrentUser,
    source,
    envKey: RESPONSABLE_ENV_KEYS[config.key],
  };
}
