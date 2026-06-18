"use client";

import { useState } from "react";

import { updateAdminUser } from "@/services/admin/admin-users.service";
import type { UserWithRole } from "@/lib/db/ports/user.repository.port";

type UserRow = UserWithRole & { pending?: boolean };

type RoleOption = { id: string; name: string; displayName: string };

export function useAdminUsersTable(
  initialUsers: UserWithRole[],
  roles: RoleOption[],
  currentUserId?: string,
) {
  const [rows, setRows] = useState<UserRow[]>(initialUsers);

  function applyOptimistic(userId: string, data: Partial<UserRow>) {
    setRows((prev) =>
      prev.map((r) => (r.id === userId ? { ...r, ...data } : r)),
    );
  }

  function revertOptimistic(userId: string, snapshot: UserRow) {
    setRows((prev) =>
      prev.map((r) => (r.id === userId ? { ...snapshot, pending: false } : r)),
    );
  }

  async function changeRole(userId: string, roleId: string) {
    if (userId === currentUserId) return;
    const snapshot = rows.find((r) => r.id === userId);
    if (!snapshot || snapshot.pending) return;

    const role = roles.find((ro) => ro.id === roleId);
    applyOptimistic(userId, {
      roleId,
      roleName: role?.name ?? null,
      roleDisplayName: role?.displayName ?? null,
      pending: true,
    });

    try {
      await updateAdminUser(userId, { roleId });
      applyOptimistic(userId, { pending: false });
    } catch {
      revertOptimistic(userId, snapshot);
    }
  }

  async function toggleActive(userId: string) {
    if (userId === currentUserId) return;
    const snapshot = rows.find((r) => r.id === userId);
    if (!snapshot || snapshot.pending) return;

    const nextActive = !snapshot.isActive;
    applyOptimistic(userId, { isActive: nextActive, pending: true });

    try {
      await updateAdminUser(userId, { isActive: nextActive });
      applyOptimistic(userId, { pending: false });
    } catch {
      revertOptimistic(userId, snapshot);
    }
  }

  return { rows, changeRole, toggleActive };
}
