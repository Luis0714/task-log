import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AuthRequiredPageLayout } from "@/components/auth/auth-required-page-layout";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";

export type SuperAdminPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export async function SuperAdminPageShell({
  title,
  description,
  children,
}: SuperAdminPageShellProps) {
  const auth = await getServerAuthBootstrap();

  if (!canLoadLiveAdoContent(auth)) {
    return (
      <AuthRequiredPageLayout
        title={title}
        description={description}
        connectOptions={auth.connectOptions}
        savedConnectionTarget={auth.savedConnectionTarget}
      />
    );
  }

  if (!auth.isAdmin) redirect("/");

  return children;
}
