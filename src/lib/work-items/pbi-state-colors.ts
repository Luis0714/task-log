/**
 * Paleta consistente para estados de work items (HU/PBI, Task, Bug).
 * Los tokens CSS viven en globals.css (`--pbi-state-*`) con variantes :root y .dark.
 */

import type { CSSProperties } from "react";

export const PBI_STATE_SLUGS = [
  "new",
  "approved",
  "committed",
  "impediment",
  "reopened",
  "qa",
  "review-po",
  "in-stage",
  "done",
  "unknown",
] as const;

export type PbiStateSlug = (typeof PBI_STATE_SLUGS)[number];

export type PbiStateBadgeStyle = {
  borderColor: string;
  backgroundColor: string;
  color: string;
};

export type PbiStateColorPresentation = {
  slug: PbiStateSlug;
  badgeStyle: PbiStateBadgeStyle;
  dotStyle: Pick<CSSProperties, "backgroundColor">;
  surfaceStyle: Pick<CSSProperties, "borderColor" | "backgroundColor">;
  chartColor: string;
};

function normalizeStateKey(state: string): string {
  return state.trim().toLowerCase().replace(/\s+/g, " ");
}

const STATE_MATCHERS: ReadonlyArray<{ slug: Exclude<PbiStateSlug, "unknown">; test: (n: string) => boolean }> =
  [
    {
      slug: "done",
      test: (n) => ["done", "closed", "completed", "resolved"].includes(n),
    },
    {
      slug: "impediment",
      test: (n) => n.includes("impediment"),
    },
    {
      slug: "reopened",
      test: (n) => n === "reopened" || n.includes("reopened"),
    },
    {
      slug: "review-po",
      test: (n) =>
        n === "review po" ||
        n === "review p.o." ||
        n === "in review" ||
        (n.includes("review") && n.includes("po")),
    },
    {
      slug: "qa",
      test: (n) => n === "qa" || n.startsWith("qa ") || n.includes("quality assurance"),
    },
    {
      slug: "in-stage",
      test: (n) =>
        n === "in stage" ||
        n === "in - stage" ||
        n.includes("in stage") ||
        (n.includes("stage") && !n.includes("impediment")),
    },
    {
      slug: "committed",
      test: (n) => n === "committed" || n === "commited" || n === "in progress" || n === "active",
    },
    {
      slug: "approved",
      test: (n) => n === "approved",
    },
    {
      slug: "new",
      test: (n) =>
        ["new", "proposed", "to do", "todo", "pending", "ready"].includes(n),
    },
  ];

export function resolvePbiStateSlug(state: string): PbiStateSlug {
  const normalized = normalizeStateKey(state);
  if (!normalized) return "unknown";

  for (const { slug, test } of STATE_MATCHERS) {
    if (test(normalized)) return slug;
  }

  return "unknown";
}

function cssVar(slug: PbiStateSlug, token: "bg" | "border" | "text" | "dot" | "chart"): string {
  return `var(--pbi-state-${slug}-${token})`;
}

function buildPresentation(slug: PbiStateSlug): PbiStateColorPresentation {
  const badgeStyle: PbiStateBadgeStyle = {
    borderColor: cssVar(slug, "border"),
    backgroundColor: cssVar(slug, "bg"),
    color: cssVar(slug, "text"),
  };

  return {
    slug,
    badgeStyle,
    dotStyle: { backgroundColor: cssVar(slug, "dot") },
    surfaceStyle: {
      borderColor: cssVar(slug, "border"),
      backgroundColor: cssVar(slug, "bg"),
    },
    chartColor: cssVar(slug, "chart"),
  };
}

const PRESENTATION_CACHE = new Map<PbiStateSlug, PbiStateColorPresentation>(
  PBI_STATE_SLUGS.map((slug) => [slug, buildPresentation(slug)]),
);

/** Fuente única de colores por estado (tags, gráficas, filtros, filas). */
export function getPbiStateColorPresentation(state: string): PbiStateColorPresentation {
  const slug = resolvePbiStateSlug(state);
  return PRESENTATION_CACHE.get(slug) ?? PRESENTATION_CACHE.get("unknown")!;
}

export function getPbiStateChartColor(state: string): string {
  return getPbiStateColorPresentation(state).chartColor;
}

/** Etiqueta legible en español para estados de backlog. */
export const PBI_STATE_LABELS: Record<Exclude<PbiStateSlug, "unknown">, string> = {
  new: "Nuevo",
  approved: "Aprobado",
  committed: "Comprometido",
  impediment: "Impedimento",
  reopened: "Reabierto",
  qa: "QA",
  "review-po": "Revisión PO",
  "in-stage": "En stage",
  done: "Hecho",
};

const GENERIC_STATE_LABELS: Record<string, string> = {
  "to do": "Por hacer",
  "in progress": "En progreso",
  active: "Activo",
  closed: "Cerrado",
  completed: "Completado",
  resolved: "Resuelto",
  removed: "Eliminado",
};

/** Etiqueta en español para mostrar en UI; conserva el valor original si no hay traducción. */
export function formatWorkItemStateLabel(state: string): string {
  const slug = resolvePbiStateSlug(state);
  if (slug !== "unknown") {
    return PBI_STATE_LABELS[slug];
  }
  const normalized = normalizeStateKey(state);
  return GENERIC_STATE_LABELS[normalized] ?? state;
}
