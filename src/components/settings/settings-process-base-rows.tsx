"use client";

import { useMemo } from "react";

import { SettingsFieldRow } from "@/components/settings/settings-field-row";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdoProcessProfileFieldSource } from "@/lib/azure-devops/process-profile-types";
import {
  TIMEZONE_FIELD_COPY,
  WORKING_DATE_FIELD_COPY,
} from "@/lib/settings/settings-field-copy";

type DateFieldOption = { referenceName: string; label: string };

export type SettingsProcessBaseRowsProps = Readonly<{
  workingDateField: string;
  onWorkingDateFieldChange: (value: string) => void;
  workingDateFieldSource?: AdoProcessProfileFieldSource;
  options: readonly DateFieldOption[];
  timezone: string;
  onTimezoneChange: (value: string) => void;
  disabled: boolean;
}>;

/**
 * Filas "Campo de fecha de trabajo" y "Zona horaria", compartidas entre el
 * panel de perfil de proceso y el panel admin.
 */
export function SettingsProcessBaseRows({
  workingDateField,
  onWorkingDateFieldChange,
  workingDateFieldSource,
  options,
  timezone,
  onTimezoneChange,
  disabled,
}: SettingsProcessBaseRowsProps) {
  const dateFieldOptions = useMemo(() => {
    if (options.some((option) => option.referenceName === workingDateField)) {
      return options;
    }
    return [{ referenceName: workingDateField, label: workingDateField }, ...options];
  }, [options, workingDateField]);

  const selectedOption = dateFieldOptions.find(
    (option) => option.referenceName === workingDateField,
  );

  return (
    <>
      <SettingsFieldRow
        copy={WORKING_DATE_FIELD_COPY}
        source={workingDateFieldSource}
        referenceName={workingDateField}
      >
        <Select
          value={workingDateField || null}
          onValueChange={(value) => {
            if (value) onWorkingDateFieldChange(value);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Elige un campo de fecha">
              {selectedOption?.label ?? workingDateField}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {dateFieldOptions.map((option) => (
              <SelectItem key={option.referenceName} value={option.referenceName}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsFieldRow>

      <SettingsFieldRow copy={TIMEZONE_FIELD_COPY}>
        <Input
          value={timezone}
          onChange={(event) => onTimezoneChange(event.target.value)}
          placeholder="America/Bogota"
          disabled={disabled}
          spellCheck={false}
        />
      </SettingsFieldRow>
    </>
  );
}
