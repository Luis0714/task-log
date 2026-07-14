import type { CSSProperties } from "react";
import type { VariantProps } from "class-variance-authority";

import type { badgeVariants } from "@/components/ui/badge";

export type WorkItemPresentation = {
  variant: BadgeVariant;
  className?: string;
  surfaceStyle?: Pick<CSSProperties, "borderColor" | "backgroundColor">;
};

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

/**
 * Devuelve siempre la variant outline; el color real del estado se aplica en
 * runtime vía `usePbiStateColors` + `WorkItemStateBadge`. Aquí solo dejamos
 * la variant neutral para mantener compatibilidad con consumidores que no
 * tienen acceso al catálogo de Azure.
 */
export function getWorkItemStatePresentation(_state: string): WorkItemPresentation {
  return {
    variant: "outline",
  };
}

type WorkItemTypeRule = {
  matches: (normalizedType: string) => boolean;
  initials: string;
  shortLabel: string;
};

const WORK_ITEM_TYPE_RULES: ReadonlyArray<WorkItemTypeRule> = [
  {
    matches: (type) =>
      type.includes("product backlog") ||
      type === "pbi" ||
      type.includes("user story") ||
      type.includes("historia"),
    initials: "HU",
    shortLabel: "Historia",
  },
  { matches: (type) => type.includes("bug"), initials: "BG", shortLabel: "Bug" },
  {
    matches: (type) => type.includes("task") || type.includes("tarea"),
    initials: "TK",
    shortLabel: "Tarea",
  },
  {
    matches: (type) => type.includes("feature"),
    initials: "FT",
    shortLabel: "Característica",
  },
  { matches: (type) => type.includes("epic"), initials: "EP", shortLabel: "Épica" },
];

function findWorkItemTypeRule(type: string): WorkItemTypeRule | undefined {
  const normalized = type.trim().toLowerCase();
  return WORK_ITEM_TYPE_RULES.find((rule) => rule.matches(normalized));
}

export function formatWorkItemTypeAvatarInitials(type: string): string {
  const rule = findWorkItemTypeRule(type);
  if (rule) return rule.initials;

  const words = type.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
  }

  return type.slice(0, 2).toUpperCase();
}

export function formatWorkItemTypeShortLabel(type: string): string {
  const rule = findWorkItemTypeRule(type);
  if (rule) return rule.shortLabel;

  const words = type.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].length <= 8 ? words[0] : `${words[0].slice(0, 8)}…`;
  }

  return words
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
}

export function getWorkItemTypePresentation(type: string): WorkItemPresentation {
  const normalized = type.trim().toLowerCase();

  if (normalized.includes("bug")) {
    return {
      variant: "destructive",
      className: "border-destructive/25 bg-destructive/10 text-destructive",
    };
  }

  if (
    normalized.includes("product backlog") ||
    normalized === "pbi" ||
    normalized.includes("story") ||
    normalized.includes("historia")
  ) {
    return {
      variant: "secondary",
      className:
        "border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/15 dark:text-primary-foreground/90",
    };
  }

  if (normalized.includes("task") || normalized.includes("tarea")) {
    return {
      variant: "outline",
      className:
        "border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-300",
    };
  }

  if (normalized.includes("feature") || normalized.includes("epic")) {
    return {
      variant: "outline",
      className: "border-primary/20 bg-primary/5 text-foreground",
    };
  }

  return { variant: "outline" };
}