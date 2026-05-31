"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { AdoTaskStateDto, AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";
import {
  areSprintStoryGoalDraftsEqual,
  countSprintStoryGoals,
  filterSprintStoryGoalRows,
  isSprintStoryGoalDraftValid,
  normalizeSprintStoryGoalDraftForSave,
  sprintStoryGoalDraftValidationMessage,
  type SprintStoryGoalDraft,
  type SprintStoryGoalRowModel,
} from "@/lib/sprints/sprint-story-goal";
import {
  DEFAULT_SPRINT_STORY_GOAL_SORT,
  sortSprintStoryGoalRows,
  type SprintStoryGoalSortField,
} from "@/lib/sprints/sort-sprint-story-goal-rows";
import type { DataTableSortSpec } from "@/lib/data-table/data-table-sort";
import {
  fetchSprintGoalScreen,
  saveSprintStoryGoals,
  type SprintGoalScreenQuery,
} from "@/services/sprints/sprint-story-goals.service";

export type UseSprintGoalEditorOptions = SprintGoalScreenQuery & {
  enabled?: boolean;
};

export type UseSprintGoalEditorResult = {
  rows: SprintStoryGoalRowModel[];
  filteredRows: SprintStoryGoalRowModel[];
  displayRows: SprintStoryGoalRowModel[];
  storySearch: string;
  setStorySearch: (value: string) => void;
  sortSpec: DataTableSortSpec<SprintStoryGoalSortField>;
  setSortSpec: (value: DataTableSortSpec<SprintStoryGoalSortField>) => void;
  drafts: SprintStoryGoalDraft[];
  backlogStates: AdoTaskStateDto[];
  catalogTags: AdoWorkItemTagDto[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  persistenceReady: boolean;
  isDirty: boolean;
  canSave: boolean;
  goalsCount: number;
  updateDraft: (workItemId: number, patch: Partial<Omit<SprintStoryGoalDraft, "workItemId">>) => void;
  discardChanges: () => void;
  save: () => Promise<{ ok: true } | { ok: false; message: string }>;
  reload: () => void;
  getRowValidationMessage: (workItemId: number) => string | null;
};

function draftsFromRows(rows: readonly SprintStoryGoalRowModel[]): SprintStoryGoalDraft[] {
  return rows.map((row) => ({ ...row.draft }));
}

export function useSprintGoalEditor({
  project,
  team,
  sprintPath,
  enabled = true,
}: UseSprintGoalEditorOptions): UseSprintGoalEditorResult {
  const [rows, setRows] = useState<SprintStoryGoalRowModel[]>([]);
  const [drafts, setDrafts] = useState<SprintStoryGoalDraft[]>([]);
  const [initialDrafts, setInitialDrafts] = useState<SprintStoryGoalDraft[]>([]);
  const [backlogStates, setBacklogStates] = useState<AdoTaskStateDto[]>([]);
  const [catalogTags, setCatalogTags] = useState<AdoWorkItemTagDto[]>([]);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const [loading, setLoading] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storySearch, setStorySearch] = useState("");
  const [sortSpec, setSortSpec] = useState(DEFAULT_SPRINT_STORY_GOAL_SORT);
  const [reloadToken, setReloadToken] = useState(0);

  const query = useMemo(
    () => ({ project: project.trim(), team: team.trim(), sprintPath: sprintPath.trim() }),
    [project, team, sprintPath],
  );

  const queryReady = Boolean(query.project && query.team && query.sprintPath);

  useEffect(() => {
    if (!enabled || !queryReady) {
      setRows([]);
      setDrafts([]);
      setInitialDrafts([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void fetchSprintGoalScreen(query, controller.signal)
      .then((snapshot) => {
        if (controller.signal.aborted) return;
        const nextDrafts = draftsFromRows(snapshot.rows);
        setRows(snapshot.rows);
        setDrafts(nextDrafts);
        setInitialDrafts(nextDrafts);
        setBacklogStates(snapshot.backlogStates);
        setCatalogTags(snapshot.catalogTags);
        setPersistenceReady(snapshot.persistenceReady);
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setRows([]);
        setDrafts([]);
        setInitialDrafts([]);
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudo cargar la pantalla de objetivos.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [enabled, query, queryReady, reloadToken]);

  useEffect(() => {
    setStorySearch("");
    setSortSpec(DEFAULT_SPRINT_STORY_GOAL_SORT);
  }, [query.project, query.team, query.sprintPath]);

  const filteredRows = useMemo(
    () => filterSprintStoryGoalRows(rows, storySearch),
    [rows, storySearch],
  );

  const displayRows = useMemo(
    () => sortSprintStoryGoalRows(filteredRows, sortSpec),
    [filteredRows, sortSpec],
  );

  const draftByWorkItemId = useMemo(
    () => new Map(drafts.map((draft) => [draft.workItemId, draft])),
    [drafts],
  );

  const isDirty = useMemo(() => {
    const initialById = new Map(initialDrafts.map((draft) => [draft.workItemId, draft]));
    return drafts.some((draft) => {
      const initial = initialById.get(draft.workItemId);
      return !initial || !areSprintStoryGoalDraftsEqual(draft, initial);
    });
  }, [drafts, initialDrafts]);

  const invalidDraft = useMemo(
    () =>
      drafts.find((draft) => draft.includedInGoal && !isSprintStoryGoalDraftValid(draft)) ?? null,
    [drafts],
  );

  const canSave = isDirty && !invalidDraft && persistenceReady && !loading && !saving;

  const goalsCount = useMemo(() => countSprintStoryGoals(drafts), [drafts]);

  const updateDraft = useCallback(
    (workItemId: number, patch: Partial<Omit<SprintStoryGoalDraft, "workItemId">>) => {
      setDrafts((current) =>
        current.map((draft) =>
          draft.workItemId === workItemId ? { ...draft, ...patch } : draft,
        ),
      );
    },
    [],
  );

  const discardChanges = useCallback(() => {
    setDrafts(initialDrafts.map((draft) => ({ ...draft })));
  }, [initialDrafts]);

  const getRowValidationMessage = useCallback(
    (workItemId: number) => {
      const draft = draftByWorkItemId.get(workItemId);
      if (!draft || !draft.includedInGoal) return null;
      return sprintStoryGoalDraftValidationMessage(draft);
    },
    [draftByWorkItemId],
  );

  const save = useCallback(async (): Promise<
    { ok: true } | { ok: false; message: string }
  > => {
    if (!canSave) {
      return { ok: false, message: "No hay cambios válidos para guardar." };
    }

    setSaving(true);
    try {
      const goals = drafts
        .map(normalizeSprintStoryGoalDraftForSave)
        .filter((goal): goal is NonNullable<typeof goal> => goal !== null);

      const result = await saveSprintStoryGoals({
        ...query,
        goals,
      });

      if (!result.ok) {
        return { ok: false, message: result.errorMessage };
      }

      setInitialDrafts(drafts.map((draft) => ({ ...draft })));
      return { ok: true };
    } finally {
      setSaving(false);
    }
  }, [canSave, drafts, query]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return {
    rows,
    filteredRows,
    displayRows,
    storySearch,
    setStorySearch,
    sortSpec,
    setSortSpec,
    drafts,
    backlogStates,
    catalogTags,
    loading,
    saving,
    error,
    persistenceReady,
    isDirty,
    canSave,
    goalsCount,
    updateDraft,
    discardChanges,
    save,
    reload,
    getRowValidationMessage,
  };
}
