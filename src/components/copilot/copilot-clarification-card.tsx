"use client";

import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  NeedsClarificationPayload,
  PbiCandidate,
} from "@/lib/schemas/agent";

export type CopilotClarificationCardProps = {
  preview: NeedsClarificationPayload;
  loading?: boolean;
  onPickPbi: (pbiId: number) => void;
  onCancel: () => void;
};

export function CopilotClarificationCard({
  preview,
  loading = false,
  onPickPbi,
  onCancel,
}: Readonly<CopilotClarificationCardProps>) {
  const candidates = preview.candidates ?? [];
  const hasCandidates = candidates.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Necesito un dato</CardTitle>
        <CardDescription className="text-pretty">
          {preview.question}
        </CardDescription>
      </CardHeader>
      {hasCandidates && (
        <CardContent className="space-y-1">
          {candidates.map((pbi) => (
            <CandidateRow
              key={pbi.id}
              candidate={pbi}
              loading={loading}
              onPick={() => onPickPbi(pbi.id)}
            />
          ))}
        </CardContent>
      )}
      <CardFooter className="justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={onCancel}
        >
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Cancelar
        </Button>
      </CardFooter>
    </Card>
  );
}

function CandidateRow({
  candidate,
  loading,
  onPick,
}: {
  candidate: PbiCandidate;
  loading: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onPick}
      className="hover:bg-muted/40 focus-visible:ring-ring flex w-full items-start justify-between gap-3 rounded-md px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">#{candidate.id}</Badge>
          {candidate.state && (
            <Badge variant="secondary">{candidate.state}</Badge>
          )}
        </div>
        <p className="text-foreground mt-1 text-sm font-medium">{candidate.title}</p>
      </div>
      <span className="text-muted-foreground shrink-0 text-xs">Usar →</span>
    </button>
  );
}