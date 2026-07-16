import { AuthRequiredPageLayout } from "@/components/auth/auth-required-page-layout";
import { SolicitudesShell } from "@/components/solicitudes/solicitudes-shell";
import { loadAssignmentsCatalog } from "@/lib/ado/load-assignments-catalog";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { resolvePageAuth } from "@/lib/auth/resolve-page-auth";
import { getServerAuthState } from "@/lib/auth/server-state";
import { loadColombianHolidaysForRange } from "@/lib/holidays";
import { listMySolicitudes } from "@/lib/novedades/list-my-solicitudes";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.solicitudes);

export const dynamic = "force-dynamic";

export default async function SolicitudesPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { searchParams: sp, auth } = await resolvePageAuth(searchParams);

  if (!canLoadLiveAdoContent(auth)) {
    return (
      <AuthRequiredPageLayout
        title={PAGE_SEO.solicitudes.title}
        description={PAGE_SEO.solicitudes.description}
        connectOptions={auth.connectOptions}
        savedConnectionTarget={auth.savedConnectionTarget}
      />
    );
  }

  const caller = await requireAdoCaller();
  const currentYear = new Date().getFullYear();
  const [catalog, authState, holidays, initialSolicitudes] = await Promise.all([
    loadAssignmentsCatalog(sp),
    getServerAuthState(),
    loadColombianHolidaysForRange(`${currentYear - 1}-01-01`, `${currentYear + 2}-12-31`),
    caller.ok ? listMySolicitudes(caller.auth) : Promise.resolve([]),
  ]);

  return (
    <SolicitudesShell
      initialSolicitudes={initialSolicitudes}
      projects={catalog.projects.map((project) => project.name)}
      teamsByProject={catalog.teamsByProject}
      defaultProject={catalog.project || catalog.defaultProject || ""}
      defaultTeam={catalog.team || catalog.defaultTeam || ""}
      currentUserDisplayName={authState.profileDisplayName}
      holidayKeys={holidays.map((holiday) => holiday.date)}
      isManagement={authState.isManagement}
    />
  );
}
