import { redirect } from "next/navigation";

import { ComingSoonPage } from "@/components/layout/coming-soon-page";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.pullRequests);

export const dynamic = "force-dynamic";

export default async function PullRequestsPage() {
  const bootstrap = await getServerAuthBootstrap();
  if (!bootstrap.isAdmin) redirect("/");

  return (
    <ComingSoonPage
      title={PAGE_SEO.pullRequests.title}
      description={PAGE_SEO.pullRequests.description}
    />
  );
}
