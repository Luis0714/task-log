import type { CSSProperties } from "react";
import type { VariantProps } from "class-variance-authority";

import type { badgeVariants } from "@/components/ui/badge";
import { getPbiStateColorPresentation } from "@/lib/work-items/pbi-state-colors";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export type WorkItemPresentation = {
  variant: BadgeVariant;
  className?: string;
  surfaceStyle?: Pick<CSSProperties, "borderColor" | "backgroundColor">;
};

export function getWorkItemStatePresentation(state: string): WorkItemPresentation {
  const colors = getPbiStateColorPresentation(state);

  return {
    variant: "outline",
    surfaceStyle: colors.surfaceStyle,
  };
}

export function formatWorkItemTypeAvatarInitials(type: string): string {
  const normalized = type.trim().toLowerCase();

  if (normalized.includes("product backlog") || normalized === "pbi") {
    return "HU";
  }
  if (normalized.includes("user story") || normalized.includes("historia")) {
    return "HU";
  }
  if (normalized.includes("bug")) {
    return "BG";
  }
  if (normalized.includes("task") || normalized.includes("tarea")) {
    return "TK";
  }
  if (normalized.includes("feature")) {
    return "FT";
  }
  if (normalized.includes("epic")) {
    return "EP";
  }

  const words = type.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
  }

  return type.slice(0, 2).toUpperCase();
}

export function formatWorkItemTypeShortLabel(type: string): string {
  const normalized = type.trim().toLowerCase();

  if (normalized.includes("product backlog") || normalized === "pbi") {
    return "Historia";
  }
  if (normalized.includes("user story") || normalized.includes("historia")) {
    return "Historia";
  }
  if (normalized.includes("bug")) {
    return "Bug";
  }
  if (normalized.includes("task") || normalized.includes("tarea")) {
    return "Tarea";
  }
  if (normalized.includes("feature")) {
    return "Característica";
  }
  if (normalized.includes("epic")) {
    return "Épica";
  }

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
