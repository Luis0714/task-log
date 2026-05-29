import { ConnectMethodPicker } from "@/components/auth/connect-method-picker";
import { ConnectOauthPanel } from "@/components/auth/connect-oauth-panel";
import { ConnectPatPanel } from "@/components/auth/connect-pat-panel";
import type { ConnectSheetStep } from "@/hooks/auth/use-connect-ado-sheet";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { SessionAuthMethod } from "@/lib/auth/session-auth-method";

export type ConnectSheetStepContentProps = {
  step: ConnectSheetStep;
  selectedMethod: SessionAuthMethod | null;
  connectOptions: ConnectAuthOptions;
  onSelectMethod: (method: SessionAuthMethod) => void;
  onBack: () => void;
  onConnected: () => void;
};

export function ConnectSheetStepContent({
  step,
  selectedMethod,
  connectOptions,
  onSelectMethod,
  onBack,
  onConnected,
}: ConnectSheetStepContentProps) {
  if (step === "choose") {
    return (
      <ConnectMethodPicker
        connectOptions={connectOptions}
        onSelect={onSelectMethod}
      />
    );
  }

  if (selectedMethod === "oauth") {
    return <ConnectOauthPanel onBack={onBack} />;
  }

  if (selectedMethod === "pat") {
    return <ConnectPatPanel onBack={onBack} onConnected={onConnected} />;
  }

  return null;
}
