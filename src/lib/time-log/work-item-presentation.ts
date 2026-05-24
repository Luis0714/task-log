import type { VariantProps } from "class-variance-authority";

import { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export type WorkItemPresentation = {
  variant: BadgeVariant;
  className?: string;
};

export function getWorkItemStatePresentation(state: string): WorkItemPresentation {
  const normalized = state.trim().toLowerCase();

  if (["done", "closed", "completed", "resolved"].includes(normalized)) {
    return {
      variant: "secondary",
      className:
        "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    };
  }

  if (
    ["active", "in progress", "committed", "doing", "approved", "in review"].includes(
      normalized,
    ) ||
    normalized.includes("stage")
  ) {
    return {
      variant: "default",
      className: "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-300",
    };
  }

  if (["new", "proposed", "to do", "todo", "pending", "ready"].includes(normalized)) {
    return {
      variant: "outline",
      className: "text-muted-foreground",
    };
  }

  return { variant: "outline" };
}

export function formatWorkItemTypeShortLabel(type: string): string {
  const normalized = type.trim().toLowerCase();

  if (normalized.includes("product backlog") || normalized === "pbi") {
    return "PBI";
  }
  if (normalized.includes("user story") || normalized.includes("historia")) {
    return "Story";
  }
  if (normalized.includes("bug")) {
    return "Bug";
  }
  if (normalized.includes("task") || normalized.includes("tarea")) {
    return "Task";
  }
  if (normalized.includes("feature")) {
    return "Feature";
  }
  if (normalized.includes("epic")) {
    return "Epic";
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
