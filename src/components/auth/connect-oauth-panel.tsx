import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { ConnectPanelNav } from "@/components/auth/connect-panel-nav";
import { startMicrosoftConnect } from "@/services/auth/connect-ado.service";

export type ConnectOauthPanelProps = {
  onBack: () => void;
};

export function ConnectOauthPanel({ onBack }: ConnectOauthPanelProps) {
  const copy = CONNECT_ADO_COPY.microsoft;

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        <h3 className="font-medium">{copy.panelTitle}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{copy.intro}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">{copy.adminNote}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">{copy.sessionNote}</p>
      </div>

      <ConnectPanelNav
        onBack={onBack}
        submitLabel={copy.continue}
        onSubmit={startMicrosoftConnect}
      />

      <p className="text-muted-foreground text-xs">{copy.adminHint}</p>
    </div>
  );
}
