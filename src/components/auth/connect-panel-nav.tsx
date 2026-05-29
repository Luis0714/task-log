import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { Button } from "@/components/ui/button";

export type ConnectPanelNavProps = {
  onBack: () => void;
  submitLabel: string;
  submitting?: boolean;
  submitType?: "button" | "submit";
  onSubmit?: () => void;
};

export function ConnectPanelNav({
  onBack,
  submitLabel,
  submitting = false,
  submitType = "button",
  onSubmit,
}: ConnectPanelNavProps) {
  return (
    <div className="flex flex-col gap-2 pt-1 sm:flex-row">
      <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
        {CONNECT_ADO_COPY.back}
      </Button>
      <Button
        type={submitType}
        className="sm:flex-1"
        disabled={submitting}
        onClick={submitType === "button" ? onSubmit : undefined}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
