"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export type ReportsTimeLogExportRolesFilterProps = {
  roles: ReadonlyArray<string>;
  selected: string | undefined;
  onChange: (value: string | undefined) => void;
};

export function ReportsTimeLogExportRolesFilter({
  roles,
  selected,
  onChange,
}: Readonly<ReportsTimeLogExportRolesFilterProps>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="export-role">Rol</Label>
      <Select value={selected ?? "__all__"} onValueChange={(v) => onChange(v === "__all__" ? undefined : (v ?? undefined))}>
        <SelectTrigger id="export-role" className="w-full">
          <span>{selected ?? "Todos"}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todos</SelectItem>
          {roles.map((r) => (
            <SelectItem key={r} value={r}>{r}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}