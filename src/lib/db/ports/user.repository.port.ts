export type UserWithRole = {
  id: string;
  displayName: string | null;
  email: string | null;
  authProvider: "local" | "entra";
  roleId: string | null;
  roleName: string | null;
  roleDisplayName: string | null;
  /** Proyecto ADO conectado al usuario (de `ado_connections`). `null` si no ha conectado ADO. */
  project: string | null;
  /** Organización ADO del usuario (de `ado_connections`). `null` si no ha conectado ADO. */
  adoOrganization: string | null;
  isActive: boolean;
  createdAt: string;
};

export type UpdateUserInput = {
  roleId?: string;
  isActive?: boolean;
};

export interface UserRepository {
  listAllWithRoles(): Promise<UserWithRole[]>;
  listRoles(): Promise<{ id: string; name: string; displayName: string }[]>;
  updateUser(userId: string, data: UpdateUserInput): Promise<void>;
}
