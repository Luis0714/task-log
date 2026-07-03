import { toLocalDateKey } from "@/lib/dashboard/sprint-days";

const SPANISH_DAY_OF_WEEK: Readonly<Record<string, number>> = Object.freeze({
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
});

const RELATIVE_DAY_OFFSETS: Readonly<Record<string, number>> = Object.freeze({
  anteayer: -2,
  antier: -2,
  ayer: -1,
  hoy: 0,
  manana: 1,
  mañana: 1,
});

const MAX_LOOKAHEAD_FOR_NEXT_WORKING_DAY = 60;

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const SHORT_DATE_REGEX = /^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/;
const DAY_OF_MONTH_REGEX = /^(?:el|día)?\s*(\d{1,2})$/;
const DAY_OF_WEEK_PREFIX_REGEX = /^(?:el|la|los|las)\s+/;

export type ResolveDayInput = {
  text: string;
  startDate: string;
  finishDate: string;
  nonWorkingDates: ReadonlySet<string>;
  now?: Date;
};

export type ResolveDayResult =
  | {
      ok: true;
      workingDate: string;
      workingTime: string;
    }
  | {
      ok: false;
      reason: "invalid_format" | "outside_sprint" | "non_working_day" | "ambiguous";
      suggestion?: string;
    };

export function resolveSprintDay(input: ResolveDayInput): ResolveDayResult {
  const cleanedText = normalizeText(input.text);
  if (!cleanedText) return { ok: false, reason: "invalid_format" };

  const sprintRange = parseDateRange(input.startDate, input.finishDate);
  if (!sprintRange) return { ok: false, reason: "invalid_format" };

  const referenceDate = input.now ?? new Date();

  for (const matcher of MATCHERS) {
    const candidate = matcher(cleanedText, sprintRange, referenceDate);
    if (candidate === "AMBIGUOUS") {
      return { ok: false, reason: "ambiguous" };
    }
    if (candidate) {
      return validateCandidate(candidate, sprintRange, input.nonWorkingDates);
    }
  }

  return { ok: false, reason: "invalid_format" };
}

type DateRange = { start: Date; end: Date };
type MatcherResult = Date | "AMBIGUOUS" | null;
type Matcher = (text: string, range: DateRange, now: Date) => MatcherResult;

const MATCHERS: readonly Matcher[] = [
  matchRelativeDay,
  matchIsoDate,
  matchShortDate,
  matchDayOfMonth,
  matchDayOfWeek,
];

function validateCandidate(
  candidate: Date,
  range: DateRange,
  nonWorking: ReadonlySet<string>,
): ResolveDayResult {
  if (candidate < range.start || candidate > range.end) {
    return { ok: false, reason: "outside_sprint" };
  }

  const workingDate = toLocalDateKey(candidate);
  if (isNonWorkingDayKey(workingDate, nonWorking)) {
    const suggestion = findNextWorkingKey(candidate, range.end, nonWorking);
    return { ok: false, reason: "non_working_day", suggestion };
  }

  return { ok: true, workingDate, workingTime: "09:00" };
}

function matchRelativeDay(text: string, _range: DateRange, now: Date): MatcherResult {
  const offset = RELATIVE_DAY_OFFSETS[text];
  if (offset === undefined) return null;
  const base = stripTime(now);
  base.setDate(base.getDate() + offset);
  return base;
}

function matchIsoDate(text: string): MatcherResult {
  const match = ISO_DATE_REGEX.exec(text);
  if (!match) return null;
  const [, year, month, day] = match;
  return makeLocalDate(Number(year), Number(month), Number(day));
}

function matchShortDate(text: string, range: DateRange): MatcherResult {
  const match = SHORT_DATE_REGEX.exec(text);
  if (!match) return null;
  const [, dayStr, monthStr, yearStr] = match;
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = yearStr ? expandYear(Number(yearStr)) : range.start.getFullYear();
  if (!isValidCalendarDate(year, month, day)) return null;
  return makeLocalDate(year, month, day);
}

function matchDayOfMonth(text: string, range: DateRange): MatcherResult {
  const match = DAY_OF_MONTH_REGEX.exec(text);
  if (!match) return null;
  const day = Number(match[1]);
  if (day < 1 || day > 31) return null;

  const candidates: Date[] = [];
  const cursor = stripTime(range.start);
  cursor.setDate(day);
  while (cursor <= range.end) {
    if (cursor.getDate() === day) candidates.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
    cursor.setDate(day);
  }

  if (candidates.length === 0) return null;
  if (candidates.length > 1) return "AMBIGUOUS";
  return candidates[0];
}

function matchDayOfWeek(text: string, range: DateRange): MatcherResult {
  const cleaned = text.replace(DAY_OF_WEEK_PREFIX_REGEX, "").trim();
  const targetDow = SPANISH_DAY_OF_WEEK[cleaned];
  if (targetDow === undefined) return null;

  const cursor = new Date(range.start);
  while (cursor.getDay() !== targetDow) {
    cursor.setDate(cursor.getDate() + 1);
  }
  return cursor;
}

function normalizeText(raw: string): string {
  return raw.trim().toLowerCase();
}

function parseDateRange(startKey: string, finishKey: string): DateRange | null {
  const start = parseLocalDateKey(startKey);
  const end = parseLocalDateKey(finishKey);
  if (!start || !end) return null;
  return { start, end };
}

function parseLocalDateKey(key: string): Date | null {
  const match = ISO_DATE_REGEX.exec(key);
  if (!match) return null;
  const [, year, month, day] = match;
  return makeLocalDate(Number(year), Number(month), Number(day));
}

function makeLocalDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  return makeLocalDate(year, month, day) !== null;
}

function expandYear(twoOrFourDigitYear: number): number {
  return twoOrFourDigitYear < 100 ? 2000 + twoOrFourDigitYear : twoOrFourDigitYear;
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isNonWorkingDayKey(key: string, set: ReadonlySet<string>): boolean {
  if (set.has(key)) return true;
  const dow = parseLocalDateKey(key)?.getDay();
  return dow === 0 || dow === 6;
}

function findNextWorkingKey(
  from: Date,
  finishDate: Date,
  set: ReadonlySet<string>,
): string | undefined {
  const cursor = new Date(from);
  for (let step = 0; step < MAX_LOOKAHEAD_FOR_NEXT_WORKING_DAY; step += 1) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor > finishDate) return undefined;
    const key = toLocalDateKey(cursor);
    if (!isNonWorkingDayKey(key, set)) return key;
  }
  return undefined;
}