"use client";

import { useCallback, useMemo, useState } from "react";

import { appToast } from "@/lib/toast";
import { createSolicitudBodySchema } from "@/lib/schemas/solicitudes";
import { SOLICITUD_ERROR_CODES } from "@/lib/solicitudes/error-codes";
import {
  buildSolicitudDescription,
  buildSolicitudTitle,
  computeEndFromDuration,
  computeReintegro,
  resolveAzureHours,
  type TimeUnit,
} from "@/lib/solicitudes/time-calc";
import {
  createSolicitud,
  updateSolicitud,
} from "@/services/solicitudes/solicitudes.service";
import type { SolicitudDto } from "@/lib/novedades/list-my-solicitudes";
import { useSolicitudCatalog } from "@/hooks/solicitudes/use-solicitud-catalog";
import { stripHtmlTags } from "@/lib/html/strip-html-tags";
import type {
  SolicitudNewsStoryOption,
} from "@/lib/novedades/solicitud-options";

export type SolicitudFormMode = "create" | "edit";

export type UseSolicitudFormConfig = Readonly<{
  /** `create` deja el form en blanco; `edit` lo precarga desde `initialSolicitud`. */
  mode?: SolicitudFormMode;
  projects: readonly string[];
  defaultProject: string;
  defaultTeam: string;
  currentUserDisplayName: string | null;
  holidayKeys: readonly string[];
  initialSolicitud?: SolicitudDto;
  /** Notifica al shell tras crear/editar correctamente. */
  onSaved: (solicitud: SolicitudDto) => void;
}>;

type FormState = {
  team: string;
  newsStoryId: number | null;
  assignedTo: string;
  tipo: string;
  description: string;
  descriptionEdited: boolean;
  value: string;
  unit: TimeUnit;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  fechaReintegro: string;
  reintegroTime: string;
  /** Estado actual del work item (solo relevante en edición). */
  state: string;
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
    descriptionEdited: false,
    value: "",
    unit: "horas",
    startDate: "",
    startTime: "08:00",
    endDate: "",
    endTime: "08:00",
    fechaReintegro: "",
    reintegroTime: "08:00",
    state: "",
    titleValue: "",
    titleEdited: false,
  };
}

/** Construye el estado inicial del form en modo edición a partir del DTO.
 * El proyecto por defecto lo inyecta el shell (todas las solicitudes
 * listadas pertenecen al proyecto activo del usuario). El equipo se deriva
 * luego del `teamId` de la HU padre, una vez el catálogo carga. */
function editInitialState(
  solicitud: SolicitudDto,
  defaultProject: string,
): { state: FormState; project: string } {
  const startTime = solicitud.fechaInicioHora?.trim() || "08:00";
  const endTime = solicitud.fechaFinHora?.trim() || "08:00";
  const reintegroTime = solicitud.fechaReintegroHora?.trim() || endTime;
  return {
    project: defaultProject,
    state: {
      team: "",
      newsStoryId: solicitud.parentId,
      // displayName; se traduce a uniqueName cuando llegue el roster.
      assignedTo: solicitud.assignedTo ?? "",
      tipo: solicitud.tipo ?? "",
      description: solicitud.description ?? "",
      descriptionEdited: Boolean(solicitud.description),
      value:
        solicitud.hours !== null && Number.isFinite(solicitud.hours)
          ? String(solicitud.hours)
          : "",
      unit: "horas",
      startDate: solicitud.fechaInicio ?? "",
      startTime,
      endDate: solicitud.fechaFin ?? "",
      endTime,
      fechaReintegro: solicitud.fechaReintegro ?? "",
      reintegroTime,
      state: solicitud.state ?? "",
      titleValue: solicitud.title,
      titleEdited: true,
    },
  };
}

function resolveInitialProject(config: UseSolicitudFormConfig): string {
  if (config.defaultProject && config.projects.includes(config.defaultProject)) {
    return config.defaultProject;
  }
  return config.projects.length === 1 ? config.projects[0] : "";
}

/** HUs visibles según el contexto de equipo: sin equipos, todas; con equipos
 * pero sin equipo elegido, ninguna; con equipo, las suyas más las de nivel
 * proyecto (teamId nulo, aplican a todos). */
function scopeNewsStoriesByTeam(
  all: readonly SolicitudNewsStoryOption[],
  hasTeams: boolean,
  team: string,
): readonly SolicitudNewsStoryOption[] {
  if (!hasTeams) return all;
  if (!team) return [];
  return all.filter((story) => story.teamId === team || story.teamId === null);
}

/** Persona por defecto = usuario logueado; si no está en el roster, el primero. */
function pickDefaultAssignee(
  members: readonly { uniqueName: string; displayName: string }[],
  currentUserDisplayName: string | null,
): string {
  if (members.length === 0) return "";
  const me = members.find((member) => member.displayName === currentUserDisplayName);
  return (me ?? members[0]).uniqueName;
}

export function useSolicitudForm(config: UseSolicitudFormConfig) {
  const initial = useMemo(() => {
    if (config.mode === "edit" && config.initialSolicitud) {
      return editInitialState(config.initialSolicitud, config.defaultProject);
    }
    return { state: initialFormState(), project: resolveInitialProject(config) };
  }, [config]);

  const [project, setProject] = useState(initial.project);
  const [state, setState] = useState<FormState>(initial.state);
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
  // En modo edición también incluimos el padre actual aunque no encaje con el
  // equipo (p. ej. mientras `team` aún se está derivando del catálogo) para que
  // el `<select>` pueda mostrar el título y no solo el ID.
  const newsStories = useMemo(() => {
    const all = options?.newsStories ?? [];
    const scoped = scopeNewsStoriesByTeam(all, hasTeams, team);
    const seen = new Map<number, SolicitudNewsStoryOption>();
    for (const story of scoped) {
      if (!seen.has(story.workItemId)) seen.set(story.workItemId, story);
    }
    if (config.mode === "edit" && config.initialSolicitud?.parentId !== null && config.initialSolicitud) {
      const parentId = config.initialSolicitud.parentId;
      if (parentId !== null && !seen.has(parentId)) {
        const parentInAll = all.find((story) => story.workItemId === parentId);
        if (parentInAll) seen.set(parentId, parentInAll);
      }
    }
    return Array.from(seen.values());
  }, [options, hasTeams, team, config.mode, config.initialSolicitud]);

  // Miembros filtrados por el equipo elegido: en proyectos con equipos, el
  // dropdown "Persona asignada" muestra solo los miembros del equipo activo
  // (mismo criterio que el resto de pantallas). Sin equipos o sin equipo
  // elegido, expone TODOS el roster del proyecto.
  const teamScopedMembers = useMemo(() => {
    const all = options?.members ?? [];
    if (!hasTeams || !team) return all;
    return all.filter((member) => member.teamNames.includes(team));
  }, [options, hasTeams, team]);

  // Preselecciones derivadas (sin efectos): HU única (CA-07) y persona por
  // defecto (CA-05). El estado explícito del usuario, cuando existe, manda.
  const autoNewsStoryId = useMemo(
    () => (newsStories.length === 1 ? newsStories[0].workItemId : null),
    [newsStories],
  );
  const autoAssignee = useMemo(
    () => pickDefaultAssignee(teamScopedMembers, config.currentUserDisplayName),
    [teamScopedMembers, config.currentUserDisplayName],
  );

  const newsStoryId = state.newsStoryId ?? autoNewsStoryId;
  const assignedTo = state.assignedTo || autoAssignee;

  const persona = useMemo(() => {
    const member = (options?.members ?? []).find((item) => item.uniqueName === assignedTo);
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

  // El campo "Tiempo" es la fuente de verdad del tiempo de la novedad.
  // Cambiar `endDate`/`endTime` solo refresca el reintegro (que sí depende del
  // fin); NO recalcula `value`/`unit`, porque eso pisaba lo que el usuario
  // puso (p. ej. "1 día" se convertía en 2 días al estirar la fecha fin).
  const recomputeFromRange = useCallback(
    (next: FormState): FormState => {
      if (!next.endDate) return next;
      const reintegro = computeReintegro(next.endDate, holidays) ?? next.fechaReintegro;
      return { ...next, fechaReintegro: reintegro };
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

  // Cambiar de equipo limpia la HU y, si la persona asignada no está en el
  // nuevo equipo, también la limpia. El catálogo de HUs y el de miembros
  // dependen del equipo.
  const changeTeam = useCallback(
    (next: string) => {
      setState((prev) => {
        const allMembers = options?.members ?? [];
        const stillValid =
          !next || !hasTeams || allMembers.length === 0
            ? true
            : allMembers.some(
                (member) =>
                  member.uniqueName === prev.assignedTo &&
                  member.teamNames.includes(next),
              );
        return {
          ...prev,
          team: next,
          newsStoryId: null,
          ...(stillValid ? {} : { assignedTo: "" }),
        };
      });
    },
    [options, hasTeams],
  );

  const fields = useMemo(
    () => ({
      setNewsStoryId: (id: number) => setState((s) => ({ ...s, newsStoryId: id })),
      setAssignedTo: (uniqueName: string) => setState((s) => ({ ...s, assignedTo: uniqueName })),
      setTipo: (tipo: string) => setState((s) => ({ ...s, tipo })),
      setDescription: (description: string) =>
        // El editor dispara `onUpdate` una vez al montarse con el contenido
        // inicial vacío (`<p></p>` o similar). Si aceptamos eso como edición
        // manual, `descriptionEdited` se queda en `true` desde el arranque y
        // la auto-generación no se vuelve a aplicar cuando el usuario llena
        // los demás campos. Ignoramos las actualizaciones cuyo texto plano
        // siga vacío, así solo marca como edición lo que el usuario tecleó.
        setState((s) => {
          const stripped = stripHtmlTags(description).trim();
          if (!stripped) return s;
          return { ...s, description, descriptionEdited: true };
        }),
      setValue: (value: string) => setState((s) => recomputeFromDuration({ ...s, value })),
      setUnit: (unit: TimeUnit) => setState((s) => recomputeFromDuration({ ...s, unit })),
      setStartDate: (startDate: string) => setState((s) => recomputeFromDuration({ ...s, startDate })),
      setStartTime: (startTime: string) => setState((s) => recomputeFromDuration({ ...s, startTime })),
      setEndDate: (endDate: string) => setState((s) => recomputeFromRange({ ...s, endDate })),
      setEndTime: (endTime: string) => setState((s) => recomputeFromRange({ ...s, endTime })),
      setReintegro: (fechaReintegro: string) => setState((s) => ({ ...s, fechaReintegro })),
      setReintegroTime: (reintegroTime: string) => setState((s) => ({ ...s, reintegroTime })),
      setState: (value: string) => setState((s) => ({ ...s, state: value })),
      setTitle: (value: string) => setState((s) => ({ ...s, titleValue: value, titleEdited: true })),
    }),
    [recomputeFromDuration, recomputeFromRange],
  );

  const values = {
    newsStoryId,
    assignedTo,
    tipo: state.tipo,
    description: state.descriptionEdited
      ? state.description
      : buildSolicitudDescription({
          tipo: state.tipo,
          persona,
          startDate: state.startDate,
          startTime: state.startTime,
          endDate: state.endDate,
          endTime: state.endTime,
          fechaReintegro: state.fechaReintegro,
          reintegroTime: state.reintegroTime,
        }),
    value: state.value,
    unit: state.unit,
    startDate: state.startDate,
    startTime: state.startTime,
    endDate: state.endDate,
    endTime: state.endTime,
    fechaReintegro: state.fechaReintegro,
    reintegroTime: state.reintegroTime,
    state: state.state,
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
      description: values.description.trim() || undefined,
      value: Number(state.value),
      unit: state.unit,
      startDate: state.startDate,
      startTime: state.startTime,
      endDate: state.endDate,
      endTime: state.endTime,
      fechaReintegro: state.fechaReintegro,
      reintegroTime: state.reintegroTime,
      state: state.state,
      title: title.trim(),
    };

    const parsed = createSolicitudBodySchema.safeParse(body);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? SOLICITUD_ERROR_CODES.titleRequired);
      return false;
    }

    setSubmitting(true);
    try {
      const isEdit = config.mode === "edit" && config.initialSolicitud;
      const response = isEdit
        ? await updateSolicitud(config.initialSolicitud!.id, parsed.data)
        : await createSolicitud(parsed.data);
      if (isEdit) {
        appToast.success("Solicitud actualizada", {
          description: `Cambios guardados en la novedad #${response.workItemId}.`,
        });
      } else {
        appToast.success("Solicitud creada", {
          description: `Novedad #${response.workItemId} creada en Azure DevOps.`,
        });
      }
      config.onSaved({
        id: response.workItemId,
        title: parsed.data.title,
        tipo: parsed.data.tipo,
        assignedTo: persona || null,
        description: parsed.data.description ?? null,
        fechaInicio: parsed.data.startDate,
        fechaInicioHora: parsed.data.startTime,
        fechaFin: parsed.data.endDate,
        fechaFinHora: parsed.data.endTime,
        fechaReintegro: parsed.data.fechaReintegro,
        fechaReintegroHora: parsed.data.reintegroTime,
        parentId: parsed.data.newsStoryId,
        hours: resolveAzureHours(parsed.data.value, parsed.data.unit),
        // Eco del estado que el usuario acaba de guardar (o el original en
        // creación, cuando no se envió `state`). Antes del fix, en `edit`
        // siempre se devolvía `initialSolicitud.state`, así que la tabla no
        // reflejaba el nuevo estado hasta recargar la página.
        state: parsed.data.state ?? config.initialSolicitud?.state ?? "",
        url: response.url,
      });
      return true;
    } catch (cause) {
      appToast.error(
        config.mode === "edit"
          ? "No se pudo actualizar la solicitud"
          : "No se pudo crear la solicitud",
        {
          description: cause instanceof Error ? cause.message : undefined,
        },
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [project, team, hasTeams, newsStoryId, assignedTo, state, title, persona, values.description, config]);

  return {
    mode: (config.mode ?? "create") as SolicitudFormMode,
    project,
    setProject: changeProject,
    team,
    setTeam: changeTeam,
    teams,
    hasTeams,
    newsStories,
    /** Miembros del proyecto filtrados por el equipo activo. */
    teamScopedMembers,
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
