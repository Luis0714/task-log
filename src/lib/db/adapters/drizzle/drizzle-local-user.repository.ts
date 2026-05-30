import "server-only";

import { eq } from "drizzle-orm";

import {
  findUserAdoConnectionRow,
  insertAdoConnectionRecord,
  isLocalPatRow,
} from "@/lib/db/adapters/drizzle/drizzle-shared";
import { getDb } from "@/lib/db/client";
import type {
  CreateLocalPatUserInput,
  LocalUserRepository,
  LocalUserWithPatConnection,
} from "@/lib/db/ports/local-user.repository.port";
import { users } from "@/lib/db/schema";
import { encryptAdoSecrets } from "@/lib/security/ado-secrets";

function mapLocalUserRow(
  row: NonNullable<Awaited<ReturnType<typeof findUserAdoConnectionRow>>>,
): LocalUserWithPatConnection | null {
  if (!isLocalPatRow(row)) return null;

  return {
    userId: row.userId,
    username: row.username!,
    passwordHash: row.passwordHash!,
    organization: row.organization,
    project: row.project,
    team: row.team,
  };
}

export const drizzleLocalUserRepository: LocalUserRepository = {
  async findWithPatConnection(email) {
    const row = await findUserAdoConnectionRow(eq(users.username, email));
    return row ? mapLocalUserRow(row) : null;
  },

  async createPatUser(input: CreateLocalPatUserInput) {
    const encryptedSecrets = encryptAdoSecrets({
      kind: "pat",
      pat: input.pat.trim(),
    });

    return getDb().transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          username: input.email,
          email: input.email,
          passwordHash: input.passwordHash,
          authProvider: "local",
          displayName: input.displayName,
        })
        .returning({ id: users.id });

      if (!user) {
        throw new Error("No se pudo crear el usuario.");
      }

      await insertAdoConnectionRecord(tx, {
        userId: user.id,
        authMethod: "pat",
        organization: input.organization,
        project: input.project,
        team: input.team,
        encryptedSecrets,
        adoProfileId: input.adoProfileId,
      });

      return { userId: user.id };
    });
  },
};
