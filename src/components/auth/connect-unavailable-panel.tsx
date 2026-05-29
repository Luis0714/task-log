import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";

export type ConnectUnavailablePanelProps = {
  connectOptions: ConnectAuthOptions;
};

export function ConnectUnavailablePanel({ connectOptions }: ConnectUnavailablePanelProps) {
  const { setup } = CONNECT_ADO_COPY.unavailable;

  return (
    <div
      className="border-destructive/30 bg-destructive/5 space-y-2 rounded-lg border p-3"
      role="alert"
    >
      <h3 className="text-sm font-medium">{setup.title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{setup.intro}</p>
      <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-xs leading-relaxed">
        {!connectOptions.sessionReady && setup.patHint ? <li>{setup.patHint}</li> : null}
        {connectOptions.sessionReady && !connectOptions.oauthReady && setup.oauthHint ? (
          <li>{setup.oauthHint}</li>
        ) : null}
      </ul>
    </div>
  );
}
