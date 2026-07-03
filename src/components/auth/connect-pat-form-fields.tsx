import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { ConnectPatTokenHelp } from "@/components/auth/connect-pat-token-help";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export type ConnectPatFormFieldsProps = {
  pat: string;
  organization: string;
  project: string;
  team: string;
  adoUrl: string;
  urlParseError: string | null;
  onPatChange: (value: string) => void;
  onOrganizationChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onTeamChange: (value: string) => void;
  onAdoUrlChange: (value: string) => void;
};

export function ConnectPatFormFields({
  pat,
  organization,
  project,
  team,
  adoUrl,
  urlParseError,
  onPatChange,
  onOrganizationChange,
  onProjectChange,
  onTeamChange,
  onAdoUrlChange,
}: ConnectPatFormFieldsProps) {
  const copy = CONNECT_ADO_COPY.pat;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="connect-ado-url">{copy.urlLabel}</Label>
        <Input
          id="connect-ado-url"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder={copy.urlPlaceholder}
          value={adoUrl}
          onChange={(event) => onAdoUrlChange(event.target.value)}
        />
        <p className="text-muted-foreground text-xs leading-relaxed">{copy.urlHint}</p>
        {urlParseError ? (
          <p className="text-destructive text-xs" role="alert">
            {urlParseError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="connect-pat">{copy.tokenLabel}</Label>
        <PasswordInput
          id="connect-pat"
          autoComplete="new-password"
          spellCheck={false}
          placeholder={copy.tokenPlaceholder}
          value={pat}
          onChange={(event) => onPatChange(event.target.value)}
        />
        <ConnectPatTokenHelp />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="connect-organization">{copy.organizationLabel}</Label>
        <Input
          id="connect-organization"
          autoComplete="organization"
          spellCheck={false}
          placeholder={copy.organizationPlaceholder}
          value={organization}
          onChange={(event) => onOrganizationChange(event.target.value)}
        />
        <p className="text-muted-foreground text-xs leading-relaxed">
          {copy.organizationHint}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="connect-project">{copy.projectLabel}</Label>
        <Input
          id="connect-project"
          autoComplete="off"
          spellCheck={false}
          placeholder={copy.projectPlaceholder}
          value={project}
          onChange={(event) => onProjectChange(event.target.value)}
        />
        <p className="text-muted-foreground text-xs leading-relaxed">{copy.projectHint}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="connect-team">{copy.teamLabel}</Label>
        <Input
          id="connect-team"
          autoComplete="off"
          spellCheck={false}
          placeholder={copy.teamPlaceholder}
          value={team}
          onChange={(event) => onTeamChange(event.target.value)}
        />
        <p className="text-muted-foreground text-xs leading-relaxed">{copy.teamHint}</p>
      </div>
    </div>
  );
}
