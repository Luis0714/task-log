"use client";

import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import { getHistoryEntryDisplay } from "@/lib/history/history-entry-display";

export type CopilotHistoryListProps = {
  entries: CopilotHistoryEntry[];
  totalCount?: number;
};

export function CopilotHistoryList({ entries, totalCount = 0 }: CopilotHistoryListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        {totalCount > 0
          ? "Sin ejecuciones en el rango seleccionado."
          : "Sin ejecuciones guardadas para esta cuenta."}
      </p>
    );
  }

  return (
    <ul className="space-y-2 p-3 text-sm">
      {entries.map((entry) => (
        <HistoryListItem key={entry.id} entry={entry} />
      ))}
    </ul>
  );
}

type HistoryListItemProps = {
  entry: CopilotHistoryEntry;
};

function HistoryListItem({ entry }: HistoryListItemProps) {
  const display = getHistoryEntryDisplay(entry);

  return (
    <li className="border-border/60 flex flex-col gap-0.5 border-b pb-2 last:border-0 last:pb-0">
      {display.workingDateTime ? (
        <>
          <time className="text-muted-foreground text-xs" dateTime={display.workingDateTime}>
            Día de trabajo: {display.workingDateLabel}
          </time>
          {display.executedAtLabel ? (
            <span className="text-muted-foreground text-xs">
              Registrado: {display.executedAtLabel}
            </span>
          ) : null}
        </>
      ) : (
        <time className="text-muted-foreground text-xs" dateTime={display.executedDateTime!}>
          {display.executedAtLabel}
        </time>
      )}
      <span className={entry.ok ? "text-foreground" : "text-destructive"}>
        {entry.summary}
      </span>
    </li>
  );
}
