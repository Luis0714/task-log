"use client";

import { MultiCheckboxFilter } from "@/components/filters/multi-checkbox-filter";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
  joinMonthKey,
  MAX_REVIEW_MONTHS,
  REVIEW_MONTHS,
  reviewYearOptions,
  splitMonthKey,
} from "@/lib/review-times/month";
import { selectionTriggerLabel } from "@/lib/review-times/person-options";

export function ReviewTimesMonthFields({
  monthKeys,
  onMonthKeysChange,
}: Readonly<{
  monthKeys: readonly string[];
  onMonthKeysChange: (monthKeys: string[]) => void;
}>) {
  const year = splitMonthKey(monthKeys[0] ?? "").year || String(new Date().getFullYear());
  const years = reviewYearOptions(Number(year) || new Date().getFullYear());
  const selectedMonths = monthKeys
    .filter((key) => splitMonthKey(key).year === year)
    .map((key) => splitMonthKey(key).month);
  const monthOptions = REVIEW_MONTHS.map((month) => ({
    value: month.value,
    label: month.label,
  }));

  const changeYear = (nextYear: string) => {
    onMonthKeysChange(
      selectedMonths
        .map((month) => joinMonthKey(nextYear, month))
        .sort((left, right) => left.localeCompare(right)),
    );
  };

  const changeMonths = (months: string[]) => {
    if (months.length === 0 || months.length > MAX_REVIEW_MONTHS) return;
    onMonthKeysChange(
      months
        .map((month) => joinMonthKey(year, month))
        .sort((left, right) => left.localeCompare(right)),
    );
  };

  return (
    <div className="flex min-w-0 flex-1 gap-3">
      <div className="flex w-28 shrink-0 flex-col gap-1.5">
        <Label>Año</Label>
        <Select value={year} onValueChange={(next) => next && changeYear(next)}>
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
      <div className="min-w-0 flex-1">
        <MultiCheckboxFilter
          id="review-times-months"
          label="Meses"
          options={monthOptions}
          selected={selectedMonths}
          onSelectedChange={changeMonths}
          triggerLabel={selectionTriggerLabel(selectedMonths, monthOptions, "Mes", "meses")}
          isOptionDisabled={() => selectedMonths.length >= MAX_REVIEW_MONTHS}
        />
      </div>
    </div>
  );
}
