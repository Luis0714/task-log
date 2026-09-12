"use client";

import type { ReactNode } from "react";

import { PullRequestComparePanelPlaceholder } from "@/components/pull-requests/pull-request-compare-panel-placeholder";
import { PullRequestTabCount } from "@/components/pull-requests/pull-request-tab-count";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type PullRequestCreateCompareTabsProps = {
  fileCount: number;
  commitCount: number;
  overview: ReactNode;
};

export function PullRequestCreateCompareTabs({
  fileCount,
  commitCount,
  overview,
}: PullRequestCreateCompareTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
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
      <TabsContent value="files" className="pt-2">
        <PullRequestComparePanelPlaceholder
          title="Archivos"
          description="El diff de archivos se mostrará aquí. Se reutilizará en el detalle del pull request."
        />
      </TabsContent>
      <TabsContent value="commits" className="pt-2">
        <PullRequestComparePanelPlaceholder
          title="Commits"
          description="La lista de commits se mostrará aquí. Se reutilizará en el detalle del pull request."
        />
      </TabsContent>
    </Tabs>
  );
}
