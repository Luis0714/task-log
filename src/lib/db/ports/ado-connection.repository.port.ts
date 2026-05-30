export type LoadedPatConnection = {
  authMethod: "pat";
  pat: string;
  organization: string;
  project: string;
  team: string | null;
};

export type LoadedOAuthConnection = {
  authMethod: "oauth";
  refreshToken: string;
  organization: string;
  project: string;
  team: string | null;
};

export type LoadedAdoConnection = LoadedPatConnection | LoadedOAuthConnection;

export interface AdoConnectionRepository {
  loadByUserId(userId: string): Promise<LoadedAdoConnection | null>;
}
