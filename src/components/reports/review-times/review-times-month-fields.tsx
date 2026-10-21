"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
  joinMonthKey,
  REVIEW_MONTHS,
  reviewYearOptions,
  splitMonthKey,
} from "@/lib/review-times/month";

export function ReviewTimesMonthFields({
  monthKey,
  onMonthKeyChange,
}: Readonly<{ monthKey: string; onMonthKeyChange: (monthKey: string) => void }>) {
  const { year, month } = splitMonthKey(monthKey);
  const years = reviewYearOptions(Number(year) || new Date().getFullYear());
  const monthLabel = REVIEW_MONTHS.find((item) => item.value === month)?.label ?? month;

  return (
    <div className="flex min-w-0 flex-1 gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Label>Año</Label>
        <Select value={year} onValueChange={(next) => next && onMonthKeyChange(joinMonthKey(next, month))}>
          <SelectTrigger>
            <span>{year}</span>
          </SelectTrigger>
          <SelectContent>
            {years.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Label>Mes</Label>
        <Select value={month} onValueChange={(next) => next && onMonthKeyChange(joinMonthKey(year, next))}>
          <SelectTrigger>
            <span>{monthLabel}</span>
          </SelectTrigger>
          <SelectContent>
            {REVIEW_MONTHS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
