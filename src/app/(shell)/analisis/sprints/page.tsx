import { AnalysisPageContent } from "@/components/analysis/analysis-page-content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.sprints);

export const dynamic = "force-dynamic";

export default async function SprintsPage() {
  return <AnalysisPageContent seo={PAGE_SEO.sprints} />;
}
