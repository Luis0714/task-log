import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { BranchCompareLoading } from "@/components/git/branch-compare-loading";
import type { ChangesetExplorerQuery } from "@/components/git/changeset-explorer";
import { LargeCommitMergeNotice } from "@/components/pull-requests/large-commit-merge-notice";
import { NoChangesToMergeNotice } from "@/components/pull-requests/no-changes-to-merge-notice";
import { PullRequestCreateCompareTabs } from "@/components/pull-requests/pull-request-create-compare-tabs";
import { NoticeBanner } from "@/components/shared/notice-banner";
import type { GitCommit, GitFileChange } from "@/lib/git/changeset";

export type PullRequestCreateComparePanelProps = Readonly<{
  sameBranch: boolean;
  loading: boolean;
  error: string | null;
  hasChangeset: boolean;
  hasChanges: boolean;
  showLargeCommitWarning: boolean;
  compareQuery: ChangesetExplorerQuery | null;
  commits: readonly GitCommit[];
  files: readonly GitFileChange[];
  overview: ReactNode;
}>;

function canShowEmptyCompareNotice(props: PullRequestCreateComparePanelProps): boolean {
  return (
    !props.loading &&
    !props.error &&
    !props.sameBranch &&
    props.hasChangeset &&
    !props.hasChanges
  );
}

export function PullRequestCreateComparePanel(props: PullRequestCreateComparePanelProps) {
  const {
    sameBranch,
    loading,
    error,
    hasChanges,
    showLargeCommitWarning,
    compareQuery,
    commits,
    files,
    overview,
  } = props;

  return (
    <>
      {sameBranch ? <NoChangesToMergeNotice /> : null}
      {loading ? <BranchCompareLoading /> : null}
      {error ? (
        <NoticeBanner
          icon={<Info className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />}
        >
          <p>{error}</p>
        </NoticeBanner>
      ) : null}
      {canShowEmptyCompareNotice(props) ? <NoChangesToMergeNotice /> : null}
      {hasChanges && compareQuery ? (
        <>
          {showLargeCommitWarning ? (
            <LargeCommitMergeNotice key={`${compareQuery.source}->${compareQuery.target}`} />
          ) : null}
          <PullRequestCreateCompareTabs
            fileCount={files.length}
            commitCount={commits.length}
            commits={commits}
            files={files}
            compareQuery={compareQuery}
            overview={overview}
          />
        </>
      ) : null}
    </>
  );
}
