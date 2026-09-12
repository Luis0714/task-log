import type {
  GitChangeset,
  GitCommit,
  GitDiffHunk,
  GitFileChange,
  GitFileChangeKind,
} from "@/lib/git/changeset";

const AUTHORS = ["Luis Martínez", "Sofía Castro", "Carlos Vega"] as const;

const COMMIT_MESSAGES = [
  "Refactorizar la navegación del detalle de estudiante y extraer rutas",
  "Ajustar el facetado de filtros del catálogo",
  "Corregir el enrutado de work items al cambiar de sprint",
  "Extraer utilidades compartidas para ramas git",
  "Mejorar el estado vacío de la lista de pull requests",
  "Normalizar el guardado del repositorio predeterminado",
  "Actualizar el picker de work items vinculables",
  "Alinear tabs de comparación con el detalle del PR",
] as const;

const FILE_PATHS = [
  "src/components/filters/filter.tsx",
  "src/components/filters/filter-group.tsx",
  "src/hooks/use-filters.ts",
  "src/services/filters.ts",
  "src/pages/student-detail.tsx",
  "src/utils/student-paths.ts",
  "src/components/student/student-header.tsx",
  "src/hooks/use-student-detail.ts",
  "src/routes/student.ts",
  "src/lib/git/branch-option.ts",
  "src/components/shared/git-branch-pair.tsx",
  "src/app/(shell)/pull-requests/page.tsx",
  "src/components/pull-requests/pull-request-list-view.tsx",
  "src/lib/pull-requests/copy.ts",
  "src/services/ado/ado-repository-defaults.service.ts",
] as const;

function seedHash(value: string): string {
  let hash = 0x811c9dc5;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function kindForIndex(index: number): GitFileChangeKind {
  if (index % 11 === 0) return "added";
  if (index % 13 === 0) return "deleted";
  return "modified";
}

function mockHunk(path: string, kind: GitFileChangeKind): GitDiffHunk {
  const symbol = path.split("/").at(-1) ?? "module";

  if (kind === "added") {
    return {
      header: "@@ -0,0 +1,6 @@",
      lines: [
        { type: "addition", newNumber: 1, content: `export function ${toExportName(symbol)}() {` },
        { type: "addition", newNumber: 2, content: "  return null;" },
        { type: "addition", newNumber: 3, content: "}" },
      ],
    };
  }

  if (kind === "deleted") {
    return {
      header: "@@ -1,4 +0,0 @@",
      lines: [
        { type: "deletion", oldNumber: 1, content: `export function ${toExportName(symbol)}() {` },
        { type: "deletion", oldNumber: 2, content: "  return <LegacyView />;" },
        { type: "deletion", oldNumber: 3, content: "}" },
      ],
    };
  }

  return {
    header: `@@ -12,6 +12,8 @@ ${toExportName(symbol)}`,
    lines: [
      { type: "context", oldNumber: 12, newNumber: 12, content: "export function setup() {" },
      { type: "deletion", oldNumber: 13, content: "  return createLegacyRoute();" },
      { type: "addition", newNumber: 13, content: "  return createRoute();" },
      { type: "addition", newNumber: 14, content: "};" },
      { type: "context", oldNumber: 14, newNumber: 15, content: "}" },
    ],
  };
}

function toExportName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  return base
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function buildCommit(index: number, pairKey: string): GitCommit {
  const id = seedHash(`${pairKey}:commit:${index}`);
  const message =
    index === 0 && pairKey === "feat/HU175→develop"
      ? "Refactorizar la navegación del detalle de estudiante y extraer rutas"
      : COMMIT_MESSAGES[index % COMMIT_MESSAGES.length];

  return {
    id,
    shortId: id.slice(0, 8),
    message: index < COMMIT_MESSAGES.length ? message : `${message} (${index + 1})`,
    author: AUTHORS[index % AUTHORS.length],
    authoredAt: hoursAgoIso(index === 0 ? 2 : index + 1),
  };
}

function buildFile(index: number): GitFileChange {
  const basePath = FILE_PATHS[index % FILE_PATHS.length];
  const path =
    index < FILE_PATHS.length
      ? basePath
      : basePath.replace(/(\.[^.]+)$/, `-${Math.floor(index / FILE_PATHS.length)}$1`);
  const kind = kindForIndex(index);
  const hunk = mockHunk(path, kind);
  const additions = hunk.lines.filter((line) => line.type === "addition").length;
  const deletions = hunk.lines.filter((line) => line.type === "deletion").length;

  return {
    path,
    kind,
    additions: kind === "modified" ? additions + (index % 3) * 12 : additions,
    deletions: kind === "modified" ? deletions + (index % 2) * 8 : deletions,
    hunks: [hunk],
  };
}

export function buildMockChangeset(
  source: string,
  target: string,
  commitCount: number,
  fileCount: number,
): GitChangeset {
  const pairKey = `${source}→${target}`;

  return {
    commits: Array.from({ length: commitCount }, (_, index) => buildCommit(index, pairKey)),
    files: Array.from({ length: fileCount }, (_, index) => buildFile(index)),
  };
}
