import "server-only";

import { applyContextDefaultsToSession } from "@/lib/auth/apply-context-defaults-to-session";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";

export async function loadSessionDefaultRepository(): Promise<string | null> {
  if (!isIronSessionConfigured()) return null;

  const session = await getTaskPilotSession();
  const fromSession = session.defaultRepository?.trim();
  if (fromSession) return fromSession;

  const { changed } = await applyContextDefaultsToSession(session);
  if (changed) await session.save();

  return session.defaultRepository?.trim() || null;
}
