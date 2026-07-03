import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { EMPTY_ADO_CATALOG } from "@/lib/ado/load-ado-catalog";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { DashboardHeaderData } from "@/lib/dashboard/types";

const DEMO_HEADER: DashboardHeaderData = {
  displayName: "Hola",
  initials: "U",
  avatarUrl: null,
  project: "Proyecto de ejemplo",
  sprintName: "Sprint 12 (vista previa)",
};

export type DashboardDemoShellProps = {
  connectOptions: ConnectAuthOptions;
};

export function DashboardDemoShell({ connectOptions }: DashboardDemoShellProps) {
  return (
    <DashboardPageShell
      header={DEMO_HEADER}
      catalog={EMPTY_ADO_CATALOG}
      adoExecutionReady={false}
      userSessionActive={false}
      connectOptions={connectOptions}
      savedConnectionTarget={null}
      initialSprintDayKey=""
      nonWorkingDates={[]}
    />
  );
}
