"use client";

import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { ConnectMethodOauthAction } from "@/components/auth/connect-method-oauth-action";
import { ConnectMethodOptionSection } from "@/components/auth/connect-method-option-section";
import { ConnectMethodPatAction } from "@/components/auth/connect-method-pat-action";
import { ConnectUnavailablePanel } from "@/components/auth/connect-unavailable-panel";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { SavedConnectionTarget } from "@/lib/auth/server-state";
import type { SessionAuthMethod } from "@/lib/auth/session-auth-method";

const METHOD_OPTIONS: SessionAuthMethod[] = ["oauth", "pat"];

export type ConnectMethodPickerProps = {
  connectOptions: ConnectAuthOptions;
  savedConnectionTarget?: SavedConnectionTarget | null;
  selectedMethod: SessionAuthMethod | null;
  onSelectMethod: (method: SessionAuthMethod) => void;
  onConnected?: () => void;
};

export function ConnectMethodPicker({
  connectOptions,
  savedConnectionTarget = null,
  selectedMethod,
  onSelectMethod,
  onConnected,
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
          const selected = selectedMethod === method;

          return (
            <ConnectMethodOptionSection
              key={method}
              method={method}
              name="connect-auth-method"
              title={copy.cardTitle}
              description={copy.cardDescription}
              selected={selected}
              disabled={!ready}
              disabledHint={!ready ? copy.unavailableHint : undefined}
              action={
                selected && ready ? (
                  isOAuth ? (
                    <ConnectMethodOauthAction />
                  ) : (
                    <ConnectMethodPatAction
                      savedConnectionTarget={savedConnectionTarget}
                      onConnected={onConnected}
                    />
                  )
                ) : null
              }
              onSelect={onSelectMethod}
            />
          );
        })}
      </div>
    </div>
  );
}
