import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import type { ConnectPatFormValues } from "@/lib/auth/connect-pat.types";

export type ConnectPatFormFieldsProps = {
  values: ConnectPatFormValues;
  onFieldChange: (field: keyof ConnectPatFormValues, value: string) => void;
};

export function ConnectPatFormFields({
  values,
  onFieldChange,
}: ConnectPatFormFieldsProps) {
  const copy = CONNECT_ADO_COPY.pat;

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="connect-org">{copy.organizationLabel}</Label>
        <Input
          id="connect-org"
          autoComplete="off"
          placeholder={copy.organizationPlaceholder}
          value={values.organization}
          onChange={(event) => onFieldChange("organization", event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="connect-project">{copy.projectLabel}</Label>
        <Input
          id="connect-project"
          autoComplete="off"
          placeholder={copy.projectPlaceholder}
          value={values.project}
          onChange={(event) => onFieldChange("project", event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="connect-pat">{copy.tokenLabel}</Label>
        <Input
          id="connect-pat"
          type="password"
          autoComplete="off"
          placeholder={copy.tokenPlaceholder}
          value={values.pat}
          onChange={(event) => onFieldChange("pat", event.target.value)}
        />
      </div>
    </>
  );
}
