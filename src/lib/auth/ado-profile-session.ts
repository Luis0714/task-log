import type { AdoUserProfile } from "@/lib/azure-devops/profile";
import {
  getTaskPilotSession,
  isIronSessionConfigured,
  type TaskPilotSessionData,
} from "@/lib/auth/session";

function fromStored(stored: TaskPilotSessionData["adoProfile"]): AdoUserProfile | null {
  if (!stored?.id?.trim() || !stored.displayName?.trim()) return null;
  return {
    id: stored.id,
    displayName: stored.displayName,
    publicAlias: stored.publicAlias,
  };
}

export async function readCachedAdoProfile(): Promise<AdoUserProfile | null> {
  if (!isIronSessionConfigured()) return null;
  const session = await getTaskPilotSession();
  return fromStored(session.adoProfile);
}

export async function writeCachedAdoProfile(profile: AdoUserProfile): Promise<void> {
  if (!isIronSessionConfigured()) return;
  const session = await getTaskPilotSession();
  session.adoProfile = {
    id: profile.id,
    displayName: profile.displayName,
    publicAlias: profile.publicAlias,
  };
  await session.save();
}
