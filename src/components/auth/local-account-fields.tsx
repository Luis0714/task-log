import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export type LocalAccountFieldsCopy = {
  emailLabel: string;
  emailPlaceholder: string;
  emailHint?: string;
  passwordLabel: string;
  passwordPlaceholder: string;
};

export type LocalAccountFieldsProps = {
  idPrefix: string;
  email: string;
  password: string;
  copy: LocalAccountFieldsCopy;
  passwordAutoComplete?: "current-password" | "new-password";
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
};

export function LocalAccountFields({
  idPrefix,
  email,
  password,
  copy,
  passwordAutoComplete = "current-password",
  onEmailChange,
  onPasswordChange,
}: LocalAccountFieldsProps) {
  const emailId = `${idPrefix}-email`;
  const passwordId = `${idPrefix}-password`;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={emailId}>{copy.emailLabel}</Label>
        <Input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          placeholder={copy.emailPlaceholder}
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
        {copy.emailHint ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            {copy.emailHint}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={passwordId}>{copy.passwordLabel}</Label>
        <PasswordInput
          id={passwordId}
          autoComplete={passwordAutoComplete}
          placeholder={copy.passwordPlaceholder}
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
        />
      </div>
    </div>
  );
}
