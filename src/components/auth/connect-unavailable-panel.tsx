import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";

export type ConnectUnavailablePanelProps = {
  connectOptions: ConnectAuthOptions;
};

export function ConnectUnavailablePanel({ connectOptions }: ConnectUnavailablePanelProps) {
  const { setup } = CONNECT_ADO_COPY.unavailable;

  return (
    <div className="space-y-3">
      <h3 className="font-medium">{setup.title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{setup.intro}</p>
      <ul className="text-muted-foreground list-disc space-y-1.5 pl-4 text-sm leading-relaxed">
        {!connectOptions.oauthEnabled && setup.oauthHint ? <li>{setup.oauthHint}</li> : null}
        {!connectOptions.patEnabled && setup.patHint ? <li>{setup.patHint}</li> : null}
        <li>{setup.bothHint}</li>
      </ul>
    </div>
  );
}
