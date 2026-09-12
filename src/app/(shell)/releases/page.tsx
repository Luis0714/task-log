import { SuperAdminPageShell } from "@/components/auth/super-admin-page-shell";
import { ReleaseListScreen } from "@/components/releases/release-list-screen";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.releases);

export const dynamic = "force-dynamic";

type PageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReleasesPage({ searchParams }: PageProps) {
  const { title, description } = PAGE_SEO.releases;

  return (
    <SuperAdminPageShell title={title} description={description}>
      <ReleaseListScreen title={title} searchParams={searchParams} />
    </SuperAdminPageShell>
  );
}
