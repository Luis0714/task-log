import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";

export type ConnectPatFormFieldsProps = {
  pat: string;
  onPatChange: (value: string) => void;
};

export function ConnectPatFormFields({ pat, onPatChange }: ConnectPatFormFieldsProps) {
  const copy = CONNECT_ADO_COPY.pat;

  return (
    <div className="space-y-1.5">
      <Label htmlFor="connect-pat">{copy.tokenLabel}</Label>
      <Input
        id="connect-pat"
        type="password"
        autoComplete="new-password"
        spellCheck={false}
        placeholder={copy.tokenPlaceholder}
        value={pat}
        onChange={(event) => onPatChange(event.target.value)}
      />
      <p className="text-muted-foreground text-xs leading-relaxed">{copy.formHint}</p>
    </div>
  );
}
