import { ACCOUNT_AUTH_COPY } from "@/components/auth/account-auth-copy";

export function PersistenceUnavailablePanel() {
  return (
    <div
      className="border-destructive/30 bg-destructive/5 rounded-lg border p-4"
      role="alert"
    >
      <p className="text-sm leading-relaxed">
        {ACCOUNT_AUTH_COPY.persistenceUnavailable}
      </p>
    </div>
  );
}
