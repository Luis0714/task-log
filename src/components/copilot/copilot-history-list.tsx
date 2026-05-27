"use client";

import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import { formatDateTime } from "@/lib/date/date-range";

export type CopilotHistoryListProps = {
  entries: CopilotHistoryEntry[];
};

export function CopilotHistoryList({ entries }: CopilotHistoryListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Sin ejecuciones en el rango seleccionado.
      </p>
    );
  }

  return (
    <ul className="space-y-2 p-3 text-sm">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="border-border/60 flex flex-col gap-0.5 border-b pb-2 last:border-0 last:pb-0"
        >
          <time className="text-muted-foreground text-xs" dateTime={entry.at}>
            {formatDateTime(entry.at)}
          </time>
          <span className={entry.ok ? "text-foreground" : "text-destructive"}>
            {entry.summary}
          </span>
        </li>
      ))}
    </ul>
  );
}
