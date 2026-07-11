"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const ARRAY_SEPARATOR = "|";

export type AssignmentsContextSelection = {
  projects: string[];
  teams: string[];
};

export type UseAssignmentsContextUrlOptions = {
  defaultProjects?: readonly string[];
  defaultTeams?: readonly string[];
};

export type UseAssignmentsContextUrl = {
  selection: AssignmentsContextSelection;
  setProjects: (values: string[]) => void;
  setTeams: (values: string[]) => void;
};

function parseArrayParam(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(ARRAY_SEPARATOR)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function serializeArrayParam(values: string[]): string {
  return Array.from(new Set(values)).join(ARRAY_SEPARATOR);
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((value) => set.has(value));
}

export function useAssignmentsContextUrl(
  options: UseAssignmentsContextUrlOptions = {},
): UseAssignmentsContextUrl {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlProjects = useMemo(
    () =>
      parseArrayParam(searchParams.get("projects")).concat(
        parseArrayParam(searchParams.get("project")),
      ),
    [searchParams],
  );
  const urlTeams = useMemo(
    () => parseArrayParam(searchParams.get("teams")),
    [searchParams],
  );

  const projects = useMemo(() => {
    if (urlProjects.length > 0) return Array.from(new Set(urlProjects));
    const fallback = options.defaultProjects ?? [];
    return Array.from(new Set(fallback));
  }, [urlProjects, options.defaultProjects]);

  const teams = useMemo(() => {
    if (urlTeams.length > 0) return Array.from(new Set(urlTeams));
    const fallback = options.defaultTeams ?? [];
    return Array.from(new Set(fallback));
  }, [urlTeams, options.defaultTeams]);

  const pushParam = useCallback(
    (key: string, raw: string) => {
      const current = searchParams.get(key) ?? "";
      if (current === raw) return;
      const params = new URLSearchParams(searchParams.toString());
      if (!raw) {
        params.delete(key);
      } else {
        params.set(key, raw);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const setProjects = useCallback(
    (values: string[]) => {
      const cleaned = Array.from(new Set(values.filter((v) => v.length > 0)));
      // Comparamos contra el estado actual de la URL (incluyendo el alias
      // singular legacy) para no disparar un router.replace cuando el set
      // que llega ya coincide — eso evita refetch de la página server en
      // cada keystroke del filtro de texto.
      const currentUrl = parseArrayParam(searchParams.get("projects")).concat(
        parseArrayParam(searchParams.get("project")),
      );
      if (sameSet(cleaned, currentUrl)) return;
      // Limpia ambos (singular legacy + plural nuevo) para evitar confusiones.
      const params = new URLSearchParams(searchParams.toString());
      params.delete("project");
      params.delete("projects");
      if (cleaned.length === 0) {
        params.delete("projects");
      } else {
        params.set("projects", serializeArrayParam(cleaned));
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const setTeams = useCallback(
    (values: string[]) => {
      const cleaned = Array.from(new Set(values));
      const current = parseArrayParam(searchParams.get("teams"));
      if (sameSet(cleaned, current)) return;
      pushParam("teams", serializeArrayParam(cleaned));
    },
    [pushParam, searchParams],
  );

  return {
    selection: { projects, teams },
    setProjects,
    setTeams,
  };
}
