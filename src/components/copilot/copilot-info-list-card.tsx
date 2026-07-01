"use client";

import { Brain, Bug, ExternalLink, ListChecks, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useCurrentProject } from "@/hooks/use-current-project";
import { useBacklogItemStates } from "@/hooks/work-items/use-backlog-item-states";
import { getStatePresentation } from "@/lib/work-items/pbi-state-colors";
import type { InfoListItem, InfoListPayload } from "@/lib/schemas/agent";

export type CopilotInfoListCardProps = {
  messageId: string;
  payload: InfoListPayload;
};

const TYPE_META: Record<InfoListItem["type"], { label: string; Icon: typeof Bug }> = {
  pbi: { label: "Historias", Icon: ListChecks },
  bug: { label: "Bugs", Icon: Bug },
  task: { label: "Tareas", Icon: Sparkles },
};

/**
 * Read-only list of work items returned by the `list_work_items` tool.
 *
 * Layout: header with title + count, then items grouped by `type` or `state`
 * (per `payload.groupBy`). Each item is a link to Azure DevOps. If the query
 * returned no items, shows `emptyHint` (or a default message).
 */
export function CopilotInfoListCard({
  messageId,
  payload,
}: Readonly<CopilotInfoListCardProps>) {
  const total = payload.items.length;
  const grouped = groupItems(payload.items, payload.groupBy);

  return (
    <section
      aria-labelledby={`${messageId}-title`}
      className="space-y-4"
    >
      <header className="flex items-baseline justify-between gap-2">
        <h3
          id={`${messageId}-title`}
          className="text-base font-medium leading-snug"
        >
          {payload.title}
        </h3>
        <span className="text-muted-foreground text-xs tabular-nums">
          {total === 0
            ? "Sin resultados"
            : total === 1
              ? "1 elemento"
              : `${total} elementos`}
        </span>
      </header>

      {payload.summary ? (
        <SummaryBlock summary={payload.summary} />
      ) : null}

      {total === 0 ? (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {payload.emptyHint ?? "No encontré elementos que coincidan con tu consulta."}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {grouped.map((group) => {
            const meta = TYPE_META[group.key as InfoListItem["type"]];
            const Icon = meta?.Icon ?? ListChecks;
            const label =
              meta?.label ?? humanizeKey(payload.groupBy, group.key);
            return (
              <div key={group.key} className="flex flex-col gap-1.5">
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                  <Icon className="size-3.5" aria-hidden />
                  <span>{label}</span>
                  <span className="text-muted-foreground/60 tabular-nums">
                    ({group.items.length})
                  </span>
                </div>
                <ul className="flex flex-col gap-0.5" role="list">
                  {group.items.map((item) => (
                    <InfoListItemRow key={`${group.key}-${item.id}`} item={item} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/**
 * Bloque de análisis razonado del agente (ReAct Observation → conclusión).
 * Se muestra arriba de la lista cuando el LLM hace el ciclo completo
 * de Thought → Action(observation) → Thought(análisis) → Action(terminal con
 * `summary`). Visualmente se distingue con un icono "Brain" y un fondo
 * sutil para diferenciarlo de los datos crudos de la lista.
 */
function SummaryBlock({ summary }: { summary: string }) {
  return (
    <div className="bg-muted/40 border-border/60 flex gap-2.5 rounded-md border px-3 py-2.5">
      <Brain
        className="text-muted-foreground mt-0.5 size-4 shrink-0"
        aria-hidden
      />
      <p className="text-foreground/90 text-sm leading-relaxed">
        <span className="text-muted-foreground mr-1 text-xs font-medium tracking-wide uppercase">
          Análisis
        </span>
        {summary}
      </p>
    </div>
  );
}

function InfoListItemRow({ item }: { item: InfoListItem }) {
  const project = useCurrentProject();
  const { states } = useBacklogItemStates(project);
  const presentation = item.state
    ? getStatePresentation(states, item.state)
    : null;
  // Descartamos `badgeStyle.color` (calculado por luminancia, no respeta el
  // tema) y aplicamos `text-foreground` para garantizar contraste en dark y
  // light mode. El fondo tintado (~10% alpha) es lo bastante sutil para que
  // el foreground del tema siga siendo legible.
  const badgeSurfaceStyle = presentation?.state
    ? (({ color: _ignored, ...rest }) => rest)(presentation.badgeStyle)
    : undefined;

  const content = (
    <>
      <span className="text-muted-foreground font-mono text-xs tabular-nums">
        #{item.id}
      </span>
      <span className="text-foreground min-w-0 flex-1 truncate text-sm leading-snug">
        {item.title}
      </span>
      {item.state ? (
        <Badge
          variant="secondary"
          data-pbi-state={presentation?.category}
          className="text-foreground shrink-0 rounded-full px-2 py-0 text-[10px] font-medium tracking-wide uppercase"
          style={badgeSurfaceStyle}
        >
          {item.state}
        </Badge>
      ) : null}
      {item.url ? (
        <ExternalLink
          className="text-muted-foreground size-3.5 shrink-0"
          aria-hidden
        />
      ) : null}
    </>
  );

  return (
    <li>
      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-ring flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-1"
        >
          {content}
        </a>
      ) : (
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          {content}
        </div>
      )}
    </li>
  );
}

type Group = { key: string; items: InfoListItem[] };

function groupItems(items: InfoListItem[], by: InfoListPayload["groupBy"]): Group[] {
  const map = new Map<string, InfoListItem[]>();
  for (const item of items) {
    const key = by === "state" ? (item.state ?? "Sin estado") : item.type;
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  // Stable order: types in a fixed order, then states alphabetically.
  const order =
    by === "type"
      ? (["pbi", "bug", "task"] as const)
      : null;
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (order) {
        return order.indexOf(a as (typeof order)[number]) - order.indexOf(b as (typeof order)[number]);
      }
      return a.localeCompare(b, "es");
    })
    .map(([key, group]) => ({ key, items: group }));
}

function humanizeKey(by: InfoListPayload["groupBy"], key: string): string {
  if (by === "state") return key;
  return key;
}
