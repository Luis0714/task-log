"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";

import { GitBranchInto } from "@/components/shared/git-branch-into";
import { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
import { NoChangesToMergeNotice } from "@/components/pull-requests/no-changes-to-merge-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CREATE_PULL_REQUEST_LABEL, CREATE_PULL_REQUEST_MOCK_TOAST } from "@/lib/pull-requests/copy";
import { compareBranchesMock } from "@/lib/pull-requests/compare-branches";
import type { NewPullRequestQuery } from "@/lib/pull-requests/create-query";
import {
  DEFAULT_TARGET_BRANCH,
  MOCK_GIT_BRANCHES,
  MOCK_GIT_REPOSITORIES,
} from "@/lib/pull-requests/mock-git-refs";
import { appToast } from "@/lib/toast";

const branchOptions = MOCK_GIT_BRANCHES.map((value) => ({ value, label: value }));
const repositoryOptions = MOCK_GIT_REPOSITORIES.map((value) => ({ value, label: value }));

export type PullRequestCreateFormProps = {
  initialQuery: NewPullRequestQuery;
};

export function PullRequestCreateForm({ initialQuery }: PullRequestCreateFormProps) {
  const [repository, setRepository] = useState(
    initialQuery.repository || MOCK_GIT_REPOSITORIES[0] || "",
  );
  const [source, setSource] = useState(initialQuery.source);
  const [target, setTarget] = useState(initialQuery.target || DEFAULT_TARGET_BRANCH);
  const [title, setTitle] = useState(initialQuery.source);
  const [description, setDescription] = useState("");

  const comparison = compareBranchesMock({ repository, source, target });
  const hasChanges = comparison?.hasChanges ?? false;
  const canSubmit = Boolean(repository && source && target && title.trim() && hasChanges);

  return (
    <form
      className="flex max-w-xl flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        appToast.info(CREATE_PULL_REQUEST_MOCK_TOAST);
      }}
    >
      {source && target ? <GitBranchInto source={source} target={target} /> : null}

      <ControlledSelectField
        label="Repositorio"
        required
        value={repository}
        placeholder="Selecciona un repositorio"
        options={repositoryOptions}
        onValueChange={setRepository}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <ControlledSelectField
            label="Rama origen"
            required
            value={source}
            placeholder="Selecciona la rama origen"
            options={branchOptions}
            onValueChange={setSource}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden sm:inline-flex"
          aria-label="Intercambiar ramas"
          disabled={!source || !target}
          onClick={() => {
            setSource(target);
            setTarget(source);
          }}
        >
          <ArrowLeftRight />
        </Button>
        <div className="min-w-0 flex-1">
          <ControlledSelectField
            label="Rama destino"
            required
            value={target}
            placeholder="Selecciona la rama destino"
            options={branchOptions}
            onValueChange={setTarget}
          />
        </div>
      </div>

      {comparison && !comparison.hasChanges ? <NoChangesToMergeNotice /> : null}

      <div className="flex flex-col gap-1.5">
        <Label required htmlFor="pull-request-title">
          Título
        </Label>
        <Input
          id="pull-request-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Título del pull request"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pull-request-description">Descripción</Label>
        <Textarea
          id="pull-request-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe el cambio (maqueta)"
        />
      </div>

      <Button type="submit" disabled={!canSubmit} className="self-start">
        {CREATE_PULL_REQUEST_LABEL}
      </Button>
    </form>
  );
}
