"use client";

import { useCallback, useMemo, useState } from "react";

import { appToast } from "@/lib/toast";
import { createSolicitudBodySchema } from "@/lib/schemas/solicitudes";
import { SOLICITUD_ERROR_CODES } from "@/lib/solicitudes/error-codes";
import {
  buildSolicitudTitle,
  computeDurationFromRange,
  computeEndFromDuration,
  computeReintegro,
  resolveAzureHours,
  type TimeUnit,
} from "@/lib/solicitudes/time-calc";
import { createSolicitud } from "@/services/solicitudes/solicitudes.service";
import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";
import { useSolicitudCatalog } from "@/hooks/solicitudes/use-solicitud-catalog";
import type {
  SolicitudNewsStoryOption,
  SolicitudOptions,
} from "@/lib/novedades/solicitud-options";

export type UseSolicitudFormConfig = Readonly<{
  projects: readonly string[];
  defaultProject: string;
  defaultTeam: string;
  currentUserDisplayName: string | null;
  holidayKeys: readonly string[];
  onCreated: (solicitud: SolicitudDto) => void;
}>;

type FormState = {
  team: string;
  newsStoryId: number | null;
  assignedTo: string;
  tipo: string;
  description: string;
  value: string;
  unit: TimeUnit;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  fechaReintegro: string;
  titleValue: string;
  titleEdited: boolean;
};

function initialFormState(): FormState {
  return {
    team: "",
    newsStoryId: null,
    assignedTo: "",
    tipo: "",
    description: "",
    value: "",
    unit: "horas",
    startDate: "",
    startTime: "08:00",
    endDate: "",
    endTime: "08:00",
    fechaReintegro: "",
    titleValue: "",
    titleEdited: false,
  };
}

function resolveInitialProject(config: UseSolicitudFormConfig): string {
  if (config.defaultProject && config.projects.includes(config.defaultProject)) {
    return config.defaultProject;
  }
  return config.projects.length === 1 ? config.projects[0] : "";
}

/** Persona por defecto = usuario logueado; si no está en el roster, el primero. */
function pickDefaultAssignee(
  options: SolicitudOptions | null,
  currentUserDisplayName: string | null,
): string {
  const members = options?.members ?? [];
  if (members.length === 0) return "";
  const me = members.find((member) => member.displayName === currentUserDisplayName);
  return (me ?? members[0]).uniqueName;
}

export function useSolicitudForm(config: UseSolicitudFormConfig) {
  const [project, setProject] = useState(() => resolveInitialProject(config));
  const [state, setState] = useState<FormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const catalog = useSolicitudCatalog(project);
  const options = catalog.options;
  const holidays = useMemo(() => new Set(config.holidayKeys), [config.holidayKeys]);

  // Equipo del scope: se preselecciona el único equipo o, en el proyecto por
  // defecto, el equipo por defecto del catálogo (paridad con /admin/novedades).
  // El estado explícito manda. Sin equipos → HUs a nivel proyecto (teamId nulo).
  const teams = useMemo(() => options?.teams ?? [], [options]);
  const hasTeams = teams.length > 0;
  const autoTeam = useMemo(() => {
    if (teams.length === 1) return teams[0];
    if (
      config.defaultTeam &&
      project === config.defaultProject &&
      teams.includes(config.defaultTeam)
    ) {
      return config.defaultTeam;
    }
    return "";
  }, [teams, project, config.defaultProject, config.defaultTeam]);
  const team = state.team || autoTeam;

  // HUs de novedades filtradas por el equipo elegido: las del equipo más las de
  // nivel proyecto (teamId nulo, aplican a todos). Deduplicadas por HU.
  const newsStories = useMemo(() => {
    const all = options?.newsStories ?? [];
    const scoped = hasTeams
      ? team
        ? all.filter((story) => story.teamId === team || story.teamId === null)
        : []
      : all;
    const seen = new Map<number, SolicitudNewsStoryOption>();
    for (const story of scoped) {
      if (!seen.has(story.workItemId)) seen.set(story.workItemId, story);
    }
    return Array.from(seen.values());
  }, [options, hasTeams, team]);

  // Preselecciones derivadas (sin efectos): HU única (CA-07) y persona por
  // defecto (CA-05). El estado explícito del usuario, cuando existe, manda.
  const autoNewsStoryId = useMemo(
    () => (newsStories.length === 1 ? newsStories[0].workItemId : null),
    [newsStories],
  );
  const autoAssignee = useMemo(
    () => pickDefaultAssignee(options, config.currentUserDisplayName),
    [options, config.currentUserDisplayName],
  );

  const newsStoryId = state.newsStoryId ?? autoNewsStoryId;
  const assignedTo = state.assignedTo || autoAssignee;

  const persona = useMemo(() => {
    const member = options?.members.find((item) => item.uniqueName === assignedTo);
    return member?.displayName ?? config.currentUserDisplayName ?? "";
  }, [options, assignedTo, config.currentUserDisplayName]);

  // Título autogenerado (CA-26), editable: si el usuario lo tocó, se respeta.
  const autoTitle = useMemo(() => {
    if (!state.tipo || !state.startDate) return "";
    return buildSolicitudTitle({ tipo: state.tipo, persona, startDate: state.startDate });
  }, [state.tipo, state.startDate, persona]);
  const title = state.titleEdited ? state.titleValue : autoTitle;

  const recomputeFromDuration = useCallback(
    (next: FormState): FormState => {
      const value = Number(next.value);
      if (!next.startDate || !Number.isFinite(value) || value <= 0) return next;
      const result = computeEndFromDuration({
        startDate: next.startDate,
        startTime: next.startTime,
        value,
        unit: next.unit,
        nonWorkingDates: holidays,
      });
      if (!result.ok) return next;
      const reintegro = computeReintegro(result.endDate, holidays) ?? next.fechaReintegro;
      return { ...next, endDate: result.endDate, endTime: result.endTime, fechaReintegro: reintegro };
    },
    [holidays],
  );

  const recomputeFromRange = useCallback(
    (next: FormState): FormState => {
      if (!next.startDate || !next.endDate) return next;
      const reintegro = computeReintegro(next.endDate, holidays) ?? next.fechaReintegro;
      const result = computeDurationFromRange({
        startDate: next.startDate,
        startTime: next.startTime,
        endDate: next.endDate,
        endTime: next.endTime,
        nonWorkingDates: holidays,
      });
      if (!result.ok) return { ...next, fechaReintegro: reintegro };
      return { ...next, value: String(result.value), unit: result.unit, fechaReintegro: reintegro };
    },
    [holidays],
  );

  // Error inline cuando el tiempo en horas cruza la medianoche (CA-17 MVP).
  const durationError = useMemo(() => {
    if (state.unit !== "horas" || !state.startDate) return null;
    const value = Number(state.value);
    if (!Number.isFinite(value) || value <= 0) return null;
    const result = computeEndFromDuration({
      startDate: state.startDate,
      startTime: state.startTime,
      value,
      unit: "horas",
      nonWorkingDates: holidays,
    });
    return result.ok ? null : SOLICITUD_ERROR_CODES.timeExceedsDay;
  }, [state.unit, state.value, state.startDate, state.startTime, holidays]);

  // Cambiar de proyecto limpia las selecciones dependientes (event handler, no
  // efecto) para no arrastrar equipo/HU/persona/tipo de otro proyecto.
  const changeProject = useCallback((next: string) => {
    setProject(next);
    setState((prev) => ({ ...prev, team: "", newsStoryId: null, assignedTo: "", tipo: "" }));
  }, []);

  // Cambiar de equipo limpia la HU: el catálogo de HUs depende del equipo.
  const changeTeam = useCallback((next: string) => {
    setState((prev) => ({ ...prev, team: next, newsStoryId: null }));
  }, []);

  const fields = useMemo(
    () => ({
      setNewsStoryId: (id: number) => setState((s) => ({ ...s, newsStoryId: id })),
      setAssignedTo: (uniqueName: string) => setState((s) => ({ ...s, assignedTo: uniqueName })),
      setTipo: (tipo: string) => setState((s) => ({ ...s, tipo })),
      setDescription: (description: string) => setState((s) => ({ ...s, description })),
      setValue: (value: string) => setState((s) => recomputeFromDuration({ ...s, value })),
      setUnit: (unit: TimeUnit) => setState((s) => recomputeFromDuration({ ...s, unit })),
      setStartDate: (startDate: string) => setState((s) => recomputeFromDuration({ ...s, startDate })),
      setStartTime: (startTime: string) => setState((s) => recomputeFromDuration({ ...s, startTime })),
      setEndDate: (endDate: string) => setState((s) => recomputeFromRange({ ...s, endDate })),
      setEndTime: (endTime: string) => setState((s) => recomputeFromRange({ ...s, endTime })),
      setReintegro: (fechaReintegro: string) => setState((s) => ({ ...s, fechaReintegro })),
      setTitle: (value: string) => setState((s) => ({ ...s, titleValue: value, titleEdited: true })),
    }),
    [recomputeFromDuration, recomputeFromRange],
  );

  const values = {
    newsStoryId,
    assignedTo,
    tipo: state.tipo,
    description: state.description,
    value: state.value,
    unit: state.unit,
    startDate: state.startDate,
    startTime: state.startTime,
    endDate: state.endDate,
    endTime: state.endTime,
    fechaReintegro: state.fechaReintegro,
  } as const;

  // Solo declaramos "sin HUs" una vez resuelto el contexto de equipo (equipo
  // elegido, o proyecto sin equipos); antes de eso el selector de HU va vacío.
  const teamResolved = !hasTeams || Boolean(team);
  const noNewsStories = options !== null && teamResolved && newsStories.length === 0;

  const canSubmit =
    !submitting &&
    !noNewsStories &&
    !durationError &&
    Boolean(project) &&
    (!hasTeams || Boolean(team)) &&
    newsStoryId !== null &&
    Boolean(assignedTo) &&
    Boolean(state.tipo) &&
    Number(state.value) > 0 &&
    Boolean(state.startDate) &&
    Boolean(state.endDate) &&
    Boolean(state.fechaReintegro) &&
    title.trim().length > 0;

  const submit = useCallback(async (): Promise<boolean> => {
    setFormError(null);
    const body = {
      project,
      team: hasTeams ? team : null,
      newsStoryId: newsStoryId ?? 0,
      assignedTo,
      tipo: state.tipo,
      description: state.description || undefined,
      value: Number(state.value),
      unit: state.unit,
      startDate: state.startDate,
      startTime: state.startTime,
      endDate: state.endDate,
      endTime: state.endTime,
      fechaReintegro: state.fechaReintegro,
      title: title.trim(),
    };

    const parsed = createSolicitudBodySchema.safeParse(body);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? SOLICITUD_ERROR_CODES.titleRequired);
      return false;
    }

    setSubmitting(true);
    try {
      const response = await createSolicitud(parsed.data);
      appToast.success("Solicitud creada", {
        description: `Novedad #${response.workItemId} creada en Azure DevOps.`,
      });
      config.onCreated({
        id: response.workItemId,
        title: parsed.data.title,
        tipo: parsed.data.tipo,
        assignedTo: persona || null,
        fechaInicio: parsed.data.startDate,
        fechaFin: parsed.data.endDate,
        fechaReintegro: parsed.data.fechaReintegro,
        hours: resolveAzureHours(parsed.data.value, parsed.data.unit),
        state: "",
        url: response.url,
      });
      return true;
    } catch (cause) {
      appToast.error("No se pudo crear la solicitud", {
        description: cause instanceof Error ? cause.message : undefined,
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [project, team, hasTeams, newsStoryId, assignedTo, state, title, persona, config]);

  return {
    project,
    setProject: changeProject,
    team,
    setTeam: changeTeam,
    teams,
    hasTeams,
    newsStories,
    catalog,
    values,
    fields,
    title,
    persona,
    durationError,
    noNewsStories,
    formError,
    submitting,
    canSubmit,
    submit,
  };
}
