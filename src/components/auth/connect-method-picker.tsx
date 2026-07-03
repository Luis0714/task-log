"use client";

import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { ConnectMethodOauthAction } from "@/components/auth/connect-method-oauth-action";
import { ConnectMethodOptionSection } from "@/components/auth/connect-method-option-section";
import { ConnectMethodPatAction } from "@/components/auth/connect-method-pat-action";
import { ConnectUnavailablePanel } from "@/components/auth/connect-unavailable-panel";
import { PersistenceUnavailablePanel } from "@/components/auth/persistence-unavailable-panel";
import { isPatAuthHidden } from "@/lib/auth/auth-method";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { SavedConnectionTarget } from "@/lib/auth/server-state";
import type { SessionAuthMethod } from "@/lib/auth/session-auth-method";

const METHOD_OPTIONS: SessionAuthMethod[] = isPatAuthHidden()
  ? ["oauth"]
  : ["oauth", "pat"];

export type ConnectMethodPickerProps = {
  connectOptions: ConnectAuthOptions;
  savedConnectionTarget?: SavedConnectionTarget | null;
  selectedMethod: SessionAuthMethod | null;
  onSelectMethod: (method: SessionAuthMethod) => void;
  onConnected?: () => void;
};

export function ConnectMethodPicker({
  connectOptions,
  selectedMethod,
  onSelectMethod,
}: ConnectMethodPickerProps) {
  const { microsoft, pat, chooseMethodAriaLabel } = CONNECT_ADO_COPY;

  if (!connectOptions.persistenceReady) {
    return <PersistenceUnavailablePanel />;
  }

  if (!connectOptions.sessionReady) {
    return <ConnectUnavailablePanel />;
  }

  return (
    <div className="flex flex-col gap-3">
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
          const disabledHint = !ready
            ? isOAuth
              ? "El inicio con Microsoft no está disponible en este entorno."
              : "El registro con cuenta guardada no está disponible ahora."
            : undefined;

          return (
            <ConnectMethodOptionSection
              key={method}
              method={method}
              name="connect-auth-method"
              title={copy.cardTitle}
              description={copy.cardDescription}
              selected={selected}
              disabled={!ready}
              disabledHint={disabledHint}
              action={
                selected && ready ? (
                  isOAuth ? (
                    <ConnectMethodOauthAction />
                  ) : (
                    <ConnectMethodPatAction />
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
