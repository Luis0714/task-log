"use client";

import { useMemo, useState } from "react";

import { DefaultRepositoryHint } from "@/components/pull-requests/default-repository-hint";
import { LargeCommitMergeNotice } from "@/components/pull-requests/large-commit-merge-notice";
import { NoChangesToMergeNotice } from "@/components/pull-requests/no-changes-to-merge-notice";
import { GitBranchPairPicker } from "@/components/shared/git-branch-pair-picker";
import { ProjectTagsField } from "@/components/tags/project-tags-field";
import { PersonPickList } from "@/components/team-members/person-pick-list";
import { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextarea } from "@/components/ui/rich-textarea-lazy";
import { LinkableWorkItemsField } from "@/components/work-items/linkable-work-items-field";
import { useSaveDefaultRepository } from "@/hooks/pull-requests/use-save-default-repository";
import { useLinkableWorkItems } from "@/hooks/work-items/use-linkable-work-items";
import { useTeamMembers } from "@/hooks/use-team-members";
import {
  CREATE_PULL_REQUEST_LABEL,
  CREATE_PULL_REQUEST_MOCK_TOAST,
} from "@/lib/pull-requests/copy";
import {
  compareBranchesMock,
  LARGE_COMMIT_THRESHOLD,
} from "@/lib/pull-requests/compare-branches";
import type { NewPullRequestQuery } from "@/lib/pull-requests/create-query";
import {
  DEFAULT_TARGET_BRANCH,
  MOCK_GIT_BRANCH_OPTIONS,
  MOCK_GIT_REPOSITORIES,
} from "@/lib/pull-requests/mock-git-refs";
import { pickCreateRepository } from "@/lib/pull-requests/pick-create-repository";
import {
  workItemDraftDescription,
  workItemDraftTitle,
} from "@/lib/pull-requests/work-item-draft";
import { addedWorkItemId } from "@/lib/work-items/linkable-work-item-options";
import { appToast } from "@/lib/toast";

const repositoryOptions = MOCK_GIT_REPOSITORIES.map((value) => ({ value, label: value }));

export type PullRequestCreateFormProps = {
  initialQuery: NewPullRequestQuery;
  defaultRepository: string | null;
  project: string | null;
  team: string | null;
};

export function PullRequestCreateForm({
  initialQuery,
  defaultRepository,
  project,
  team,
}: PullRequestCreateFormProps) {
  const { saveDefaultRepository, saveDefaultRepositoryPending } = useSaveDefaultRepository();
  const people = useTeamMembers({
    project,
    team,
    enabled: Boolean(project && team),
  });
  const [includeBacklog, setIncludeBacklog] = useState(false);
  const linkableWorkItems = useLinkableWorkItems({
    project,
    team,
    includeBacklog,
  });

  const [repository, setRepository] = useState(() =>
    pickCreateRepository(initialQuery.repository, defaultRepository, MOCK_GIT_REPOSITORIES),
  );
  const [source, setSource] = useState(initialQuery.source);
  const [target, setTarget] = useState(initialQuery.target || DEFAULT_TARGET_BRANCH);
  const [linkedWorkItemIds, setLinkedWorkItemIds] = useState<string[]>([]);
  const [title, setTitle] = useState(initialQuery.source);
  const [description, setDescription] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [optionalReviewers, setOptionalReviewers] = useState<string[]>([]);
  const [requiredReviewers, setRequiredReviewers] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [autoComplete, setAutoComplete] = useState(false);

  const comparison = compareBranchesMock({ repository, source, target });
  const hasChanges = comparison?.hasChanges ?? false;
  const showLargeCommitWarning = Boolean(
    comparison && comparison.hasChanges && comparison.aheadCount >= LARGE_COMMIT_THRESHOLD,
  );
  const canSubmit = Boolean(repository && source && target && title.trim() && hasChanges);

  const reviewerMembers = useMemo(() => people.members, [people.members]);

  function handleLinkedWorkItemsChange(nextIds: string[]) {
    const addedId = addedWorkItemId(linkedWorkItemIds, nextIds);
    setLinkedWorkItemIds(nextIds);
    if (!addedId) return;

    const item = linkableWorkItems.items.find((entry) => String(entry.id) === addedId);
    if (!item) return;

    if (!titleTouched) setTitle(workItemDraftTitle(item));
    if (!descriptionTouched) setDescription(workItemDraftDescription(item));
  }

  return (
    <form
      className="flex max-w-2xl flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        appToast.info(CREATE_PULL_REQUEST_MOCK_TOAST);
      }}
    >
      <div className="flex flex-col gap-1.5">
        <ControlledSelectField
          label="Repositorio"
          required
          value={repository}
          placeholder="Selecciona un repositorio"
          options={repositoryOptions}
          onValueChange={setRepository}
        />
        <DefaultRepositoryHint
          repository={repository}
          defaultRepository={defaultRepository}
          pending={saveDefaultRepositoryPending}
          onSave={saveDefaultRepository}
        />
      </div>

      <GitBranchPairPicker
        branches={MOCK_GIT_BRANCH_OPTIONS}
        source={source}
        target={target}
        onSourceChange={setSource}
        onTargetChange={setTarget}
      />

      {comparison && !comparison.hasChanges ? <NoChangesToMergeNotice /> : null}
      {showLargeCommitWarning ? (
        <LargeCommitMergeNotice key={`${source}->${target}`} />
      ) : null}

      <LinkableWorkItemsField
        items={linkableWorkItems.items}
        value={linkedWorkItemIds}
        includeBacklog={includeBacklog}
        loading={linkableWorkItems.loading}
        error={linkableWorkItems.error}
        onChange={handleLinkedWorkItemsChange}
        onIncludeBacklogChange={setIncludeBacklog}
      />

      <div className="flex flex-col gap-1.5">
        <Label required htmlFor="pull-request-title">
          Título
        </Label>
        <Input
          id="pull-request-title"
          value={title}
          onChange={(event) => {
            setTitleTouched(true);
            setTitle(event.target.value);
          }}
          placeholder="Título del pull request"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pull-request-description">Descripción</Label>
        <RichTextarea
          value={description}
          placeholder="Describe el código que se va a revisar"
          onChange={(html) => {
            setDescriptionTouched(true);
            setDescription(html);
          }}
        />
      </div>

      <PersonPickList
        id="optional-reviewers"
        label="Revisores opcionales"
        placeholder="Buscar para añadir"
        members={reviewerMembers}
        selectedIds={optionalReviewers}
        loading={people.loading}
        onChange={setOptionalReviewers}
      />
      <PersonPickList
        id="required-reviewers"
        label="Revisores requeridos"
        placeholder="Buscar para añadir"
        members={reviewerMembers}
        selectedIds={requiredReviewers}
        loading={people.loading}
        onChange={setRequiredReviewers}
      />

      <ProjectTagsField
        project={project}
        value={tags}
        onChange={setTags}
        label="Tags"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={autoComplete}
            onCheckedChange={(checked) => setAutoComplete(checked === true)}
          />
          Completar automáticamente al aprobar
        </label>
        <Button type="submit" disabled={!canSubmit}>
          {CREATE_PULL_REQUEST_LABEL}
        </Button>
      </div>
    </form>
  );
}
