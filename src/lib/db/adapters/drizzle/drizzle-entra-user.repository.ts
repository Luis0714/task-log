import "server-only";

import { eq } from "drizzle-orm";

import {
  findUserAdoConnectionRow,
  insertAdoConnectionRecord,
  isEntraOAuthRow,
} from "@/lib/db/adapters/drizzle/drizzle-shared";
import { getDb } from "@/lib/db/client";
import type {
  EntraUserRepository,
  EntraUserWithOAuthConnection,
  UpsertEntraOAuthUserInput,
} from "@/lib/db/ports/entra-user.repository.port";
import { adoConnections, users } from "@/lib/db/schema";
import { encryptAdoSecrets } from "@/lib/security/ado-secrets";

function mapEntraUserRow(
  row: NonNullable<Awaited<ReturnType<typeof findUserAdoConnectionRow>>>,
): EntraUserWithOAuthConnection | null {
  if (!isEntraOAuthRow(row)) return null;

  return {
    userId: row.userId,
    entraSubject: row.entraSubject!,
    organization: row.organization,
    project: row.project,
    team: row.team,
  };
}

export const drizzleEntraUserRepository: EntraUserRepository = {
  async findWithOAuthConnection(entraSubject) {
    const row = await findUserAdoConnectionRow(eq(users.entraSubject, entraSubject));
    return row ? mapEntraUserRow(row) : null;
  },

  async upsertOAuthUser(input: UpsertEntraOAuthUserInput) {
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

      await insertAdoConnectionRecord(tx, {
        userId: user.id,
        authMethod: "oauth",
        organization: input.organization,
        project: input.project,
        team: input.team,
        encryptedSecrets,
        adoProfileId: input.adoProfileId,
      });

      return { userId: user.id };
    });
  },

  async updateOAuthRefreshToken(userId, refreshToken) {
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
  },
};
