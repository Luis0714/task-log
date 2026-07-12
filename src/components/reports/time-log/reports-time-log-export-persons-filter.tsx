"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export type ReportsTimeLogExportPersonsFilterProps = {
  persons: ReadonlyArray<string>;
  selected: string | undefined;
  onChange: (value: string | undefined) => void;
};

export function ReportsTimeLogExportPersonsFilter({
  persons,
  selected,
  onChange,
}: Readonly<ReportsTimeLogExportPersonsFilterProps>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="export-person">Persona</Label>
      <Select value={selected ?? "__all__"} onValueChange={(v) => onChange(v === "__all__" ? undefined : (v ?? undefined))}>
        <SelectTrigger id="export-person" className="w-full">
          <span>{selected ?? "Todas"}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todas</SelectItem>
          {persons.map((p) => (
            <SelectItem key={p} value={p}>{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}