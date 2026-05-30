export type EntraUserWithOAuthConnection = {
  userId: string;
  entraSubject: string;
  organization: string;
  project: string;
  team: string | null;
};

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

export interface EntraUserRepository {
  findWithOAuthConnection(
    entraSubject: string,
  ): Promise<EntraUserWithOAuthConnection | null>;
  upsertOAuthUser(input: UpsertEntraOAuthUserInput): Promise<{ userId: string }>;
  updateOAuthRefreshToken(userId: string, refreshToken: string): Promise<void>;
}
