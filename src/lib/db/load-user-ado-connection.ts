import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { adoConnections, users } from "@/lib/db/schema";
import { readOAuthRefreshToken } from "@/lib/db/repositories/entra-user.repository";
import { decryptAdoSecrets } from "@/lib/security/ado-secrets";

export type LoadedPatConnection = {
  authMethod: "pat";
  pat: string;
  organization: string;
  project: string;
  team: string | null;
};

export type LoadedOAuthConnection = {
  authMethod: "oauth";
  refreshToken: string;
  organization: string;
  project: string;
  team: string | null;
};

export type LoadedAdoConnection = LoadedPatConnection | LoadedOAuthConnection;

export async function loadUserAdoConnection(
  userId: string,
): Promise<LoadedAdoConnection | null> {
  const rows = await getDb()
    .select({
      authMethod: adoConnections.authMethod,
      organization: adoConnections.organization,
      project: adoConnections.project,
      team: adoConnections.team,
      encryptedSecrets: adoConnections.encryptedSecrets,
    })
    .from(adoConnections)
    .where(eq(adoConnections.userId, userId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  if (row.authMethod === "pat") {
    const secrets = decryptAdoSecrets(row.encryptedSecrets);
    if (secrets.kind !== "pat") return null;
    return {
      authMethod: "pat",
      pat: secrets.pat,
      organization: row.organization,
      project: row.project,
      team: row.team,
    };
  }

  return {
    authMethod: "oauth",
    refreshToken: readOAuthRefreshToken(row.encryptedSecrets),
    organization: row.organization,
    project: row.project,
    team: row.team,
  };
}

export async function loadEntraUserAdoConnection(
  entraSubject: string,
): Promise<LoadedAdoConnection | null> {
  const rows = await getDb()
    .select({ userId: users.id })
    .from(users)
    .where(eq(users.entraSubject, entraSubject))
    .limit(1);

  const userId = rows[0]?.userId;
  if (!userId) return null;
  return loadUserAdoConnection(userId);
}
