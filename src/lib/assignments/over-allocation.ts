/**
 * Validación de sobreasignación global de una persona.
 *
 * El porcentaje de dedicación se valida contra TODOS los proyectos del usuario,
 * no solo el actual: la suma del % candidato + los % de sus asignaciones que se
 * cruzan en el tiempo (en cualquier proyecto/equipo) no puede superar el 100%.
 *
 * Módulo puro (sin dependencias de servidor) para poder reutilizarlo en el
 * frontend (validación inmediata) y en el backend (fuente de verdad).
 */

export type AllocationItem = {
  projectName: string;
  teamName?: string | null;
  pct: number;
  fromMs: number;
  toMs: number | null;
};

/** Asignación agrupada por proyecto + equipo. */
export type Allocation = {
  projectName: string;
  teamName: string | null;
  pct: number;
};

/**
 * Fragmento de mensaje. `strong` marca los datos importantes (persona, %,
 * proyecto, equipo) para resaltarlos al renderizar.
 */
export type MessageSegment = { text: string; strong?: boolean };

const OPEN_END_MS = Date.parse("9999-12-31T00:00:00Z");
const GROUP_SEP = "␟";

function overlaps(
  aFrom: number,
  aTo: number | null,
  bFrom: number,
  bTo: number | null,
): boolean {
  const aEnd = aTo ?? OPEN_END_MS;
  const bEnd = bTo ?? OPEN_END_MS;
  return aFrom <= bEnd && bFrom <= aEnd;
}

export function summarizeAllocation(
  items: AllocationItem[],
  candidate: { fromMs: number; toMs: number | null },
): { total: number; groups: Allocation[] } {
  const relevant = items.filter((i) =>
    overlaps(candidate.fromMs, candidate.toMs, i.fromMs, i.toMs),
  );
  const map = new Map<string, Allocation>();
  for (const i of relevant) {
    const teamName = i.teamName ?? null;
    const key = `${i.projectName}${GROUP_SEP}${teamName ?? ""}`;
    const existing = map.get(key);
    if (existing) {
      existing.pct += i.pct;
    } else {
      map.set(key, { projectName: i.projectName, teamName, pct: i.pct });
    }
  }
  const groups = [...map.values()].sort((a, b) => b.pct - a.pct);
  const total = groups.reduce((s, g) => s + g.pct, 0);
  return { total, groups };
}

function pushLocation(
  segs: MessageSegment[],
  a: { projectName: string; teamName: string | null },
): void {
  segs.push({ text: "el proyecto " });
  segs.push({ text: a.projectName, strong: true });
  if (a.teamName) {
    segs.push({ text: " y equipo " });
    segs.push({ text: a.teamName, strong: true });
  }
}

function pushConflicts(segs: MessageSegment[], groups: Allocation[]): void {
  if (groups.length === 0) {
    segs.push({ text: "otro proyecto" });
    return;
  }
  groups.forEach((g, idx) => {
    if (idx > 0) {
      segs.push({ text: idx === groups.length - 1 ? " y " : ", " });
    }
    pushLocation(segs, g);
    if (groups.length > 1) {
      segs.push({ text: " (" });
      segs.push({ text: `${g.pct}%`, strong: true });
      segs.push({ text: ")" });
    }
  });
}

export function buildOverAllocationSegments(input: {
  personDisplayName: string;
  candidatePct: number;
  candidateProjectName?: string;
  candidateTeamName?: string | null;
  total: number;
  available: number;
  groups: Allocation[];
}): MessageSegment[] {
  const who = input.personDisplayName.trim() || "Esta persona";
  const segs: MessageSegment[] = [];

  segs.push({ text: "No puedes asignar a " });
  segs.push({ text: who, strong: true });
  if (input.candidateProjectName) {
    segs.push({ text: " con " });
    segs.push({ text: `${input.candidatePct}%`, strong: true });
    segs.push({ text: " en " });
    pushLocation(segs, {
      projectName: input.candidateProjectName,
      teamName: input.candidateTeamName ?? null,
    });
  }

  if (input.total >= 100) {
    segs.push({ text: ": ya tiene el " });
    segs.push({ text: "100%", strong: true });
    segs.push({ text: " asignado en " });
    pushConflicts(segs, input.groups);
    segs.push({ text: ". Edita esa asignación para liberar porcentaje." });
  } else {
    segs.push({ text: ": ya tiene asignado el " });
    segs.push({ text: `${input.total}%`, strong: true });
    segs.push({ text: " en " });
    pushConflicts(segs, input.groups);
    segs.push({ text: ". Solo puedes asignarle hasta el " });
    segs.push({ text: `${input.available}%`, strong: true });
    segs.push({
      text:
        " aquí; si necesitas más, edita primero la asignación del otro proyecto.",
    });
  }
  return segs;
}

export function segmentsToText(segments: MessageSegment[]): string {
  return segments.map((s) => s.text).join("");
}

export type OverAllocationCheck =
  | { ok: true }
  | {
      ok: false;
      total: number;
      available: number;
      groups: Allocation[];
      message: string;
      segments: MessageSegment[];
    };

/**
 * @param others Asignaciones de la persona en OTROS proyectos (o cualquier
 *   asignación distinta a la que se está editando). No debe incluir la propia.
 */
export function checkOverAllocation(input: {
  personDisplayName: string;
  others: AllocationItem[];
  candidate: {
    fromMs: number;
    toMs: number | null;
    pct: number;
    projectName?: string;
    teamName?: string | null;
  };
}): OverAllocationCheck {
  const { total, groups } = summarizeAllocation(input.others, {
    fromMs: input.candidate.fromMs,
    toMs: input.candidate.toMs,
  });
  if (total + input.candidate.pct <= 100) return { ok: true };
  const available = Math.max(0, 100 - total);
  const segments = buildOverAllocationSegments({
    personDisplayName: input.personDisplayName,
    candidatePct: input.candidate.pct,
    candidateProjectName: input.candidate.projectName,
    candidateTeamName: input.candidate.teamName ?? null,
    total,
    available,
    groups,
  });
  return {
    ok: false,
    total,
    available,
    groups,
    message: segmentsToText(segments),
    segments,
  };
}
