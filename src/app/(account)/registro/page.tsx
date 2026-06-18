import Link from "next/link";

import { AccountAuthCard } from "@/components/auth/account-auth-card";
import { ACCOUNT_AUTH_COPY } from "@/components/auth/account-auth-copy";
import { RegisterPatForm } from "@/components/auth/register-pat-form";
import { isPatAuthHidden } from "@/lib/auth/auth-method";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { isUserPersistenceReady } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RegistroPage() {
  const copy = ACCOUNT_AUTH_COPY.register;
  const disabledCopy = ACCOUNT_AUTH_COPY.registerDisabled;
  const persistenceReady = isUserPersistenceReady();
  const patAuthHidden = isPatAuthHidden();

  let body;
  if (patAuthHidden) {
    body = (
      <div className="space-y-4 text-center">
        <p className="text-foreground text-sm leading-relaxed">
          {disabledCopy.message}
        </p>
        <Link
          href="/login"
          className="text-primary inline-block font-medium underline-offset-4 hover:underline"
        >
          {disabledCopy.action}
        </Link>
      </div>
    );
  } else if (persistenceReady) {
    body = <RegisterPatForm />;
  } else {
    body = (
      <p className="text-muted-foreground text-sm leading-relaxed">
        {USER_MESSAGES.persistenceUnavailable}
      </p>
    );
  }

  return (
    <AccountAuthCard title={copy.title} description={copy.description}>
      {body}
      <p className="text-muted-foreground mt-6 text-center text-xs">
        <Link href="/" className="underline-offset-4 hover:underline">
          Volver al inicio
        </Link>
      </p>
    </AccountAuthCard>
  );
}
