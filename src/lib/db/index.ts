export { getDb, isDatabaseConfigured } from "@/lib/db/client";
export {
  getRepositories,
  resetRepositories,
  setRepositories,
  type Repositories,
} from "@/lib/db/container";
export { isUserPersistenceReady } from "@/lib/db/is-persistence-ready";
export type {
  LoadedAdoConnection,
  LoadedOAuthConnection,
  LoadedPatConnection,
} from "@/lib/db/ports/ado-connection.repository.port";
export type { AdoConnectionRepository } from "@/lib/db/ports/ado-connection.repository.port";
export type {
  CreateLocalPatUserInput,
  LocalUserRepository,
  LocalUserWithPatConnection,
} from "@/lib/db/ports/local-user.repository.port";
export type {
  EntraUserRepository,
  EntraUserWithOAuthConnection,
  UpsertEntraOAuthUserInput,
} from "@/lib/db/ports/entra-user.repository.port";
export type {
  UserFilterPreferencesRepository,
  UserFilterScope,
} from "@/lib/db/ports/user-filter-preferences.repository.port";
export {
  adoAuthMethodEnum,
  adoConnections,
  userAuthProviderEnum,
  userFilterPreferences,
  users,
  type AdoConnection,
  type NewAdoConnection,
  type NewUser,
  type NewUserFilterPreferences,
  type User,
  type UserFilterPreferences,
} from "@/lib/db/schema";
