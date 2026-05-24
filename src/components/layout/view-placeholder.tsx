export type ViewPlaceholderProps = {
  title: string;
};

export function ViewPlaceholder({ title }: ViewPlaceholderProps) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-heading text-xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">Esta vista estará disponible pronto.</p>
    </div>
  );
}
