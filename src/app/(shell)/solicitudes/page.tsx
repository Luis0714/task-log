import { SolicitudesShell } from "@/components/solicitudes/solicitudes-shell";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { loadAssignmentsCatalog } from "@/lib/ado/load-assignments-catalog";
import { getServerAuthState } from "@/lib/auth/server-state";
import { loadColombianHolidaysForRange } from "@/lib/holidays";
import { listMySolicitudes } from "@/lib/novedades/list-my-solicitudes";
import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.solicitudes);

export const dynamic = "force-dynamic";

export default async function SolicitudesPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<AdoContextSearchParams>;
}>) {
  const sp = (await (searchParams ?? Promise.resolve({}))) as AdoContextSearchParams;
  const caller = await requireAdoCaller();

  const currentYear = new Date().getFullYear();
  const [catalog, authState, holidays, initialSolicitudes] = await Promise.all([
    loadAssignmentsCatalog(sp),
    getServerAuthState(),
    loadColombianHolidaysForRange(`${currentYear - 1}-01-01`, `${currentYear + 2}-12-31`),
    caller.ok ? listMySolicitudes(caller.auth) : Promise.resolve<SolicitudDto[]>([]),
  ]);

  return (
    <SolicitudesShell
      initialSolicitudes={initialSolicitudes}
      projects={catalog.projects.map((project) => project.name)}
      defaultProject={catalog.project || catalog.defaultProject || ""}
      currentUserDisplayName={authState.profileDisplayName}
      holidayKeys={holidays.map((holiday) => holiday.date)}
      isManagement={authState.isManagement}
    />
  );
}
