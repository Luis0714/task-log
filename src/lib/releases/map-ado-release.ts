import type {
  AdoRelease,
  AdoReleaseApproval,
  AdoReleaseDefinition,
  AdoReleaseEnvironment,
} from "@/lib/azure-devops/releases";
import type {
  ReleaseDefinitionOption,
  ReleaseListItem,
  ReleaseStage,
  ReleaseStageStatus,
} from "@/lib/releases/types";

function isPendingStatus(status: string | number | undefined): boolean {
  const raw = String(status ?? "").toLowerCase();
  return raw === "pending" || raw === "2";
}

function mapEnvironmentStatus(
  status: string | number | undefined,
): Exclude<ReleaseStageStatus, "needs_approval"> {
  const raw = String(status ?? "").toLowerCase();
  if (raw === "succeeded" || raw === "4") return "succeeded";
  if (raw === "rejected" || raw === "16") return "rejected";
  if (raw === "canceled" || raw === "cancelled" || raw === "8") return "canceled";
  if (raw === "inprogress" || raw === "2" || raw === "queued" || raw === "32") {
    return "in_progress";
  }
  return "waiting";
}

export function shortStageName(name: string): string {
  const raw = name.trim();
  if (/^develop/i.test(raw)) return "DEV";
  if (raw.length <= 8) return raw.toUpperCase();
  return raw.slice(0, 6).toUpperCase();
}

function pickPendingApproval(
  environment: AdoReleaseEnvironment,
  pending: readonly AdoReleaseApproval[],
  releaseId: number,
): AdoReleaseApproval | null {
  const fromExpand = (environment.preDeployApprovals ?? []).find(
    (approval) => !approval.isAutomated && isPendingStatus(approval.status),
  );
  if (fromExpand?.id) return fromExpand;

  return (
    pending.find(
      (approval) =>
        approval.release?.id === releaseId &&
        approval.releaseEnvironment?.id === environment.id &&
        isPendingStatus(approval.status),
    ) ?? null
  );
}

function mapStage(
  environment: AdoReleaseEnvironment,
  pending: readonly AdoReleaseApproval[],
  releaseId: number,
  currentUserId: string | null,
): ReleaseStage | null {
  const id = environment.id;
  const name = environment.name?.trim();
  if (!id || !name) return null;

  const approval = pickPendingApproval(environment, pending, releaseId);
  const assignedToMe = Boolean(
    currentUserId && approval?.approver?.id && approval.approver.id === currentUserId,
  );
  const hasPending = Boolean(approval?.id);
  const baseStatus = mapEnvironmentStatus(environment.status);
  const status: ReleaseStageStatus = hasPending ? "needs_approval" : baseStatus;

  return {
    id,
    name,
    shortName: shortStageName(name),
    status,
    approvalId: approval?.id ?? null,
    canApprove: hasPending,
    assignedToMe,
  };
}

function pickBranch(release: AdoRelease): string {
  for (const artifact of release.artifacts ?? []) {
    const branch =
      artifact.definitionReference?.branch?.name?.trim() ||
      artifact.definitionReference?.branch?.id?.trim() ||
      "";
    if (branch) return branch.replace(/^refs\/heads\//, "");
  }
  return "—";
}

export function mapAdoReleaseDefinitions(
  definitions: readonly AdoReleaseDefinition[],
): ReleaseDefinitionOption[] {
  return definitions
    .filter((item): item is AdoReleaseDefinition & { id: number; name: string } =>
      Boolean(item.id && item.name?.trim()),
    )
    .map((item) => ({ id: item.id, name: item.name.trim() }))
    .sort((left, right) => left.name.localeCompare(right.name, "es"));
}

export function pickDefaultReleaseDefinition(
  definitions: readonly ReleaseDefinitionOption[],
): number | null {
  if (definitions.length === 0) return null;
  const preferred = definitions.find((item) => /lms/i.test(item.name));
  return preferred?.id ?? definitions[0]?.id ?? null;
}

export function mapAdoRelease(
  release: AdoRelease,
  pending: readonly AdoReleaseApproval[],
  currentUserId: string | null,
): ReleaseListItem | null {
  const id = release.id;
  if (!id) return null;

  const stages = [...(release.environments ?? [])]
    .sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0))
    .map((environment) => mapStage(environment, pending, id, currentUserId))
    .filter((stage): stage is ReleaseStage => stage !== null);

  return {
    id,
    name: release.name?.trim() || `Release-${id}`,
    definitionName: release.releaseDefinition?.name?.trim() || "Release",
    createdAt: release.createdOn || new Date().toISOString(),
    createdBy: release.createdBy?.displayName?.trim() || "Desconocido",
    branch: pickBranch(release),
    pendingCount: stages.filter((stage) => stage.status === "needs_approval").length,
    stages,
  };
}
