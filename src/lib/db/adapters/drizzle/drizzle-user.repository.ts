import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import type { UpdateUserInput, UserRepository } from "@/lib/db/ports/user.repository.port";
import { roles, users } from "@/lib/db/schema";

export const drizzleUserRepository: UserRepository = {
  async listAllWithRoles() {
    const rows = await getDb()
      .select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        authProvider: users.authProvider,
        roleId: users.roleId,
        roleName: roles.name,
        roleDisplayName: roles.displayName,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .orderBy(users.displayName);

    return rows.map((r) => ({
      id: r.id,
      displayName: r.displayName ?? null,
      email: r.email ?? null,
      authProvider: r.authProvider,
      roleId: r.roleId ?? null,
      roleName: r.roleName ?? null,
      roleDisplayName: r.roleDisplayName ?? null,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  async listRoles() {
    return getDb()
      .select({ id: roles.id, name: roles.name, displayName: roles.displayName })
      .from(roles)
      .orderBy(roles.name);
  },

  async updateUser(userId: string, data: UpdateUserInput) {
    const set: Record<string, unknown> = {};
    if (data.roleId !== undefined) set.roleId = data.roleId;
    if (data.isActive !== undefined) set.isActive = data.isActive;
    if (Object.keys(set).length === 0) return;
    await getDb().update(users).set(set).where(eq(users.id, userId));
  },
};
