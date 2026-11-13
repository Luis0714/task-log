import { ADO_FIELD_DEFAULTS } from "@/lib/azure-devops/ado-field-defaults";

export const STANDARD_COMPLETED_WORK_FIELD = ADO_FIELD_DEFAULTS.completedWorkField;

const COMPLETED_WORK_PATH = `/fields/${STANDARD_COMPLETED_WORK_FIELD}`;

export function isCompletedWorkReadOnlyError(body: string): boolean {
  const mentionsField = body.includes("CompletedWork") || body.includes("Completed Work");
  return mentionsField && /readonly|invalidnotoldvalue/i.test(body);
}

export function omitReadOnlyCompletedWork<T extends { path?: string }>(ops: readonly T[]): T[] | null {
  const next = ops.filter((op) => op.path !== COMPLETED_WORK_PATH);
  return next.length < ops.length ? next : null;
}
