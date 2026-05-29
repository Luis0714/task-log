import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { ConnectMethodOptionSection } from "@/components/auth/connect-method-option-section";
import { ConnectUnavailablePanel } from "@/components/auth/connect-unavailable-panel";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { SessionAuthMethod } from "@/lib/auth/session-auth-method";

const METHOD_OPTIONS: SessionAuthMethod[] = ["oauth", "pat"];

export type ConnectMethodPickerProps = {
  connectOptions: ConnectAuthOptions;
  selectedMethod: SessionAuthMethod | null;
  onSelectMethod: (method: SessionAuthMethod) => void;
};

export function ConnectMethodPicker({
  connectOptions,
  selectedMethod,
  onSelectMethod,
}: ConnectMethodPickerProps) {
  const { microsoft, pat, chooseMethodAriaLabel } = CONNECT_ADO_COPY;

  return (
    <div className="flex flex-col gap-3">
      {!connectOptions.sessionReady ? (
        <ConnectUnavailablePanel connectOptions={connectOptions} />
      ) : null}

      <div
        role="radiogroup"
        aria-label={chooseMethodAriaLabel}
        className="flex flex-col gap-3"
      >
        {METHOD_OPTIONS.map((method) => {
          const isOAuth = method === "oauth";
          const copy = isOAuth ? microsoft : pat;
          const ready = isOAuth ? connectOptions.oauthReady : connectOptions.patReady;

          return (
            <ConnectMethodOptionSection
              key={method}
              method={method}
              name="connect-auth-method"
              title={copy.cardTitle}
              description={copy.cardDescription}
              selected={selectedMethod === method}
              disabled={!ready}
              disabledHint={!ready ? copy.unavailableHint : undefined}
              onSelect={onSelectMethod}
            />
          );
        })}
      </div>
    </div>
  );
}
