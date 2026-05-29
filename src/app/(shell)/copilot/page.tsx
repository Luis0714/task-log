import { AuthRequiredPageLayout } from "@/components/auth/auth-required-page-layout";
import { CopilotView } from "@/components/copilot/copilot-view";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.copilot);

export const dynamic = "force-dynamic";

const COPILOT_DESCRIPTION =
  "Describe qué hiciste en lenguaje natural. Siempre verás una vista previa antes de ejecutar en Azure DevOps.";

export default async function CopilotPage() {
  const auth = await getServerAuthBootstrap();

  if (!canLoadLiveAdoContent(auth)) {
    return (
      <AuthRequiredPageLayout
        title="Copiloto IA"
        description={COPILOT_DESCRIPTION}
        connectOptions={auth.connectOptions}
        savedConnectionTarget={auth.savedConnectionTarget}
      />
    );
  }

  return (
    <CopilotView
      adoExecutionReady
      authMethod={auth.authMethod}
    />
  );
}
