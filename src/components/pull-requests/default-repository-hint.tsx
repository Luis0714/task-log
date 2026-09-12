import { SaveAsDefaultLinkButton } from "@/components/filters/save-as-default-button";

export type DefaultRepositoryHintProps = Readonly<{
  repository: string;
  defaultRepository: string | null;
  pending?: boolean;
  onSave: (repository: string) => Promise<void> | void;
}>;

export function DefaultRepositoryHint({
  repository,
  defaultRepository,
  pending = false,
  onSave,
}: DefaultRepositoryHintProps) {
  if (!repository) return null;

  const isDefault = repository === (defaultRepository ?? "");

  return (
    <div className="space-y-1">
      {isDefault ? (
        <p className="text-muted-foreground text-xs leading-snug">
          Este repositorio se usará por defecto al crear pull requests.
        </p>
      ) : null}
      <SaveAsDefaultLinkButton
        disabled={pending}
        onSave={() => onSave(repository)}
      />
    </div>
  );
}
