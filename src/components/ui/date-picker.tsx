"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { es as esDayPicker } from "react-day-picker/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseLocalDateKey, toLocalDateKey } from "@/lib/dashboard/sprint-days";
import {
  buildDisabledMatcher,
  formatPickerLabel,
} from "@/lib/date/date-picker-format";
import { cn } from "@/lib/utils";

export type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Muestra un botón para limpiar la fecha (campos opcionales). */
  clearable?: boolean;
};

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  disabled = false,
  placeholder = "Selecciona una fecha",
  className,
  clearable = false,
}: Readonly<DatePickerProps>) {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(
    () => (value ? (parseLocalDateKey(value) ?? undefined) : undefined),
    [value],
  );
  const disabledMatcher = useMemo(() => buildDisabledMatcher(min, max), [min, max]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            data-empty={!value}
            className={cn(
              "h-8 w-full justify-between gap-2 px-2.5 font-normal data-[empty=true]:text-muted-foreground",
              className,
            )}
          />
        }
      >
        <span className="truncate text-left">
          {value ? formatPickerLabel(value) : placeholder}
        </span>
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={esDayPicker}
          selected={selectedDate}
          defaultMonth={selectedDate}
          disabled={disabledMatcher}
          onDayClick={(day, modifiers) => {
            if (modifiers.disabled) return;
            onChange(toLocalDateKey(day));
            setOpen(false);
          }}
          onSelect={(date) => {
            if (!date) {
              setOpen(false);
            }
          }}
        />
        {clearable && value ? (
          <div className="border-t p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <X className="size-3.5" aria-hidden />
              Quitar fecha
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
