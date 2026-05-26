import type {
  DashboardHeaderData,
  DashboardMetrics,
  DashboardWorkItem,
} from "@/lib/dashboard/types";

export const MOCK_DASHBOARD_HEADER: DashboardHeaderData = {
  displayName: "Luis Martínez",
  initials: "LM",
  project: "Core Platform",
  sprintName: "Sprint 12",
};

export const MOCK_IN_PROGRESS_PBIS: DashboardWorkItem[] = [
  {
    id: 123,
    title: "Implementar autenticación JWT",
    type: "Product Backlog Item",
    state: "In Progress",
    assignedTo: "Luis Martínez",
    loggedHours: 6,
    estimatedHours: 12,
    effort: 5,
    priority: 1,
  },
  {
    id: 456,
    title: "Refactorizar módulo de sesión en frontend",
    type: "User Story",
    state: "Active",
    assignedTo: "Luis Martínez",
    loggedHours: 3.5,
    estimatedHours: 8,
    effort: 3,
    priority: 2,
  },
];

export const MOCK_UPCOMING_PBIS: DashboardWorkItem[] = [
  {
    id: 789,
    title: "Agregar validación de tokens en API",
    type: "Product Backlog Item",
    state: "Ready",
    effort: 2,
    priority: 1,
  },
  {
    id: 890,
    title: "Documentar flujo OAuth con Entra ID",
    type: "Task",
    state: "To Do",
    priority: 2,
  },
  {
    id: 901,
    title: "Corregir timeout en refresh token",
    type: "Bug",
    state: "New",
    priority: 1,
  },
];

export const MOCK_ASSIGNED_PBIS: DashboardWorkItem[] = [
  ...MOCK_IN_PROGRESS_PBIS,
  ...MOCK_UPCOMING_PBIS,
  {
    id: 234,
    title: "Migrar endpoints legacy a App Router",
    type: "Product Backlog Item",
    state: "QA",
    loggedHours: 10,
    effort: 8,
    priority: 3,
  },
  {
    id: 567,
    title: "Actualizar dependencias de seguridad",
    type: "Task",
    state: "Done",
    loggedHours: 4,
    effort: 1,
    priority: 4,
  },
];

export const MOCK_DASHBOARD_METRICS: DashboardMetrics = {
  hoursToday: { taskHours: 4, bugHours: 1 },
  hoursSprintCurrent: { taskHours: 28, bugHours: 4 },
  hoursSprintTarget: 40,
  hoursRemaining: 8,
  storyPointsAssigned: 19,
  sprintWorkingDaysCount: 10,
  sprintWeeks: [
    {
      label: "1ª semana",
      hours: { taskHours: 16, bugHours: 4 },
      hoursTarget: 40,
      workingDaysCount: 5,
      dateRangeLabel: "3 mar – 7 mar",
      dayKeys: ["2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06", "2026-03-07"],
    },
    {
      label: "2ª semana",
      hours: { taskHours: 12, bugHours: 0 },
      hoursTarget: 40,
      workingDaysCount: 5,
      dateRangeLabel: "10 mar – 14 mar",
      dayKeys: ["2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13", "2026-03-14"],
    },
  ],
  hoursByDay: [
    {
      dayKey: "2026-03-03",
      label: "lun 3",
      taskHours: 6,
      bugHours: 2,
      totalHours: 8,
      cumulativeHours: 8,
      idealCumulativeHours: 8,
    },
    {
      dayKey: "2026-03-04",
      label: "mar 4",
      taskHours: 5,
      bugHours: 0,
      totalHours: 5,
      cumulativeHours: 13,
      idealCumulativeHours: 16,
    },
  ],
  pbiStateGroups: [
    { state: "New", items: MOCK_UPCOMING_PBIS.filter((item) => item.state === "New") },
    { state: "In Progress", items: MOCK_IN_PROGRESS_PBIS },
    { state: "Ready", items: MOCK_UPCOMING_PBIS.filter((item) => item.state === "Ready") },
    {
      state: "QA",
      items: MOCK_ASSIGNED_PBIS.filter((item) => item.state === "QA"),
    },
    {
      state: "Done",
      items: MOCK_ASSIGNED_PBIS.filter((item) => item.state === "Done"),
    },
  ],
  pbiProgress: {
    percent: 33,
    completedCount: 2,
    pendingCount: 4,
    otherCount: 0,
    totalCount: 6,
  },
  sprintStatusOverview: {
    userStories: {
      assigned: 5,
      pending: 2,
      inProgress: 1,
      completed: 2,
    },
    bugs: {
      assigned: 1,
      pending: 1,
      inProgress: 0,
      completed: 0,
    },
  },
};
