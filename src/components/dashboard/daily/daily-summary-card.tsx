"use client";

import { useCallback, useState } from "react";
import { Copy, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { appToast } from "@/lib/toast/app-toast";
import { cn } from "@/lib/utils";

export type DailySummaryCardProps = {
  summary: string;
  loading?: boolean;
  className?: string;
  onRegenerate?: () => string;
};

export function DailySummaryCard({
  summary,
  loading = false,
  className,
  onRegenerate,
}: DailySummaryCardProps) {
  const [regenerated, setRegenerated] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const text = regenerated ?? summary;

  const handleCopy = useCallback(async () => {
    if (!text.trim()) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      appToast.success("Resumen copiado al portapapeles.");
    } catch {
      appToast.error("No se pudo copiar el resumen.");
    } finally {
      setCopying(false);
    }
  }, [text]);

  const handleRegenerate = useCallback(() => {
    setRegenerated(onRegenerate?.() ?? summary);
    appToast.message("Resumen actualizado.");
  }, [onRegenerate, summary]);

  return (
    <Card
      size="sm"
      className={cn(
        "border-border/60 dark:border-white/6 border-primary/15 ring-primary/5",
        className,
      )}
    >
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <p className="text-foreground line-clamp-2 text-sm leading-relaxed text-pretty">{text}</p>
        )}
      </CardContent>
      <CardFooter className="gap-2 border-t-0 pt-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || copying || !text.trim()}
          onClick={() => void handleCopy()}
        >
          {copying ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )}
          Copiar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={handleRegenerate}
        >
          <RefreshCw className="size-4" aria-hidden />
          Regenerar
        </Button>
      </CardFooter>
    </Card>
  );
}
