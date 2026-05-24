"use client";

import { History } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";

export type CopilotHistoryListProps = {
  entries: CopilotHistoryEntry[];
};

export function CopilotHistoryList({ entries }: CopilotHistoryListProps) {
  return (
    <section className="space-y-2">
      <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <History className="size-4" aria-hidden />
        Historial reciente
      </div>
      <Separator />
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Las ejecuciones aparecerán aquí (solo en este navegador).
        </p>
      ) : (
        <div className="border-border h-36 overflow-y-auto rounded-lg border md:h-40">
          <ul className="space-y-2 p-3 text-sm">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="border-border/60 flex flex-col gap-0.5 border-b pb-2 last:border-0 last:pb-0"
              >
                <time className="text-muted-foreground text-xs" dateTime={entry.at}>
                  {new Date(entry.at).toLocaleString()}
                </time>
                <span className={entry.ok ? "text-foreground" : "text-destructive"}>
                  {entry.summary}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
