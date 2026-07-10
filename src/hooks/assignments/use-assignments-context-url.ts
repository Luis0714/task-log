"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type AssignmentsContextSelection = {
  project: string;
  team: string;
  month: string;
};

export type UseAssignmentsContextUrlOptions = {
  /** Fallback cuando la URL está vacía (típicamente el project/team por defecto de la sesión). */
  defaultProject?: string | null;
  defaultTeam?: string | null;
};

export type UseAssignmentsContextUrl = {
  selection: AssignmentsContextSelection;
  setProject: (value: string) => void;
  setTeam: (value: string) => void;
  setMonth: (value: string) => void;
};

function isMonthKey(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value);
}

function defaultMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function normalize(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function useAssignmentsContextUrl(
  options: UseAssignmentsContextUrlOptions = {},
): UseAssignmentsContextUrl {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlProject = normalize(searchParams.get("project"));
  const urlTeam = normalize(searchParams.get("team"));
  const monthRaw = normalize(searchParams.get("month"));
  const month = isMonthKey(monthRaw) ? monthRaw : defaultMonthKey();

  const project = urlProject || normalize(options.defaultProject);
  const team = urlTeam || normalize(options.defaultTeam);

  const pushParam = useCallback(
    (key: "project" | "team" | "month", value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const setProject = useCallback(
    (value: string) => {
      pushParam("project", value);
      pushParam("team", "");
    },
    [pushParam],
  );

  const setTeam = useCallback(
    (value: string) => pushParam("team", value),
    [pushParam],
  );

  const setMonth = useCallback(
    (value: string) => pushParam("month", value),
    [pushParam],
  );

  return { selection: { project, team, month }, setProject, setTeam, setMonth };
}
