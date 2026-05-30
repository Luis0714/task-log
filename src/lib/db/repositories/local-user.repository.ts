import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { adoConnections, users } from "@/lib/db/schema";
import { encryptAdoSecrets } from "@/lib/security/ado-secrets";

export type LocalUserWithPatConnection = {
  userId: string;
  username: string;
  passwordHash: string;
  organization: string;
  project: string;
  team: string | null;
  encryptedSecrets: string;
};

export async function findLocalUserWithPatConnection(
  username: string,
): Promise<LocalUserWithPatConnection | null> {
  const rows = await getDb()
    .select({
      userId: users.id,
      username: users.username,
      passwordHash: users.passwordHash,
      organization: adoConnections.organization,
      project: adoConnections.project,
      team: adoConnections.team,
      encryptedSecrets: adoConnections.encryptedSecrets,
      authMethod: adoConnections.authMethod,
      authProvider: users.authProvider,
    })
    .from(users)
    .innerJoin(adoConnections, eq(adoConnections.userId, users.id))
    .where(eq(users.username, username))
    .limit(1);

  const row = rows[0];
  if (!row?.username || !row.passwordHash) return null;
  if (row.authProvider !== "local" || row.authMethod !== "pat") return null;

  return {
    userId: row.userId,
    username: row.username,
    passwordHash: row.passwordHash,
    organization: row.organization,
    project: row.project,
    team: row.team,
    encryptedSecrets: row.encryptedSecrets,
  };
}

export type CreateLocalPatUserInput = {
  username: string;
  passwordHash: string;
  organization: string;
  project: string;
  team?: string;
  pat: string;
  adoProfileId?: string;
  displayName?: string;
};

export async function createLocalPatUser(
  input: CreateLocalPatUserInput,
): Promise<{ userId: string }> {
  const encryptedSecrets = encryptAdoSecrets({
    kind: "pat",
    pat: input.pat.trim(),
  });

  return getDb().transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        username: input.username,
        passwordHash: input.passwordHash,
        authProvider: "local",
        displayName: input.displayName,
      })
      .returning({ id: users.id });

    if (!user) {
      throw new Error("No se pudo crear el usuario.");
    }

    await tx.insert(adoConnections).values({
      userId: user.id,
      authMethod: "pat",
      organization: input.organization.trim(),
      project: input.project.trim(),
      team: input.team?.trim() || null,
      encryptedSecrets,
      adoProfileId: input.adoProfileId,
    });

    return { userId: user.id };
  });
}
