import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { adoConnections, users } from "@/lib/db/schema";
import { decryptAdoSecrets, encryptAdoSecrets } from "@/lib/security/ado-secrets";

export type EntraUserWithOAuthConnection = {
  userId: string;
  entraSubject: string;
  organization: string;
  project: string;
  team: string | null;
  encryptedSecrets: string;
};

export async function findEntraUserWithOAuthConnection(
  entraSubject: string,
): Promise<EntraUserWithOAuthConnection | null> {
  const rows = await getDb()
    .select({
      userId: users.id,
      entraSubject: users.entraSubject,
      organization: adoConnections.organization,
      project: adoConnections.project,
      team: adoConnections.team,
      encryptedSecrets: adoConnections.encryptedSecrets,
      authMethod: adoConnections.authMethod,
      authProvider: users.authProvider,
    })
    .from(users)
    .innerJoin(adoConnections, eq(adoConnections.userId, users.id))
    .where(eq(users.entraSubject, entraSubject))
    .limit(1);

  const row = rows[0];
  if (!row?.entraSubject) return null;
  if (row.authProvider !== "entra" || row.authMethod !== "oauth") return null;

  return {
    userId: row.userId,
    entraSubject: row.entraSubject,
    organization: row.organization,
    project: row.project,
    team: row.team,
    encryptedSecrets: row.encryptedSecrets,
  };
}

export type UpsertEntraOAuthUserInput = {
  entraSubject: string;
  refreshToken: string;
  organization: string;
  project: string;
  team?: string;
  displayName?: string;
  adoProfileId?: string;
  email?: string;
};

export async function upsertEntraOAuthUser(
  input: UpsertEntraOAuthUserInput,
): Promise<{ userId: string }> {
  const encryptedSecrets = encryptAdoSecrets({
    kind: "oauth",
    refreshToken: input.refreshToken.trim(),
  });

  const existing = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.entraSubject, input.entraSubject))
    .limit(1);

  const now = new Date();
  const userId = existing[0]?.id;

  if (userId) {
    await getDb().transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          displayName: input.displayName,
          email: input.email,
          updatedAt: now,
        })
        .where(eq(users.id, userId));

      await tx
        .update(adoConnections)
        .set({
          authMethod: "oauth",
          organization: input.organization.trim(),
          project: input.project.trim(),
          team: input.team?.trim() || null,
          encryptedSecrets,
          adoProfileId: input.adoProfileId,
          updatedAt: now,
        })
        .where(eq(adoConnections.userId, userId));
    });

    return { userId };
  }

  return getDb().transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        authProvider: "entra",
        entraSubject: input.entraSubject,
        displayName: input.displayName,
        email: input.email,
      })
      .returning({ id: users.id });

    if (!user) {
      throw new Error("No se pudo crear el usuario Entra.");
    }

    await tx.insert(adoConnections).values({
      userId: user.id,
      authMethod: "oauth",
      organization: input.organization.trim(),
      project: input.project.trim(),
      team: input.team?.trim() || null,
      encryptedSecrets,
      adoProfileId: input.adoProfileId,
    });

    return { userId: user.id };
  });
}

export async function updateEntraOAuthRefreshToken(
  userId: string,
  refreshToken: string,
): Promise<void> {
  const encryptedSecrets = encryptAdoSecrets({
    kind: "oauth",
    refreshToken: refreshToken.trim(),
  });

  await getDb()
    .update(adoConnections)
    .set({
      encryptedSecrets,
      updatedAt: new Date(),
    })
    .where(eq(adoConnections.userId, userId));
}

export function readOAuthRefreshToken(encryptedSecrets: string): string {
  const secrets = decryptAdoSecrets(encryptedSecrets);
  if (secrets.kind !== "oauth") {
    throw new Error("La conexión guardada no es OAuth.");
  }
  return secrets.refreshToken;
}
