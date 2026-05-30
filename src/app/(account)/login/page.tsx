import Link from "next/link";

import { AccountAuthCard } from "@/components/auth/account-auth-card";
import { ACCOUNT_AUTH_COPY } from "@/components/auth/account-auth-copy";
import { LoginAuthNotice } from "@/components/auth/login-auth-notice";
import { LoginLocalForm } from "@/components/auth/login-local-form";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { getConnectAuthOptions } from "@/lib/auth/connect-auth-options";
import { isUserPersistenceReady } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const copy = ACCOUNT_AUTH_COPY.login;
  const connectOptions = getConnectAuthOptions();
  const persistenceReady = isUserPersistenceReady();

  return (
    <AccountAuthCard title={copy.title} description={copy.description}>
      <LoginAuthNotice />
      {persistenceReady ? (
        <LoginLocalForm connectOptions={connectOptions} />
      ) : (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {USER_MESSAGES.persistenceUnavailable}
        </p>
      )}
      <p className="text-muted-foreground mt-6 text-center text-xs">
        <Link href="/" className="underline-offset-4 hover:underline">
          Volver al inicio
        </Link>
      </p>
    </AccountAuthCard>
  );
}
