"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";

import { SettingsConnectionCard } from "@/components/settings/settings-connection-card";
import { SettingsFieldRow } from "@/components/settings/settings-field-row";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsProcessProfile } from "@/hooks/settings/use-settings-process-profile";
import type { SettingsPageData } from "@/lib/settings/load-settings-page-data";
import {
  SETTINGS_PAGE_INTRO,
  SETTINGS_PROCESS_SECTION,
  TIMEZONE_FIELD_COPY,
  WORKING_DATE_FIELD_COPY,
} from "@/lib/settings/settings-field-copy";

export type SettingsProcessProfilePanelProps = {
  data: SettingsPageData;
};

export function SettingsProcessProfilePanel({ data }: SettingsProcessProfilePanelProps) {
  const {
    profile,
    options,
    workingDateField,
    setWorkingDateField,
    timezone,
    setTimezone,
    busy,
    isDirty,
    save,
    rediscover,
    testConfiguration,
  } = useSettingsProcessProfile({
    project: data.connection.project,
    initialProfile: data.profile,
    initialOptions: data.taskDateFieldOptions,
  });

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
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <p className="text-muted-foreground text-sm leading-relaxed">{SETTINGS_PAGE_INTRO}</p>

      <SettingsConnectionCard connection={data.connection} />

      <Card>
        <CardHeader>
          <CardTitle>{SETTINGS_PROCESS_SECTION.title}</CardTitle>
          <CardDescription>{SETTINGS_PROCESS_SECTION.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsFieldRow
            copy={WORKING_DATE_FIELD_COPY}
            source={profile.workingDateFieldSource}
            referenceName={workingDateField}
          >
            <Select
              value={workingDateField || null}
              onValueChange={(value) => {
                if (value) setWorkingDateField(value);
              }}
              disabled={busy !== null}
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
              onChange={(event) => setTimezone(event.target.value)}
              placeholder="America/Bogota"
              disabled={busy !== null}
              spellCheck={false}
            />
          </SettingsFieldRow>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 border-t">
          <Button type="button" onClick={() => void save()} disabled={busy !== null || !isDirty}>
            {busy === "save" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Guardar preferencias
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void rediscover()}
            disabled={busy !== null}
          >
            {busy === "rediscover" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Actualizar desde Azure DevOps
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void testConfiguration()}
            disabled={busy !== null}
          >
            {busy === "test" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Probar configuración
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
