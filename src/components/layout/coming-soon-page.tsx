import { PageHeader } from "@/components/layout/page-header";

export type ComingSoonPageProps = Readonly<{
  title: string;
  description: string;
}>;

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <PageHeader title={title} description={description} />
      <p className="text-muted-foreground text-sm">
        Esta sección estará disponible en breve.
      </p>
    </div>
  );
}
