import { ConnectOauthPanel } from "@/components/auth/connect-oauth-panel";
import { ConnectPatPanel } from "@/components/auth/connect-pat-panel";
import { ConnectSheetChooseStep } from "@/components/auth/connect-sheet-choose-step";
import type { ConnectSheetStep } from "@/hooks/auth/use-connect-ado-sheet";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { SessionAuthMethod } from "@/lib/auth/session-auth-method";

export type ConnectSheetStepContentProps = {
  step: ConnectSheetStep;
  selectedMethod: SessionAuthMethod | null;
  canContinue: boolean;
  connectOptions: ConnectAuthOptions;
  onSelectMethod: (method: SessionAuthMethod) => void;
  onContinue: () => void;
  onBack: () => void;
  onConnected: () => void;
};

export function ConnectSheetStepContent({
  step,
  selectedMethod,
  canContinue,
  connectOptions,
  onSelectMethod,
  onContinue,
  onBack,
  onConnected,
}: ConnectSheetStepContentProps) {
  if (step === "choose") {
    return (
      <ConnectSheetChooseStep
        connectOptions={connectOptions}
        selectedMethod={selectedMethod}
        canContinue={canContinue}
        onSelectMethod={onSelectMethod}
        onContinue={onContinue}
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
