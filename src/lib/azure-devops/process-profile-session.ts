import "server-only";

import { buildProcessProfileKeyFromAuth } from "@/lib/azure-devops/process-profile-key";
import type { AdoProcessProfile, StoredAdoProcessProfile } from "@/lib/azure-devops/process-profile-types";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { getTaskPilotSession, type TaskPilotSessionData } from "@/lib/auth/session";

function toStoredProfile(auth: AdoCallerAuth, profile: AdoProcessProfile): StoredAdoProcessProfile {
  return {
    organization: auth.organization,
    project: auth.project,
    workingDateField: profile.workingDateField,
    workingDateFieldSource: profile.workingDateFieldSource,
    workItemDateFieldNames: [...profile.workItemDateFieldNames],
    timezone: profile.timezone,
    savedAt: new Date().toISOString(),
  };
}

function fromStoredProfile(stored: StoredAdoProcessProfile): AdoProcessProfile {
  return {
    workingDateField: stored.workingDateField,
    workingDateFieldSource: stored.workingDateFieldSource,
    workItemDateFieldNames: stored.workItemDateFieldNames,
    timezone: stored.timezone,
  };
}

function matchesAuth(stored: StoredAdoProcessProfile, auth: AdoCallerAuth): boolean {
  return stored.organization === auth.organization && stored.project === auth.project;
}

export function applyProcessProfileToSession(
  session: TaskPilotSessionData,
  auth: AdoCallerAuth,
  profile: AdoProcessProfile,
): void {
  const key = buildProcessProfileKeyFromAuth(auth);
  session.adoProcessProfiles = {
    ...session.adoProcessProfiles,
    [key]: toStoredProfile(auth, profile),
  };
}

export async function readProcessProfileFromSession(
  auth: AdoCallerAuth,
): Promise<AdoProcessProfile | null> {
  const session = await getTaskPilotSession();
  const key = buildProcessProfileKeyFromAuth(auth);
  const stored = session.adoProcessProfiles?.[key];
  if (!stored || !matchesAuth(stored, auth)) {
    return null;
  }
  return fromStoredProfile(stored);
}

export async function writeProcessProfileToSession(
  auth: AdoCallerAuth,
  profile: AdoProcessProfile,
): Promise<void> {
  const session = await getTaskPilotSession();
  applyProcessProfileToSession(session, auth, profile);
  await session.save();
}

export function clearProcessProfilesFromSession(session: TaskPilotSessionData): void {
  session.adoProcessProfiles = undefined;
}
