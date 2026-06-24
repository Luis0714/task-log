"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { PbiCandidate } from "@/lib/schemas/agent";

export type CopilotPbiTypeaheadProps = {
  value: PbiCandidate | null;
  onChange: (candidate: PbiCandidate) => void;
  sprintPath?: string;
  placeholder?: string;
  disabled?: boolean;
};

type SearchResponse = {
  candidates?: Array<{ id: number; title: string; state?: string }>;
};

const DEBOUNCE_MS = 250;

export function CopilotPbiTypeahead({
  value,
  onChange,
  sprintPath,
  placeholder = "Buscar PBI…",
  disabled = false,
}: Readonly<CopilotPbiTypeaheadProps>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<PbiCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || query.trim().length < 2) return;
    const ac = new AbortController();
    const handle = setTimeout(() => {
      setLoading(true);
      startTransition(async () => {
        try {
          const res = await fetch("/api/copilot/search-pbi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, sprintPath }),
            signal: ac.signal,
          });
          if (!res.ok) {
            setCandidates([]);
            return;
          }
          const data = (await res.json()) as SearchResponse;
          setCandidates((data.candidates ?? []) as PbiCandidate[]);
        } catch {
          // Aborted or network error — ignore.
        } finally {
          if (!ac.signal.aborted) setLoading(false);
        }
      });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(handle);
      ac.abort();
    };
  }, [open, query, sprintPath]);

  const triggerLabel = value
    ? `#${value.id} — ${value.title}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={triggerRef}
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          />
        }
      >
        <span
          className={cn(
            "truncate",
            !value && "text-muted-foreground",
          )}
        >
          {triggerLabel}
        </span>
        <ChevronsUpDown className="text-muted-foreground ml-2 size-4 shrink-0" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        className="w-(--anchor-width) p-0"
        align="start"
        sideOffset={4}
      >
        <div className="border-b p-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => {
                const next = e.target.value;
                setQuery(next);
                if (next.trim().length < 2) setCandidates([]);
              }}
            placeholder="Busca por título o número…"
            className="w-full rounded-sm border bg-transparent px-2 py-1 text-sm outline-none focus:border-ring"
          />
        </div>
        <ResultsList
          loading={loading}
          candidates={candidates}
          query={query}
          selected={value}
          onPick={(candidate) => {
            onChange(candidate);
            setOpen(false);
            setQuery("");
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function ResultsList({
  loading,
  candidates,
  query,
  selected,
  onPick,
}: Readonly<{
  loading: boolean;
  candidates: PbiCandidate[];
  query: string;
  selected: PbiCandidate | null;
  onPick: (candidate: PbiCandidate) => void;
}>) {
  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 px-3 py-3 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Buscando…
      </div>
    );
  }
  if (candidates.length === 0) {
    const message = query.trim().length < 2
      ? "Escribe al menos 2 caracteres."
      : "Sin resultados.";
    return (
      <div className="text-muted-foreground px-3 py-3 text-sm">{message}</div>
    );
  }
  return (
    <ul className="max-h-64 overflow-y-auto p-1" role="listbox">
      {candidates.map((candidate) => {
        const isSelected = selected?.id === candidate.id;
        return (
          <li key={candidate.id} role="option" aria-selected={isSelected}>
            <button
              type="button"
              onClick={() => onPick(candidate)}
              className={cn(
                "hover:bg-muted focus-visible:bg-muted flex w-full flex-col items-start gap-1 rounded-sm px-2 py-2 text-left text-sm",
                isSelected && "bg-muted",
              )}
            >
              <div className="flex w-full items-center gap-2">
                <Badge variant="outline">#{candidate.id}</Badge>
                {candidate.state && (
                  <Badge variant="secondary">{candidate.state}</Badge>
                )}
                {isSelected && (
                  <Check className="text-primary ml-auto size-4" aria-hidden />
                )}
              </div>
              <span className="line-clamp-2 text-sm">{candidate.title}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}