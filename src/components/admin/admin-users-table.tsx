"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminUsersTable } from "@/hooks/admin/use-admin-users-table";
import { filterAdminUsersByQuery } from "@/lib/admin/filter-admin-users";
import { cn } from "@/lib/utils";
import type { UserWithRole } from "@/lib/db/ports/user.repository.port";

type RoleOption = { id: string; name: string; displayName: string };

export type AdminUsersTableProps = {
  users: UserWithRole[];
  roles: RoleOption[];
  currentUserId?: string;
};

const AUTH_PROVIDER_LABELS: Record<string, string> = {
  local: "Local",
  entra: "Microsoft",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FORMATTER.format(date);
}

export function AdminUsersTable({
  users,
  roles,
  currentUserId,
}: AdminUsersTableProps) {
  const { rows, changeRole, toggleActive } = useAdminUsersTable(
    users,
    roles,
    currentUserId,
  );
  const assignableRoles = roles.filter((r) => r.name !== "super_admin");

  const [query, setQuery] = useState("");
  const visibleRows = useMemo(
    () => filterAdminUsersByQuery(rows, query),
    [rows, query],
  );

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="admin-users-search" className="sr-only">
          Buscar usuario o proyecto
        </label>
        <Input
          id="admin-users-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre o proyecto…"
          className={cn("h-9 max-w-sm")}
        />
        {query ? (
          <span className="text-muted-foreground text-xs">
            {visibleRows.length} resultado{visibleRows.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground border-b text-left">
              <th className="px-4 py-3 font-medium">Proyecto</th>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Proveedor</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Fecha de creación</th>
              <th className="px-4 py-3 font-medium text-center">Activo</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((user) => (
              <tr
                key={user.id}
                className={cn(
                  "border-b last:border-0 transition-opacity",
                  user.pending && "opacity-60",
                )}
              >
                <td className="text-muted-foreground px-4 py-3">
                  {user.project ?? "—"}
                </td>
                <td className="px-4 py-3 font-medium">
                  <span>{user.displayName ?? "—"}</span>
                  {user.id === currentUserId ? (
                    <span className="text-muted-foreground ml-2 text-xs uppercase tracking-wide">
                      (tú)
                    </span>
                  ) : null}
                </td>
                <td className="text-muted-foreground px-4 py-3">
                  {user.email ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {AUTH_PROVIDER_LABELS[user.authProvider] ?? user.authProvider}
                </td>
                <td className="px-4 py-3">
                  {user.roleName === "super_admin" ? (
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      SuperAdmin
                    </span>
                  ) : (
                    <Select
                      value={user.roleId ?? ""}
                      onValueChange={(val) => {
                        if (val) void changeRole(user.id, val);
                      }}
                      disabled={user.pending || user.id === currentUserId}
                    >
                      <SelectTrigger className="h-8 w-44 text-xs">
                        <SelectValue placeholder="Sin rol">
                          {user.roleDisplayName ?? undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </td>
                <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                  {formatCreatedAt(user.createdAt)}
                </td>
                <td className="px-4 py-3 text-center">
                  <ActiveToggle
                    active={user.isActive}
                    disabled={user.pending || user.id === currentUserId}
                    onToggle={() => void toggleActive(user.id)}
                  />
                </td>
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-muted-foreground px-4 py-8 text-center"
                >
                  {query
                    ? `Sin resultados para "${query}".`
                    : "No hay usuarios registrados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type ActiveToggleProps = {
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

function ActiveToggle({ active, disabled, onToggle }: ActiveToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={active ? "Desactivar usuario" : "Activar usuario"}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "inline-flex h-6 w-11 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        active ? "bg-primary" : "bg-input",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          active ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}
