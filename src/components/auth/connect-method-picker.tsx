import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { ConnectMethodCard } from "@/components/auth/connect-method-card";
import { ConnectUnavailablePanel } from "@/components/auth/connect-unavailable-panel";
import { hasConnectMethod, type ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { SessionAuthMethod } from "@/lib/auth/session-auth-method";

export type ConnectMethodPickerProps = {
  connectOptions: ConnectAuthOptions;
  onSelect: (method: SessionAuthMethod) => void;
};

export function ConnectMethodPicker({
  connectOptions,
  onSelect,
}: ConnectMethodPickerProps) {
  const { microsoft, pat } = CONNECT_ADO_COPY;

  if (!hasConnectMethod(connectOptions)) {
    return <ConnectUnavailablePanel connectOptions={connectOptions} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {connectOptions.oauthEnabled ? (
        <ConnectMethodCard
          title={microsoft.cardTitle}
          description={microsoft.cardDescription}
          onSelect={() => onSelect("oauth")}
        />
      ) : null}
      {connectOptions.patEnabled ? (
        <ConnectMethodCard
          title={pat.cardTitle}
          description={pat.cardDescription}
          onSelect={() => onSelect("pat")}
        />
      ) : null}
    </div>
  );
}
