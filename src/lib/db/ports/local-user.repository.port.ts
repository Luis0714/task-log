export type LocalUserWithPatConnection = {
  userId: string;
  username: string;
  passwordHash: string;
  roleName: string | null;
  organization: string;
  project: string;
  team: string | null;
};

export type CreateLocalPatUserInput = {
  email: string;
  passwordHash: string;
  organization: string;
  project: string;
  team?: string;
  pat: string;
  adoProfileId?: string;
  displayName?: string;
};

export interface LocalUserRepository {
  findWithPatConnection(email: string): Promise<LocalUserWithPatConnection | null>;
  createPatUser(input: CreateLocalPatUserInput): Promise<{ userId: string }>;
}
