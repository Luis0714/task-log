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
export type {
  ProjectConfigurationRepository,
  ProjectConfigInput,
  ProjectConfigRow,
} from "@/lib/db/ports/project-configuration.repository.port";
export {
  adoAuthMethodEnum,
  adoConnections,
  personProjectAssignments,
  projectTeamNewsStories,
  userAuthProviderEnum,
  userFilterPreferences,
  projectConfigurations,
  users,
  type AdoConnection,
  type NewAdoConnection,
  type NewUser,
  type NewUserFilterPreferences,
  type PersonProjectAssignment,
  type NewPersonProjectAssignment,
  type ProjectTeamNewsStory,
  type NewProjectTeamNewsStory,
  type User,
  type UserFilterPreferences,
  type ProjectConfiguration,
  type NewProjectConfiguration,
} from "@/lib/db/schema";

export type {
  AssignmentFilter,
  CreateAssignmentInput,
  InferredDefaultAssignmentRow,
  InferredDefaultsInput,
  PersonProjectAssignmentNotFoundError,
  PersonProjectAssignmentRepository,
  PersonProjectAssignmentRow,
  PersonProjectAssignmentWithRole,
  UpdateAssignmentEndInput,
  UpdateAssignmentPctInput,
} from "@/lib/db/ports/person-project-assignment.repository.port";

export type {
  CreateNewsStoryInput,
  NewsStoriesFilter,
  NewsStoriesRepository,
} from "@/lib/db/ports/news-stories.repository.port";
