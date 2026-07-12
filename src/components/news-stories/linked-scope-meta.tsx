import { Folder, Users } from "lucide-react";

import type { ProjectTeamNewsStory } from "@/lib/db";

export type LinkedScopeMetaProps = Readonly<{ row: ProjectTeamNewsStory }>;

/**
 * Línea meta con (Proyecto, Equipo) a la que la HU está vinculada. Si
 * `teamId` es `null`, se muestra "Nivel proyecto" como placeholder.
 */
export function LinkedScopeMeta({ row }: LinkedScopeMetaProps) {
  return (
    <span className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
      <span className="inline-flex items-center gap-1">
        <Folder className="size-3" aria-hidden />
        {row.projectId}
      </span>
      <span className="inline-flex items-center gap-1">
        <Users className="size-3" aria-hidden />
        {row.teamId ?? "Nivel proyecto"}
      </span>
    </span>
  );
}
