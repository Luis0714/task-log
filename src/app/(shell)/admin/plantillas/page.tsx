import { redirect } from "next/navigation";

import { AdminTemplatesTable } from "@/components/admin/admin-templates-table";
import { PageHeader } from "@/components/layout/page-header";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { getRepositories } from "@/lib/db";
import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";
import { templateRowToDto } from "@/lib/time-log/template-dto";

export const dynamic = "force-dynamic";

export default async function AdminPlantillasPage() {
  const bootstrap = await getServerAuthBootstrap();
  if (!bootstrap.isAdmin) redirect("/");

  // `adminListAll` ya hace LEFT JOIN con `users` y trae `authorDisplayName`.
  const rows = await getRepositories().timeLogTemplate.adminListAll();
  const templates: TimeLogTemplateDto[] = rows.map((r) =>
    templateRowToDto(r, r.authorDisplayName ?? null),
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <PageHeader
        title="Plantillas"
        description="Administra las plantillas por rol, globales o personales (tuyas). Solo tú (super_admin) puedes crearlas, editarlas o eliminarlas."
      />
      <AdminTemplatesTable templates={templates} />
    </div>
  );
}
