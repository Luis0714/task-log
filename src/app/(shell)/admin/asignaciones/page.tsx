import { redirect } from "next/navigation";

import { AssignmentsShell } from "@/components/assignments/assignments-shell";
import { PageHeader } from "@/components/layout/page-header";
import { assignmentRowToDto } from "@/lib/assignments/build-assignment-row";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { getDb } from "@/lib/db/client";
import { getRepositories } from "@/lib/db";
import { roles as rolesTable } from "@/lib/db/schema";
import { loadAssignmentsCatalog } from "@/lib/ado/load-assignments-catalog";
import type { AdoContextSearchParams } from "@/lib/ado/types";

export const dynamic = "force-dynamic";

export default async function AdminAsignacionesPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<AdoContextSearchParams>;
}>) {
  const bootstrap = await getServerAuthBootstrap();
  if (!bootstrap.isManagement) redirect("/");

  const sp = (await (searchParams ?? Promise.resolve({}))) as AdoContextSearchParams;

  const repo = getRepositories().personProjectAssignment;
  const [rawAssignments, rolesRows, catalog] = await Promise.all([
    repo.listWithRoles({ status: "todas" }),
    getDb().select().from(rolesTable),
    loadAssignmentsCatalog(sp),
  ]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <PageHeader
        title="Asignaciones"
        description="Configura el porcentaje de dedicación de cada persona en cada equipo dentro de cada proyecto."
      />
      <AssignmentsShell
        initialAssignments={rawAssignments.map(assignmentRowToDto)}
        roles={rolesRows.map((r) => ({
          id: r.id,
          name: r.name,
          displayName: r.displayName,
        }))}
        catalog={catalog}
      />
    </div>
  );
}
