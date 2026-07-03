import "server-only";

import { isDatabaseConfigured } from "@/lib/db/client";
import { getRepositories } from "@/lib/db/container";
import type { SprintGoalScope } from "@/lib/db/ports/sprint-story-goal.repository.port";

export async function isSprintScopeFinalized(scope: SprintGoalScope): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  return getRepositories().sprintSnapshot.existsByScope(scope);
}
