import "server-only";

import { drizzleAdoConnectionRepository } from "@/lib/db/adapters/drizzle/drizzle-ado-connection.repository";
import { drizzleEntraUserRepository } from "@/lib/db/adapters/drizzle/drizzle-entra-user.repository";
import { drizzleLocalUserRepository } from "@/lib/db/adapters/drizzle/drizzle-local-user.repository";
import type { AdoConnectionRepository } from "@/lib/db/ports/ado-connection.repository.port";
import type { EntraUserRepository } from "@/lib/db/ports/entra-user.repository.port";
import type { LocalUserRepository } from "@/lib/db/ports/local-user.repository.port";
import { drizzleSprintSnapshotRepository } from "@/lib/db/adapters/drizzle/drizzle-sprint-snapshot.repository";
import { drizzleSprintGoalRepository } from "@/lib/db/adapters/drizzle/drizzle-sprint-goal.repository";
import { drizzleSprintStoryGoalRepository } from "@/lib/db/adapters/drizzle/drizzle-sprint-story-goal.repository";
import type { SprintGoalRepository } from "@/lib/db/ports/sprint-goal.repository.port";
import type { SprintSnapshotRepository } from "@/lib/db/ports/sprint-snapshot.repository.port";
import type { SprintStoryGoalRepository } from "@/lib/db/ports/sprint-story-goal.repository.port";

export type Repositories = {
  localUser: LocalUserRepository;
  entraUser: EntraUserRepository;
  adoConnection: AdoConnectionRepository;
  sprintGoal: SprintGoalRepository;
  sprintStoryGoal: SprintStoryGoalRepository;
  sprintSnapshot: SprintSnapshotRepository;
};

const defaultRepositories: Repositories = {
  localUser: drizzleLocalUserRepository,
  entraUser: drizzleEntraUserRepository,
  adoConnection: drizzleAdoConnectionRepository,
  sprintGoal: drizzleSprintGoalRepository,
  sprintStoryGoal: drizzleSprintStoryGoalRepository,
  sprintSnapshot: drizzleSprintSnapshotRepository,
};

let repositories: Repositories = defaultRepositories;

/** Punto único de composición (DI) para la capa de persistencia. */
export function getRepositories(): Repositories {
  return repositories;
}

/** Solo para tests o sustitución de adaptadores. */
export function setRepositories(next: Repositories): void {
  repositories = next;
}

export function resetRepositories(): void {
  repositories = defaultRepositories;
}
