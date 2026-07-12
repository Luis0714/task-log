import "server-only";

import { NextResponse } from "next/server";

import { fetchUserStoriesByIds } from "@/lib/azure-devops/fetch-user-stories-by-ids";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { requireManagementUser } from "@/app/api/assignments/helpers";
import { getRepositories } from "@/lib/db";
import type {
  NewsStoriesValidationResponse,
  NewsStoryValidationEntry,
  NewsStoryValidationStatus,
} from "@/lib/news-stories/types";

export const dynamic = "force-dynamic";

/**
 * Compara las HUs vinculadas en BD con su estado actual en Azure DevOps.
 *
 * Por cada HU:
 * - `active` → existe y el título no cambió.
 * - `renamed` → existe pero el título actual difiere del snapshot.
 * - `deleted` → Azure no la devolvió (probablemente eliminada).
 *
 * Si Azure no responde, devuelve un 502 con mensaje claro; nunca expone
 * datos parciales sin aviso (FE-04 de HU-02).
 */
export async function GET(req: Request) {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const projectsRaw = url.searchParams.get("projects") ?? "";
  const teamsRaw = url.searchParams.get("teams") ?? "";
  const filter = {
    projectIds: projectsRaw
      ? projectsRaw.split(",").map((p) => p.trim()).filter(Boolean)
      : undefined,
    teamIds: teamsRaw
      ? teamsRaw.split(",").map((p) => p.trim()).filter(Boolean)
      : undefined,
  };
  if (!filter.projectIds || filter.projectIds.length === 0) {
    return NextResponse.json(
      { error: "Falta al menos un proyecto a validar." },
      { status: 400 },
    );
  }

  const linked = await getRepositories().newsStories.list(filter);
  if (linked.length === 0) {
    return NextResponse.json<NewsStoriesValidationResponse>({ entries: [] });
  }

  const adoCaller = await resolveAdoCaller();
  if (!adoCaller) {
    return NextResponse.json(
      {
        error:
          "No se pudo conectar con Azure DevOps para validar las HUs. Reintenta en unos minutos.",
      },
      { status: 502 },
    );
  }

  let snapshots;
  try {
    snapshots = await fetchUserStoriesByIds(
      adoCaller,
      linked.map((row) => row.workItemId),
    );
  } catch {
    return NextResponse.json(
      { error: "Azure DevOps no respondió la validación." },
      { status: 502 },
    );
  }

  const snapshotById = new Map(snapshots.map((s) => [s.id, s]));
  const entries: NewsStoryValidationEntry[] = linked.map((row) => {
    const snapshot = snapshotById.get(row.workItemId);
    if (!snapshot) {
      return {
        id: row.id,
        workItemId: row.workItemId,
        status: "deleted",
        snapshotTitle: row.workItemTitleSnapshot,
        currentTitle: null,
        currentState: null,
      };
    }
    const snapshotTitle = row.workItemTitleSnapshot?.trim() ?? "";
    const status: NewsStoryValidationStatus =
      snapshotTitle && snapshotTitle !== snapshot.title ? "renamed" : "active";
    return {
      id: row.id,
      workItemId: row.workItemId,
      status,
      snapshotTitle: row.workItemTitleSnapshot,
      currentTitle: snapshot.title,
      currentState: snapshot.state,
    };
  });

  return NextResponse.json<NewsStoriesValidationResponse>({ entries });
}