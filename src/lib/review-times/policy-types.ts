/** Políticas de voto humano. No cuentan como “listo para aprobar”. */
export const HUMAN_REVIEW_POLICY_TYPE_IDS = [
  "fa4e907d-c16b-4a4c-9dfa-4906e5d171dd",
  "fd2167ab-b0be-447a-8ec8-39368250530e",
] as const;

const HUMAN_REVIEW_POLICY_TYPES = new Set(
  HUMAN_REVIEW_POLICY_TYPE_IDS.map((id) => id.toLowerCase()),
);

export function isHumanReviewPolicy(typeId: string): boolean {
  return HUMAN_REVIEW_POLICY_TYPES.has(typeId.trim().toLowerCase());
}
