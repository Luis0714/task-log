export type WorkItemFieldPatchOp = {
  op: "add" | "replace";
  path: string;
  value: string | number;
};

export function buildScalarFieldPatchOp(
  fields: Record<string, string | number | undefined> | undefined,
  fieldName: string,
  value: string | number,
): WorkItemFieldPatchOp {
  const hadValue =
    fields?.[fieldName] !== undefined &&
    fields?.[fieldName] !== null &&
    fields?.[fieldName] !== "";

  return {
    op: hadValue ? "replace" : "add",
    path: `/fields/${fieldName}`,
    value,
  };
}

export function buildScalarFieldPatchOps(
  fields: Record<string, string | number | undefined> | undefined,
  entries: ReadonlyArray<{ fieldName: string; value: string | number }>,
): WorkItemFieldPatchOp[] {
  return entries
    .filter((entry) => entry.value !== "" && entry.value !== undefined)
    .map((entry) => buildScalarFieldPatchOp(fields, entry.fieldName, entry.value));
}
