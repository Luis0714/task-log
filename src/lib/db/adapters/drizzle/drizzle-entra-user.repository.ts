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
import { adoConnections, roles, users } from "@/lib/db/schema";
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
    const now = new Date();

    // Resolve role by name if provided
    let newRoleId: string | null = null;
    let newRoleName: string | null = null;
    if (input.selectedRole) {
      const roleRow = await getDb()
        .select({ id: roles.id, name: roles.name })
        .from(roles)
        .where(eq(roles.name, input.selectedRole))
        .limit(1);
      if (roleRow[0]) {
        newRoleId = roleRow[0].id;
        newRoleName = roleRow[0].name;
      }
    }

    // Find existing user with their current role name
    const existing = await getDb()
      .select({
        id: users.id,
        roleId: users.roleId,
        isActive: users.isActive,
        currentRoleName: roles.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.entraSubject, input.entraSubject))
      .limit(1);

    const existingUser = existing[0];
    const userId = existingUser?.id;

    if (userId) {
      const isSuperAdmin = existingUser.currentRoleName === "super_admin";
      const shouldUpdateRole = newRoleId !== null && !isSuperAdmin;

      await getDb().transaction(async (tx) => {
        await tx
          .update(users)
          .set({
            displayName: input.displayName,
            email: input.email,
            ...(shouldUpdateRole ? { roleId: newRoleId } : {}),
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

      const effectiveRoleName = isSuperAdmin
        ? existingUser.currentRoleName
        : (shouldUpdateRole ? newRoleName : existingUser.currentRoleName);

      return {
        userId,
        roleName: effectiveRoleName ?? null,
        isActive: existingUser.isActive,
      };
    }

    return getDb().transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          authProvider: "entra",
          entraSubject: input.entraSubject,
          displayName: input.displayName,
          email: input.email,
          ...(newRoleId ? { roleId: newRoleId } : {}),
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

      return { userId: user.id, roleName: newRoleName, isActive: true };
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
