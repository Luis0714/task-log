import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Matcher } from "react-day-picker";

import { parseLocalDateKey } from "@/lib/dashboard/sprint-days";

export function formatPickerLabel(dateKey: string): string {
  const date = parseLocalDateKey(dateKey);
  if (!date) return dateKey;
  return format(date, "PPP", { locale: es });
}

export function buildDisabledMatcher(min?: string, max?: string): Matcher | undefined {
  const minDate = min ? (parseLocalDateKey(min) ?? undefined) : undefined;
  const maxDate = max ? (parseLocalDateKey(max) ?? undefined) : undefined;
  if (minDate && maxDate) return { before: minDate, after: maxDate };
  if (minDate) return { before: minDate };
  if (maxDate) return { after: maxDate };
  return undefined;
}
