import "server-only";

import { eq, type SQL } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import type { LoadedAdoConnection } from "@/lib/db/ports/ado-connection.repository.port";
import { adoConnections, users } from "@/lib/db/schema";
import { decryptAdoSecrets } from "@/lib/security/ado-secrets";

export type UserAdoConnectionRow = {
  userId: string;
  username: string | null;
  passwordHash: string | null;
  entraSubject: string | null;
  authProvider: "local" | "entra";
  organization: string;
  project: string;
  team: string | null;
  encryptedSecrets: string;
  authMethod: "pat" | "oauth";
};

export type EncryptedAdoConnectionRow = {
  authMethod: "pat" | "oauth";
  organization: string;
  project: string;
  team: string | null;
  encryptedSecrets: string;
};

export function isLocalPatRow(row: UserAdoConnectionRow): boolean {
  return (
    Boolean(row.username && row.passwordHash) &&
    row.authProvider === "local" &&
    row.authMethod === "pat"
  );
}

export function isEntraOAuthRow(row: UserAdoConnectionRow): boolean {
  return (
    Boolean(row.entraSubject) &&
    row.authProvider === "entra" &&
    row.authMethod === "oauth"
  );
}

export function mapEncryptedAdoConnectionRow(
  row: EncryptedAdoConnectionRow,
): LoadedAdoConnection | null {
  const secrets = decryptAdoSecrets(row.encryptedSecrets);

  if (row.authMethod === "pat") {
    if (secrets.kind !== "pat") return null;
    return {
      authMethod: "pat",
      pat: secrets.pat,
      organization: row.organization,
      project: row.project,
      team: row.team,
    };
  }

  if (secrets.kind !== "oauth") {
    throw new Error("La conexión guardada no es OAuth.");
  }

  return {
    authMethod: "oauth",
    refreshToken: secrets.refreshToken,
    organization: row.organization,
    project: row.project,
    team: row.team,
  };
}

export async function findUserAdoConnectionRow(
  where: SQL,
): Promise<UserAdoConnectionRow | null> {
  const rows = await getDb()
    .select({
      userId: users.id,
      username: users.username,
      passwordHash: users.passwordHash,
      entraSubject: users.entraSubject,
      authProvider: users.authProvider,
      organization: adoConnections.organization,
      project: adoConnections.project,
      team: adoConnections.team,
      encryptedSecrets: adoConnections.encryptedSecrets,
      authMethod: adoConnections.authMethod,
    })
    .from(users)
    .innerJoin(adoConnections, eq(adoConnections.userId, users.id))
    .where(where)
    .limit(1);

  return rows[0] ?? null;
}

export type AdoConnectionInsert = {
  userId: string;
  authMethod: "pat" | "oauth";
  organization: string;
  project: string;
  team?: string | null;
  encryptedSecrets: string;
  adoProfileId?: string;
};

type DbTransaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

export async function insertAdoConnectionRecord(
  tx: DbTransaction,
  input: AdoConnectionInsert,
): Promise<void> {
  await tx.insert(adoConnections).values({
    userId: input.userId,
    authMethod: input.authMethod,
    organization: input.organization.trim(),
    project: input.project.trim(),
    team: input.team?.trim() || null,
    encryptedSecrets: input.encryptedSecrets,
    adoProfileId: input.adoProfileId,
  });
}
