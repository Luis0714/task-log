import type { ColombianHoliday } from "@/lib/holidays/co";

export type WorkingDayDecision =
  | "habil_con_observacion"
  | "no_habil";

export type RangeDayReason =
  | "holiday"
  | "weekend"
  | "decision_overridden_working"
  | "decision_overridden_off"
  | "default";

export type RangeDayDecision =
  | { decision: WorkingDayDecision; observation: string | null }
  | null;

export type RangeDay = {
  date: string;
  isWorkingByDefault: boolean;
  reasonByDefault: RangeDayReason;
  holidayName: string | null;
  override: RangeDayDecision;
  isWorking: boolean;
  reason: RangeDayReason;
  observation: string | null;
};

export type WorkingDayDecisionRow = {
  date: string;
  decision: WorkingDayDecision;
  observation: string | null;
};

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function addDays(iso: string, delta: number): string {
  const m = ISO_DATE_RE.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  const dt = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  dt.setUTCDate(dt.getUTCDate() + delta);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function isWeekend(iso: string): boolean {
  const m = ISO_DATE_RE.exec(iso);
  if (!m) return false;
  const dt = new Date(
    Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])),
  );
  const day = dt.getUTCDay();
  return day === 0 || day === 6;
}

export type BuildRangeDaysOptions = {
  fromIso: string;
  toIso: string;
  holidays: ColombianHoliday[];
  overrides: WorkingDayDecisionRow[];
};

/**
 * Por defecto, los fines de semana y los festivos de Colombia son no
 * hábiles. Los días entre semana sin festivo son hábiles. El usuario
 * puede registrar un override por fecha (e.g., "se laboró este sábado
 * por X motivo") con su observación.
 */
export function buildRangeDays(opts: BuildRangeDaysOptions): RangeDay[] {
  const { fromIso, toIso, holidays, overrides } = opts;
  if (!ISO_DATE_RE.test(fromIso) || !ISO_DATE_RE.test(toIso)) return [];
  if (toIso < fromIso) return [];

  const holidayByDate = new Map(holidays.map((h) => [h.date, h.name] as const));
  const overridesByDate = new Map(overrides.map((o) => [o.date, o] as const));

  const days: RangeDay[] = [];
  let cursor = fromIso;
  let safety = 0;
  while (cursor <= toIso && safety < 4000) {
    safety++;
    const holidayName = holidayByDate.get(cursor) ?? null;
    const weekend = isWeekend(cursor);
    const override = overridesByDate.get(cursor) ?? null;

    let isWorkingByDefault: boolean;
    let reasonByDefault: RangeDayReason;
    if (holidayName) {
      isWorkingByDefault = false;
      reasonByDefault = "holiday";
    } else if (weekend) {
      isWorkingByDefault = false;
      reasonByDefault = "weekend";
    } else {
      isWorkingByDefault = true;
      reasonByDefault = "default";
    }

    let isWorking = isWorkingByDefault;
    let reason: RangeDayReason = reasonByDefault;
    let observation: string | null = null;
    if (override) {
      observation = override.observation;
      if (override.decision === "habil_con_observacion") {
        isWorking = true;
        reason = "decision_overridden_working";
      } else {
        isWorking = false;
        reason = "decision_overridden_off";
      }
    }

    days.push({
      date: cursor,
      isWorkingByDefault,
      reasonByDefault,
      holidayName,
      override: override
        ? {
            decision: override.decision,
            observation: override.observation,
          }
        : null,
      isWorking,
      reason,
      observation,
    });

    cursor = addDays(cursor, 1);
  }
  return days;
}

export function summarizeRangeDays(days: RangeDay[]): {
  working: number;
  notWorking: number;
  overrides: number;
} {
  let working = 0;
  let notWorking = 0;
  let overrides = 0;
  for (const d of days) {
    if (d.isWorking) working += 1;
    else notWorking += 1;
    if (d.override !== null) overrides += 1;
  }
  return { working, notWorking, overrides };
}
