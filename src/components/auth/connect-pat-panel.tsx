import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { ConnectPanelNav } from "@/components/auth/connect-panel-nav";
import { ConnectPatFormFields } from "@/components/auth/connect-pat-form-fields";
import { ConnectPatIntro } from "@/components/auth/connect-pat-intro";
import { useConnectPatForm } from "@/hooks/auth/use-connect-pat-form";

export type ConnectPatPanelProps = {
  onBack: () => void;
  onConnected?: () => void;
};

export function ConnectPatPanel({ onBack, onConnected }: ConnectPatPanelProps) {
  const copy = CONNECT_ADO_COPY.pat;
  const { values, submitting, errorMessage, setField, submit } = useConnectPatForm(
    onConnected,
  );

  return (
    <div className="flex flex-col gap-4">
      <ConnectPatIntro />

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <ConnectPatFormFields values={values} onFieldChange={setField} />

        {errorMessage ? (
          <p className="text-destructive text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <ConnectPanelNav
          onBack={onBack}
          submitLabel={submitting ? copy.connecting : copy.connect}
          submitting={submitting}
          submitType="submit"
        />
      </form>
    </div>
  );
}
