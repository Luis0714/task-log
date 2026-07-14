import type { AssignmentRow } from "@/hooks/assignments/use-assignments";
import type { EditAssignmentPayload } from "@/services/assignments/assignments.service";
import type { MultiCheckboxFilterOption } from "@/components/filters/multi-checkbox-filter";

export type TeamOptionsByProject = Readonly<
  Record<string, MultiCheckboxFilterOption[]>
>;

export type OpResult = Promise<{ ok: boolean; message?: string }>;

export type EditableRowRef =
  | { kind: "assignment"; id: string }
  | { kind: "default"; defaultKey: string };

export type InferredDefaultRow = Readonly<{
  defaultKey: string;
  personAdoId: string;
  personDisplayName: string;
  projectId: string;
  projectName: string;
  teamId: string | null;
  teamName: string | null;
}>;

export type AssignmentsTableProps = Readonly<{
  rows: AssignmentRow[];
  defaults?: InferredDefaultRow[];
  pendingDefaults?: boolean;
  projectOptions: MultiCheckboxFilterOption[];
  teamOptionsByProject: TeamOptionsByProject;
  onCellChange: (row: EditableRowRef, patch: EditAssignmentPayload) => OpResult;
  onDefaultCreate: (
    row: InferredDefaultRow,
    payload: EditAssignmentPayload,
  ) => OpResult;
  onDelete: (row: AssignmentRow) => OpResult;
}>;

export function defaultKeyOf(d: Omit<InferredDefaultRow, "defaultKey">): string {
  return [d.personAdoId, d.projectId, d.teamId ?? "_"].join("::");
}
