import { CopilotView } from "@/components/copilot/copilot-view";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";

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
