import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export function DailySummarySkeleton() {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-5 xl:max-w-4xl">
      <PageHeader title="Resumen del daily" description="Cargando..." />
      <Card size="sm" className="border-primary/20">
        <CardContent className="space-y-2 pt-0">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </CardContent>
        <CardFooter className="gap-2 border-t-0 pt-0">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </CardFooter>
      </Card>
    </div>
  );
}