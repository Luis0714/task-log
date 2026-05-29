import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { ConnectMethodPicker } from "@/components/auth/connect-method-picker";
import { Button } from "@/components/ui/button";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { SessionAuthMethod } from "@/lib/auth/session-auth-method";

export type ConnectSheetChooseStepProps = {
  connectOptions: ConnectAuthOptions;
  selectedMethod: SessionAuthMethod | null;
  canContinue: boolean;
  onSelectMethod: (method: SessionAuthMethod) => void;
  onContinue: () => void;
};

export function ConnectSheetChooseStep({
  connectOptions,
  selectedMethod,
  canContinue,
  onSelectMethod,
  onContinue,
}: ConnectSheetChooseStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <ConnectMethodPicker
        connectOptions={connectOptions}
        selectedMethod={selectedMethod}
        onSelectMethod={onSelectMethod}
      />

      <Button type="button" className="w-full" disabled={!canContinue} onClick={onContinue}>
        {CONNECT_ADO_COPY.continue}
      </Button>
    </div>
  );
}
