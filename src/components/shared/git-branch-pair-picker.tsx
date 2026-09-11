"use client";

import { ArrowLeftRight } from "lucide-react";

import { GitBranchCombobox } from "@/components/shared/git-branch-combobox";
import { Button } from "@/components/ui/button";
import type { GitBranchOption } from "@/lib/git/branch-option";

export type GitBranchPairPickerProps = {
  branches: readonly GitBranchOption[];
  source: string;
  target: string;
  onSourceChange: (name: string) => void;
  onTargetChange: (name: string) => void;
};

export function GitBranchPairPicker({
  branches,
  source,
  target,
  onSourceChange,
  onTargetChange,
}: GitBranchPairPickerProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <GitBranchCombobox
        id="pull-request-source-branch"
        aria-label="Rama origen"
        branches={branches}
        value={source}
        onValueChange={onSourceChange}
        placeholder="Rama origen"
      />
      <span className="text-muted-foreground text-sm">hacia</span>
      <GitBranchCombobox
        id="pull-request-target-branch"
        aria-label="Rama destino"
        branches={branches}
        value={target}
        onValueChange={onTargetChange}
        placeholder="Rama destino"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Intercambiar ramas"
        disabled={!source || !target}
        onClick={() => {
          onSourceChange(target);
          onTargetChange(source);
        }}
      >
        <ArrowLeftRight />
      </Button>
    </div>
  );
}
