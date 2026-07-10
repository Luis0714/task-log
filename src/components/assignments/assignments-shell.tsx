"use client";

import { useMemo, useState } from "react";

import { AdoFiltersCollapsible } from "@/components/filters/ado-filters-collapsible";
import { AdoContextTeamDefaultHint } from "@/components/filters/ado-context-team-default-hint";
import { AssignmentsContextFields } from "@/components/assignments/assignments-context-fields";
import { AssignmentChangeDialog } from "@/components/assignments/assignment-change-dialog";
import { AssignmentCloseDialog } from "@/components/assignments/assignment-close-dialog";
import { AssignmentFormDialog } from "@/components/assignments/assignment-form-dialog";
import { AssignmentsFilters } from "@/components/assignments/assignments-filters";
import type { AssignmentsFiltersValue } from "@/components/assignments/assignments-filters";
import { AssignmentsTable } from "@/components/assignments/assignments-table";
import {
  useAssignments,
  type AssignmentRow,
} from "@/hooks/assignments/use-assignments";
import { useAssignmentsContextUrl } from "@/hooks/assignments/use-assignments-context-url";
import { useSaveAdoContextDefaults } from "@/hooks/filters/use-save-ado-context-defaults";
import type { AssignmentDto } from "@/lib/assignments/build-assignment-row";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { buildAdoFiltersSummary } from "@/lib/filters/summary";
import type {
  AssignmentDefaultContext,
  AssignmentRoleOption,
  ChangeAssignmentPayload,
  CloseAssignmentPayload,
  CreateAssignmentPayload,
} from "@/services/assignments/assignments.service";
import {
  listTeamMembersByProjectAndTeam,
} from "@/services/assignments/assignments.service";

export type AssignmentsShellProps = Readonly<{
  initialAssignments: AssignmentDto[];
  roles: AssignmentRoleOption[];
  catalog: AdoCatalogSnapshot;
}>;

const PLACEHOLDER_ASSIGNMENT: AssignmentRow = {
  id: "",
  personAdoId: "",
  personDisplayName: "",
  projectId: "",
  projectName: "",
  teamId: null,
  teamName: null,
  roleId: "",
  roleName: "",
  roleDisplayName: "",
  assignmentPct: 100,
  assignedMonth: null,
  validFrom: "",
  validTo: null,
  status: "vigente",
  createdByUserId: "",
  createdByDisplayName: null,
  createdAt: "",
};

function monthLabel(month: string): string | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const [, year, mm] = m;
  const names = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  const idx = Number(mm) - 1;
  if (idx < 0 || idx > 11) return null;
  return `${names[idx]} ${year}`;
}

export function AssignmentsShell({
  initialAssignments,
  roles,
  catalog,
}: AssignmentsShellProps) {
  const { rows, createRow, changeRow, closeRow } = useAssignments(initialAssignments);
  const { selection, setProject, setTeam, setMonth } =
    useAssignmentsContextUrl({
      defaultProject: catalog.project,
      defaultTeam: catalog.team,
    });
  const { saveDefaults, saveDefaultsPending } = useSaveAdoContextDefaults({
    catalog,
  });

  const [filters, setFilters] = useState<AssignmentsFiltersValue>({
    personQuery: "",
  });

  const visibleRows = useMemo(() => {
    const projectLc = selection.project.trim().toLowerCase();
    const personLc = filters.personQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (projectLc && row.projectName.toLowerCase() !== projectLc) {
        return false;
      }
      if (personLc && !row.personDisplayName.toLowerCase().includes(personLc)) {
        return false;
      }
      return true;
    });
  }, [rows, selection.project, filters.personQuery]);

  const lastKnownRoleIdByPerson = useMemo(() => {
    const out: Record<string, string> = {};
    for (const r of rows) {
      if (r.roleId && !out[r.personAdoId]) out[r.personAdoId] = r.roleId;
    }
    return out;
  }, [rows]);

  const [changeTarget, setChangeTarget] = useState<AssignmentRow | null>(null);
  const [closeTarget, setCloseTarget] = useState<AssignmentRow | null>(null);

  const defaultContext: AssignmentDefaultContext = {
    project: selection.project ? { id: "", name: selection.project } : null,
    team: selection.team ? { id: "", name: selection.team } : null,
  };

  const summary = buildAdoFiltersSummary({
    project: selection.project || undefined,
    team: selection.team || undefined,
    extraParts: [
      monthLabel(selection.month) ? `Mes: ${monthLabel(selection.month)}` : "",
    ],
  });

  async function handleCreate(input: CreateAssignmentPayload): Promise<boolean> {
    const created = await createRow(input);
    return created !== null && created.length > 0;
  }

  async function handleChange(
    target: AssignmentRow,
    payload: ChangeAssignmentPayload,
  ): Promise<boolean> {
    const updated = await changeRow(target.id, payload);
    return updated !== null;
  }

  async function handleClose(
    target: AssignmentRow,
    payload: CloseAssignmentPayload,
  ): Promise<boolean> {
    const updated = await closeRow(target.id, payload);
    return updated !== null;
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <AdoFiltersCollapsible
        title="Contexto"
        summary={summary}
        defaultOpen={false}
        className="w-full"
      >
        <AssignmentsContextFields
          catalog={catalog}
          selection={selection}
          onProjectChange={setProject}
          onTeamChange={setTeam}
          onMonthChange={setMonth}
        />
        <AdoContextTeamDefaultHint
          project={selection.project}
          team={selection.team}
          defaultProject={catalog.defaultProject}
          defaultTeam={catalog.defaultTeam}
          pending={saveDefaultsPending}
          onSave={() => {
            saveDefaults().catch(() => undefined);
          }}
        />
      </AdoFiltersCollapsible>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <AssignmentsFilters value={filters} onChange={setFilters} />
        </div>
        <AssignmentFormDialog
          catalog={catalog}
          roles={roles}
          loadMembers={(projectName, teamName) =>
            listTeamMembersByProjectAndTeam(projectName, teamName)
          }
          onSubmit={handleCreate}
          lastKnownRoleIdByPerson={lastKnownRoleIdByPerson}
          defaultContext={defaultContext}
        />
      </div>

      <AssignmentsTable
        rows={visibleRows}
        onChange={setChangeTarget}
        onClose={setCloseTarget}
      />

      <AssignmentChangeDialog
        open={changeTarget !== null}
        onOpenChange={(next) => {
          if (!next) setChangeTarget(null);
        }}
        assignment={changeTarget ?? PLACEHOLDER_ASSIGNMENT}
        roles={roles}
        onSubmit={(payload) =>
          changeTarget
            ? handleChange(changeTarget, payload)
            : Promise.resolve(false)
        }
      />

      <AssignmentCloseDialog
        open={closeTarget !== null}
        onOpenChange={(next) => {
          if (!next) setCloseTarget(null);
        }}
        assignment={closeTarget ?? PLACEHOLDER_ASSIGNMENT}
        onSubmit={(payload) =>
          closeTarget
            ? handleClose(closeTarget, payload)
            : Promise.resolve(false)
        }
      />
    </div>
  );
}
