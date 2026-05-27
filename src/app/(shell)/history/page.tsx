import { CopilotHistoryView } from "@/components/copilot/copilot-history-view";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.history);

export default function HistoryPage() {
  return <CopilotHistoryView />;
}
