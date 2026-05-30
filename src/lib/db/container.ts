import "server-only";

import { drizzleAdoConnectionRepository } from "@/lib/db/adapters/drizzle/drizzle-ado-connection.repository";
import { drizzleEntraUserRepository } from "@/lib/db/adapters/drizzle/drizzle-entra-user.repository";
import { drizzleLocalUserRepository } from "@/lib/db/adapters/drizzle/drizzle-local-user.repository";
import type { AdoConnectionRepository } from "@/lib/db/ports/ado-connection.repository.port";
import type { EntraUserRepository } from "@/lib/db/ports/entra-user.repository.port";
import type { LocalUserRepository } from "@/lib/db/ports/local-user.repository.port";

export type Repositories = {
  localUser: LocalUserRepository;
  entraUser: EntraUserRepository;
  adoConnection: AdoConnectionRepository;
};

const defaultRepositories: Repositories = {
  localUser: drizzleLocalUserRepository,
  entraUser: drizzleEntraUserRepository,
  adoConnection: drizzleAdoConnectionRepository,
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
