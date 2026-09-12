"use client";

import type { ReactNode } from "react";

import {
  ChangesetExplorer,
  type ChangesetExplorerQuery,
} from "@/components/git/changeset-explorer";
import { CommitList } from "@/components/git/commit-list";
import { PullRequestTabCount } from "@/components/pull-requests/pull-request-tab-count";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GitCommit, GitFileChange } from "@/lib/git/changeset";

export type PullRequestCreateCompareTabsProps = Readonly<{
  fileCount: number;
  commitCount: number;
  commits: readonly GitCommit[];
  files: readonly GitFileChange[];
  compareQuery: ChangesetExplorerQuery;
  overview: ReactNode;
}>;

export function PullRequestCreateCompareTabs({
  fileCount,
  commitCount,
  commits,
  files,
  compareQuery,
  overview,
}: PullRequestCreateCompareTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full min-w-0">
      <TabsList variant="line">
        <TabsTrigger value="overview">Resumen</TabsTrigger>
        <TabsTrigger value="files">
          Archivos
          <PullRequestTabCount value={fileCount} />
        </TabsTrigger>
        <TabsTrigger value="commits">
          Commits
          <PullRequestTabCount value={commitCount} />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="flex flex-col gap-5 pt-2">
        {overview}
      </TabsContent>
      <TabsContent value="files" className="min-w-0 pt-2">
        <ChangesetExplorer files={files} query={compareQuery} />
      </TabsContent>
      <TabsContent value="commits" className="min-w-0 pt-2">
        <CommitList commits={commits} />
      </TabsContent>
    </Tabs>
  );
}
