"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { es as esDayPicker } from "react-day-picker/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseLocalDateKey, toLocalDateKey } from "@/lib/dashboard/sprint-days";
import {
  buildDisabledMatcher,
  formatPickerLabel,
} from "@/lib/date/date-picker-format";
import { cn } from "@/lib/utils";

export type DatePickerTimeProps = {
  dateId?: string;
  timeId?: string;
  /** Fecha civil YYYY-MM-DD. */
  dateValue: string;
  /** Hora HH:mm (24 h). */
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  datePlaceholder?: string;
  className?: string;
};

function normalizeTimeInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = /^(\d{2}:\d{2})/.exec(trimmed);
  return match?.[1] ?? trimmed;
}

export function DatePickerTime({
  dateId,
  timeId,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  min,
  max,
  disabled = false,
  datePlaceholder = "Selecciona fecha",
  className,
}: Readonly<DatePickerTimeProps>) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = React.useMemo(
    () => (dateValue ? (parseLocalDateKey(dateValue) ?? undefined) : undefined),
    [dateValue],
  );
  const disabledMatcher = React.useMemo(() => buildDisabledMatcher(min, max), [min, max]);

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end", className)}>
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor={dateId} className="text-muted-foreground text-xs font-normal">
          Fecha
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            id={dateId}
            disabled={disabled}
            render={
              <Button
                type="button"
                variant="outline"
                data-empty={!dateValue}
                className="h-8 w-full justify-between gap-2 px-2.5 font-normal data-[empty=true]:text-muted-foreground"
              />
            }
          >
            <span className="truncate text-left">
              {dateValue ? formatPickerLabel(dateValue) : datePlaceholder}
            </span>
            <ChevronDownIcon className="size-4 shrink-0 opacity-70" data-icon="inline-end" />
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              locale={esDayPicker}
              selected={selectedDate}
              captionLayout="dropdown"
              defaultMonth={selectedDate}
              disabled={disabledMatcher}
              onDayClick={(day, modifiers) => {
                if (modifiers.disabled) return;
                onDateChange(toLocalDateKey(day));
                setOpen(false);
              }}
              onSelect={(date) => {
                if (!date) setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="w-full space-y-2 sm:w-32 sm:shrink-0">
        <Label htmlFor={timeId} className="text-muted-foreground text-xs font-normal">
          Hora
        </Label>
        <Input
          type="time"
          id={timeId}
          value={timeValue}
          disabled={disabled}
          step={60}
          onChange={(event) => onTimeChange(normalizeTimeInput(event.target.value))}
          className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}
