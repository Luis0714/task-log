export type UserWithRole = {
  id: string;
  displayName: string | null;
  email: string | null;
  authProvider: "local" | "entra";
  roleId: string | null;
  roleName: string | null;
  roleDisplayName: string | null;
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
