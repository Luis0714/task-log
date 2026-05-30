import Link from "next/link";

import { AccountAuthCard } from "@/components/auth/account-auth-card";
import { ACCOUNT_AUTH_COPY } from "@/components/auth/account-auth-copy";
import { LoginLocalForm } from "@/components/auth/login-local-form";
import { getConnectAuthOptions } from "@/lib/auth/connect-auth-options";
import { isUserPersistenceReady } from "@/lib/db/is-persistence-ready";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const copy = ACCOUNT_AUTH_COPY.login;
  const connectOptions = getConnectAuthOptions();
  const persistenceReady = isUserPersistenceReady();

  return (
    <AccountAuthCard title={copy.title} description={copy.description}>
      {persistenceReady ? (
        <LoginLocalForm connectOptions={connectOptions} />
      ) : (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {ACCOUNT_AUTH_COPY.persistenceUnavailable}
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
