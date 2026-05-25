/**
 * Paleta consistente para estados de Historias de Usuario (PBI/Story).
 * Los tokens CSS viven en globals.css (`--pbi-state-*`) con variantes :root y .dark.
 */

export const PBI_STATE_SLUGS = [
  "new",
  "approved",
  "committed",
  "impediment",
  "qa",
  "review-po",
  "in-stage",
  "done",
  "unknown",
] as const;

export type PbiStateSlug = (typeof PBI_STATE_SLUGS)[number];

export type PbiStateColorPresentation = {
  slug: PbiStateSlug;
  /** Clases para badge / pill */
  className: string;
  dotClassName: string;
  /** Fondo suave para filas o tarjetas */
  surfaceClassName: string;
  /** Color de relleno en gráficas (Recharts, leyendas) */
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
  return {
    slug,
    className: `border-[color:var(--pbi-state-${slug}-border)] bg-[color:var(--pbi-state-${slug}-bg)] text-[color:var(--pbi-state-${slug}-text)]`,
    dotClassName: `bg-[color:var(--pbi-state-${slug}-dot)]`,
    surfaceClassName: `border-[color:var(--pbi-state-${slug}-border)] bg-[color:var(--pbi-state-${slug}-bg)]`,
    chartColor: cssVar(slug, "chart"),
  };
}

const PRESENTATION_CACHE = new Map<PbiStateSlug, PbiStateColorPresentation>(
  PBI_STATE_SLUGS.map((slug) => [slug, buildPresentation(slug)]),
);

export function getPbiStateColorPresentation(state: string): PbiStateColorPresentation {
  const slug = resolvePbiStateSlug(state);
  return PRESENTATION_CACHE.get(slug) ?? PRESENTATION_CACHE.get("unknown")!;
}

export function getPbiStateChartColor(state: string): string {
  return getPbiStateColorPresentation(state).chartColor;
}

/** Etiqueta legible para leyendas (opcional). */
export const PBI_STATE_LABELS: Record<Exclude<PbiStateSlug, "unknown">, string> = {
  new: "New",
  approved: "Approved",
  committed: "Committed",
  impediment: "Impediment",
  qa: "QA",
  "review-po": "Review PO",
  "in-stage": "In stage",
  done: "Done",
};
