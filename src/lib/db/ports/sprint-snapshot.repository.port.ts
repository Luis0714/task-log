import type { SprintGoalScope } from "@/lib/db/ports/sprint-story-goal.repository.port";
import type {
  SaveSprintSnapshotInput,
  SprintSnapshotData,
} from "@/lib/sprints/sprint-snapshot-types";

export type SprintSnapshotRepository = {
  getLatestByScope(scope: SprintGoalScope): Promise<SprintSnapshotData | null>;
  existsByScope(scope: SprintGoalScope): Promise<boolean>;
  save(scope: SprintGoalScope, input: SaveSprintSnapshotInput): Promise<SprintSnapshotData>;
};
