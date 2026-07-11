"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type NewsStoriesScopeValue = Readonly<{
  projectId: string;
  teamId: string;
}>;

export type NewsStoriesScopeSelectorProps = Readonly<{
  value: NewsStoriesScopeValue;
  onChange: (next: NewsStoriesScopeValue) => void;
  projects: ReadonlyArray<string>;
  teams: ReadonlyArray<string>;
}>;

const NONE = "__none__";
const PROJECT_PLACEHOLDER = "Selecciona un proyecto";
const TEAM_PLACEHOLDER = "Todos los equipos";

/**
 * Selector de (Proyecto, Equipo) — single-select con `Select` del design
 * system para mantener la consistencia visual con el resto de la app.
 *
 * El equipo es opcional; un valor `""` significa "a nivel proyecto"
 * (HU-02 D19 — la misma HU puede existir en varios (proyecto, equipo)).
 */
export function NewsStoriesScopeSelector({
  value,
  onChange,
  projects,
  teams,
}: NewsStoriesScopeSelectorProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-[calc(50%-0.375rem)] lg:w-[40%]">
        <Label htmlFor="news-scope-project">Proyecto</Label>
        <Select
          value={value.projectId.trim() ? value.projectId : NONE}
          onValueChange={(next) => {
            const safe = next ?? NONE;
            onChange({
              projectId: safe === NONE ? "" : safe,
              teamId: "",
            });
          }}
        >
          <SelectTrigger id="news-scope-project" className="w-full">
            <SelectValue placeholder={PROJECT_PLACEHOLDER} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{PROJECT_PLACEHOLDER}</SelectItem>
            {projects.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-[calc(50%-0.375rem)] lg:w-[40%]">
        <Label htmlFor="news-scope-team">Equipo</Label>
        <Select
          value={value.teamId.trim() ? value.teamId : NONE}
          onValueChange={(next) => {
            const safe = next ?? NONE;
            onChange({
              projectId: value.projectId,
              teamId: safe === NONE ? "" : safe,
            });
          }}
          disabled={!value.projectId}
        >
          <SelectTrigger id="news-scope-team" className="w-full">
            <SelectValue placeholder={TEAM_PLACEHOLDER} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{TEAM_PLACEHOLDER}</SelectItem>
            {teams.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}