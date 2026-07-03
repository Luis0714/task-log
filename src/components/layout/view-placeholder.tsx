import { PageHeader } from "@/components/layout/page-header";

export type ViewPlaceholderProps = {
  title: string;
  description?: string;
};

export function ViewPlaceholder({ title, description }: ViewPlaceholderProps) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <PageHeader title={title} description={description} />
      <p className="text-muted-foreground text-sm">Esta vista estará disponible pronto.</p>
    </div>
  );
}
