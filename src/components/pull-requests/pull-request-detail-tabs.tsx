"use client";

import { PullRequestConflictsPanel } from "@/components/pull-requests/pull-request-conflicts-panel";
import { PullRequestDetailOverview } from "@/components/pull-requests/pull-request-detail-overview";
import { PullRequestFilesPanel } from "@/components/pull-requests/pull-request-files-panel";
import { PullRequestTabCount } from "@/components/pull-requests/pull-request-tab-count";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePullRequestThreads } from "@/hooks/pull-requests/use-pull-request-threads";
import type { PullRequestDetail } from "@/lib/pull-requests/detail-types";

export type PullRequestDetailTabsProps = {
  detail: PullRequestDetail;
};

export function PullRequestDetailTabs({ detail }: PullRequestDetailTabsProps) {
  const threads = usePullRequestThreads({
    project: detail.project,
    repository: detail.repository,
    pullRequestId: detail.id,
  });
  const canComment = detail.lifecycleStatus !== "abandoned";

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
        <PullRequestDetailOverview
          detail={detail}
          generalThreads={threads.generalThreads}
          threadsLoading={threads.loading}
          threadsError={threads.error}
          threadsPending={threads.pending}
          canComment={canComment}
          onCreateComment={(content) => threads.createThread({ content })}
          onReply={threads.reply}
          onStatusChange={threads.setStatus}
        />
      </TabsContent>
      <TabsContent value="files" className="min-w-0 pt-3">
        <PullRequestFilesPanel
          detail={detail}
          threads={threads.threads}
          threadsByLine={threads.threadsByLine}
          pending={threads.pending}
          canComment={canComment}
          onCreate={threads.createThread}
          onReply={threads.reply}
          onStatusChange={threads.setStatus}
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
