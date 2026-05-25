export type BacklogResponsableFieldKey = "maquetacion" | "integrador" | "qa";

export type BacklogResponsableFieldDto = {
  key: BacklogResponsableFieldKey;
  referenceName: string;
  label: string;
  defaultToCurrentUser: boolean;
  source: "env" | "discovered";
  envKey: string;
};
