import Link from "next/link";

import { AccountAuthCard } from "@/components/auth/account-auth-card";
import { ACCOUNT_AUTH_COPY } from "@/components/auth/account-auth-copy";
import { RegisterPatForm } from "@/components/auth/register-pat-form";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { isUserPersistenceReady } from "@/lib/db/is-persistence-ready";

export const dynamic = "force-dynamic";

export default async function RegistroPage() {
  const copy = ACCOUNT_AUTH_COPY.register;
  const persistenceReady = isUserPersistenceReady();

  return (
    <AccountAuthCard title={copy.title} description={copy.description}>
      {persistenceReady ? (
        <RegisterPatForm />
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
