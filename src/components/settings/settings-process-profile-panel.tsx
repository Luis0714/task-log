"use client";

import { Loader2 } from "lucide-react";

import { SettingsConnectionCard } from "@/components/settings/settings-connection-card";
import { SettingsProcessBaseRows } from "@/components/settings/settings-process-base-rows";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSettingsProcessProfile } from "@/hooks/settings/use-settings-process-profile";
import type { SettingsPageData } from "@/lib/settings/load-settings-page-data";
import {
  SETTINGS_PAGE_INTRO,
  SETTINGS_PROCESS_SECTION,
} from "@/lib/settings/settings-field-copy";

export type SettingsProcessProfilePanelProps = {
  data: SettingsPageData;
};

export function SettingsProcessProfilePanel({ data }: Readonly<SettingsProcessProfilePanelProps>) {
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
          <SettingsProcessBaseRows
            workingDateField={workingDateField}
            onWorkingDateFieldChange={setWorkingDateField}
            workingDateFieldSource={profile.workingDateFieldSource}
            options={options}
            timezone={timezone}
            onTimezoneChange={setTimezone}
            disabled={busy !== null}
          />
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
