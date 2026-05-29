import { SignInRequiredPanel } from "@/components/auth/sign-in-required-panel";
import { PageHeader } from "@/components/layout/page-header";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { SavedConnectionTarget } from "@/lib/auth/server-state";

export type AuthRequiredPageLayoutProps = {
  title: string;
  description: string;
  connectOptions: ConnectAuthOptions;
  savedConnectionTarget?: SavedConnectionTarget | null;
};

export function AuthRequiredPageLayout({
  title,
  description,
  connectOptions,
  savedConnectionTarget = null,
}: AuthRequiredPageLayoutProps) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <PageHeader title={title} description={description} />
      <SignInRequiredPanel
        connectOptions={connectOptions}
        savedConnectionTarget={savedConnectionTarget}
        className="min-h-0 flex-1"
      />
    </div>
  );
}
