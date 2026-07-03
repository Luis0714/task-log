import "server-only";

import { buildProcessProfileForAuth, resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import type { AdoProcessProfile } from "@/lib/azure-devops/process-profile-types";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { listTaskStates, type AdoWorkItemTypeState } from "@/lib/azure-devops/work-item-type-states";
import type { SavedConnectionTarget } from "@/lib/auth/server-state";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { listTaskDateFieldOptions, type TaskDateFieldOption } from "@/lib/settings/task-date-field-options";

export type SettingsPageData = {
  connection: SavedConnectionTarget;
  profile: AdoProcessProfile;
  taskDateFieldOptions: TaskDateFieldOption[];
  taskStates?: AdoWorkItemTypeState[];
};

export async function loadSettingsPageData(): Promise<SettingsPageData | null> {
  const caller = await resolveAdoCaller();
  if (!caller) return null;

  const project = caller.project.trim();
  const organization = caller.organization.trim();
  if (!project || !organization) return null;

  const auth = withAdoProject(caller, project);
  const bootstrap = await getServerAuthBootstrap();
  const isAdmin = bootstrap.isAdmin;

  const [profile, taskDateFieldOptions, taskStates] = await Promise.all([
    resolveProcessProfile(auth),
    listTaskDateFieldOptions(auth),
    isAdmin ? listTaskStates(auth) : Promise.resolve(undefined),
  ]);

  let team: string | undefined;
  if (isIronSessionConfigured()) {
    const session = await getTaskPilotSession();
    const trimmedTeam = session.defaultTeam?.trim();
    if (trimmedTeam) team = trimmedTeam;
  }

  return {
    connection: {
      organization,
      project,
      ...(team ? { team } : {}),
    },
    profile,
    taskDateFieldOptions,
    ...(taskStates ? { taskStates } : {}),
  };
}

export async function rediscoverProcessProfileForProject(
  project: string,
): Promise<AdoProcessProfile | null> {
  const caller = await resolveAdoCaller();
  if (!caller) return null;

  const auth = withAdoProject(caller, project.trim());
  return buildProcessProfileForAuth(auth);
}
