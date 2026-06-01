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

export type PbiStateExportBadgeStyle = PbiStateBadgeStyle & {
  dotColor: string;
};

/**
 * Equivalentes hex del tema claro (`:root` en globals.css) para exportación
 * (OG image, PDF) donde no aplican variables CSS.
 */
const PBI_STATE_EXPORT_BADGE_STYLES: Record<PbiStateSlug, PbiStateExportBadgeStyle> = {
  new: {
    borderColor: "#c5c9d4",
    backgroundColor: "#f2f3f6",
    color: "#525868",
    dotColor: "#828899",
  },
  approved: {
    borderColor: "#d4d4d4",
    backgroundColor: "#fafafa",
    color: "#404040",
    dotColor: "#a3a3a3",
  },
  committed: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
    color: "#1e40af",
    dotColor: "#2563eb",
  },
  impediment: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    dotColor: "#dc2626",
  },
  reopened: {
    borderColor: "#f59e0b",
    backgroundColor: "#fffbeb",
    color: "#92400e",
    dotColor: "#d97706",
  },
  qa: {
    borderColor: "#ca8a04",
    backgroundColor: "#fefce8",
    color: "#854d0e",
    dotColor: "#eab308",
  },
  "review-po": {
    borderColor: "#db2777",
    backgroundColor: "#fdf2f8",
    color: "#9d174d",
    dotColor: "#ec4899",
  },
  "in-stage": {
    borderColor: "#0891b2",
    backgroundColor: "#ecfeff",
    color: "#155e75",
    dotColor: "#06b6d4",
  },
  done: {
    borderColor: "#16a34a",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    dotColor: "#22c55e",
  },
  unknown: {
    borderColor: "#d4d4d4",
    backgroundColor: "#f5f5f5",
    color: "#737373",
    dotColor: "#a3a3a3",
  },
};

export function isPbiStateBadgeRenderable(state: string): boolean {
  const trimmed = state.trim();
  return Boolean(trimmed && trimmed !== "—");
}

/** Estilos de badge con colores sólidos para imagen/PDF. */
export function getPbiStateExportBadgeStyle(state: string): PbiStateExportBadgeStyle {
  const slug = resolvePbiStateSlug(state);
  return PBI_STATE_EXPORT_BADGE_STYLES[slug];
}
