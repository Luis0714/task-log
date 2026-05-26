import { CopilotView } from "@/components/copilot/copilot-view";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.copilot);

export const dynamic = "force-dynamic";

export default async function CopilotPage() {
  const auth = await getServerAuthBootstrap();

  return (
    <CopilotView
      adoExecutionReady={auth.adoExecutionReady}
      authMethod={auth.authMethod}
    />
  );
}
