import { roundHours } from "@/lib/number/rounding";

/** Task reportada por una persona (contrato mínimo — ISP). */
export type ReportedTask = Readonly<{
  hours: number;
  /** HU padre; si está configurada como novedad, las horas son novedad. */
  parentId: number | null;
}>;

/** Bug reportado por una persona (contrato mínimo — ISP). */
export type ReportedBug = Readonly<{
  hours: number;
}>;

export type ClassifiedHours = Readonly<{
  developmentHours: number;
  bugHours: number;
  newsHours: number;
  /** IDs de HU de novedad distintas con trabajo (para cantidad y detalle). */
  newsStoryIds: number[];
}>;

/**
 * Clasifica las horas reportadas de UNA persona en un (proyecto, equipo):
 * las tasks cuya HU padre es novedad suman en novedades; el resto en
 * desarrollo; los bugs van aparte (D22, reglas 6–8).
 */
export function classifyReportedHours(
  tasks: readonly ReportedTask[],
  bugs: readonly ReportedBug[],
  newsStoryIds: ReadonlySet<number>,
): ClassifiedHours {
  let developmentHours = 0;
  let newsHours = 0;
  const workedNewsStoryIds = new Set<number>();

  for (const task of tasks) {
    const isNews = task.parentId !== null && newsStoryIds.has(task.parentId);
    if (isNews) {
      newsHours += task.hours;
      workedNewsStoryIds.add(task.parentId as number);
    } else {
      developmentHours += task.hours;
    }
  }

  const bugHours = bugs.reduce((sum, bug) => sum + bug.hours, 0);

  return {
    developmentHours: roundHours(developmentHours),
    bugHours: roundHours(bugHours),
    newsHours: roundHours(newsHours),
    newsStoryIds: [...workedNewsStoryIds],
  };
}
