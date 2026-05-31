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

export type AdoConnectionContextDefaults = {
  project: string;
  team: string;
};

export interface AdoConnectionRepository {
  loadByUserId(userId: string): Promise<LoadedAdoConnection | null>;
  updateContextDefaults(
    userId: string,
    defaults: AdoConnectionContextDefaults,
  ): Promise<boolean>;
}
