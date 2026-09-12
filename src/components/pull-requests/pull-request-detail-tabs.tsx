"use client";

import { ChangesetExplorer } from "@/components/git/changeset-explorer";
import { PullRequestConflictsPanel } from "@/components/pull-requests/pull-request-conflicts-panel";
import { PullRequestDetailOverview } from "@/components/pull-requests/pull-request-detail-overview";
import { PullRequestTabCount } from "@/components/pull-requests/pull-request-tab-count";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PullRequestDetail } from "@/lib/pull-requests/detail-types";

export type PullRequestDetailTabsProps = {
  detail: PullRequestDetail;
};

export function PullRequestDetailTabs({ detail }: PullRequestDetailTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full min-w-0">
      <TabsList variant="line" className="max-w-full flex-wrap">
        <TabsTrigger value="overview">Resumen</TabsTrigger>
        <TabsTrigger value="files">
          Archivos
          <PullRequestTabCount value={detail.files.length} />
        </TabsTrigger>
        <TabsTrigger value="conflicts">
          Conflictos
          <PullRequestTabCount value={detail.conflictedFiles.length} />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="min-w-0 pt-3">
        <PullRequestDetailOverview detail={detail} />
      </TabsContent>
      <TabsContent value="files" className="min-w-0 pt-3">
        <ChangesetExplorer
          files={detail.files}
          query={{
            project: detail.project,
            repository: detail.repository,
            source: detail.compare.source,
            target: detail.compare.target,
          }}
        />
      </TabsContent>
      <TabsContent value="conflicts" className="min-w-0 pt-3">
        <PullRequestConflictsPanel
          hasConflicts={detail.hasConflicts}
          files={detail.conflictedFiles}
        />
      </TabsContent>
    </Tabs>
  );
}
