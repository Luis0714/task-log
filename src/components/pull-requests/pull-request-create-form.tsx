"use client";

import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";

import { BranchCompareLoading } from "@/components/git/branch-compare-loading";
import { DefaultRepositoryHint } from "@/components/pull-requests/default-repository-hint";
import { LargeCommitMergeNotice } from "@/components/pull-requests/large-commit-merge-notice";
import { NoChangesToMergeNotice } from "@/components/pull-requests/no-changes-to-merge-notice";
import { PullRequestCreateCompareTabs } from "@/components/pull-requests/pull-request-create-compare-tabs";
import { GitBranchPairPicker } from "@/components/shared/git-branch-pair-picker";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { ProjectTagsField } from "@/components/tags/project-tags-field";
import { PersonPickList } from "@/components/team-members/person-pick-list";
import { ControlledSelectField } from "@/components/time-log/fields/controlled-select-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextarea } from "@/components/ui/rich-textarea-lazy";
import { LinkableWorkItemsField } from "@/components/work-items/linkable-work-items-field";
import { useBranchCompare } from "@/hooks/git/use-branch-compare";
import { useGitBranches } from "@/hooks/git/use-git-branches";
import { useGitRepositories } from "@/hooks/git/use-git-repositories";
import { useCreatePullRequest } from "@/hooks/pull-requests/use-create-pull-request";
import { useSaveDefaultRepository } from "@/hooks/pull-requests/use-save-default-repository";
import { useLinkableWorkItems } from "@/hooks/work-items/use-linkable-work-items";
import { useTeamMembers } from "@/hooks/use-team-members";
import {
  CREATE_PULL_REQUEST_LABEL,
  CREATE_PULL_REQUEST_PENDING_LABEL,
} from "@/lib/pull-requests/copy";
import { isLargeCommitMerge } from "@/lib/pull-requests/compare-branches";
import type { NewPullRequestQuery } from "@/lib/pull-requests/create-query";
import { DEFAULT_TARGET_BRANCH } from "@/lib/pull-requests/mock-git-refs";
import { pickCreateRepository } from "@/lib/pull-requests/pick-create-repository";
import {
  workItemDraftDescription,
  workItemDraftTitle,
} from "@/lib/pull-requests/work-item-draft";
import { isEmptyRichText } from "@/lib/html/html-to-plain-text";
import { addedWorkItemId } from "@/lib/work-items/linkable-work-item-options";

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
  const { create, pending: creating } = useCreatePullRequest();
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

  const repositories = useGitRepositories(project);
  const [repository, setRepository] = useState(
    () => initialQuery.repository || defaultRepository || "",
  );
  const branches = useGitBranches(project, repository);
  const [source, setSource] = useState(initialQuery.source);
  const [target, setTarget] = useState(initialQuery.target || DEFAULT_TARGET_BRANCH);

  useEffect(() => {
    if (repositories.names.length === 0) return;
    if (repositories.names.includes(repository)) return;
    setRepository(
      pickCreateRepository(initialQuery.repository, defaultRepository, repositories.names),
    );
  }, [defaultRepository, initialQuery.repository, repositories.names, repository]);

  useEffect(() => {
    const names = branches.options.map((option) => option.name);
    if (names.length === 0) return;
    const fallbackTarget =
      names.find((name) => name === "develop") ??
      names.find((name) => name === "main") ??
      names.find((name) => name === "master") ??
      names[0] ??
      "";
    if (!source || !names.includes(source)) {
      setSource(names.find((name) => name !== fallbackTarget) ?? names[0] ?? "");
    }
    if (!target || !names.includes(target)) {
      setTarget(fallbackTarget);
    }
  }, [branches.options, source, target]);

  const repositoryOptions = repositories.names.map((value) => ({ value, label: value }));
  const [linkedWorkItemIds, setLinkedWorkItemIds] = useState<string[]>([]);
  const [title, setTitle] = useState(initialQuery.source);
  const [description, setDescription] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [optionalReviewers, setOptionalReviewers] = useState<string[]>([]);
  const [requiredReviewers, setRequiredReviewers] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [autoComplete, setAutoComplete] = useState(false);

  const compare = useBranchCompare({ project, repository, source, target });
  const commits = compare.changeset?.commits ?? [];
  const files = compare.changeset?.files ?? [];
  const sameBranch = Boolean(source && target && source === target);
  const hasChanges = commits.length > 0 || files.length > 0;
  const showLargeCommitWarning = isLargeCommitMerge(commits.length);
  const canSubmit = Boolean(
    project && repository && source && target && title.trim() && hasChanges && !creating,
  );
  const compareQuery = project
    ? { project, repository, source, target }
    : null;

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
      className="flex w-full max-w-3xl flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit || !project) return;
        void create({
          project,
          repository,
          source,
          target,
          title: title.trim(),
          description,
          optionalReviewers,
          requiredReviewers,
          tags,
          linkedWorkItemIds: linkedWorkItemIds.map(Number),
          autoComplete,
        });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <ControlledSelectField
          label="Repositorio"
          required
          value={repository}
          placeholder={
            repositories.loading ? "Cargando repositorios..." : "Selecciona un repositorio"
          }
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
        branches={branches.options}
        source={source}
        target={target}
        onSourceChange={setSource}
        onTargetChange={setTarget}
      />

      {sameBranch ? <NoChangesToMergeNotice /> : null}
      {compare.loading ? <BranchCompareLoading /> : null}
      {compare.error ? (
        <NoticeBanner
          icon={<Info className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />}
        >
          <p>{compare.error}</p>
        </NoticeBanner>
      ) : null}
      {!compare.loading && !compare.error && !sameBranch && compare.changeset && !hasChanges ? (
        <NoChangesToMergeNotice />
      ) : null}

      {hasChanges && compareQuery ? (
        <>
          {showLargeCommitWarning ? (
            <LargeCommitMergeNotice key={`${source}->${target}`} />
          ) : null}

          <PullRequestCreateCompareTabs
            fileCount={files.length}
            commitCount={commits.length}
            commits={commits}
            files={files}
            compareQuery={compareQuery}
            overview={
              <>
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
                      setDescription(html);
                      if (!isEmptyRichText(html)) setDescriptionTouched(true);
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
                    {creating ? CREATE_PULL_REQUEST_PENDING_LABEL : CREATE_PULL_REQUEST_LABEL}
                  </Button>
                </div>
              </>
            }
          />
        </>
      ) : null}
    </form>
  );
}
