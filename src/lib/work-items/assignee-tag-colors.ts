/** Paleta fija: clases completas para que Tailwind las detecte en build. */
const ASSIGNEE_TAG_STYLES = [
  "border-emerald-500/35 bg-emerald-500/12 text-emerald-800 dark:bg-emerald-500/18 dark:text-emerald-300",
  "border-sky-500/35 bg-sky-500/12 text-sky-800 dark:bg-sky-500/18 dark:text-sky-300",
  "border-violet-500/35 bg-violet-500/12 text-violet-800 dark:bg-violet-500/18 dark:text-violet-300",
  "border-amber-500/35 bg-amber-500/12 text-amber-800 dark:bg-amber-500/18 dark:text-amber-300",
  "border-rose-500/35 bg-rose-500/12 text-rose-800 dark:bg-rose-500/18 dark:text-rose-300",
  "border-teal-500/35 bg-teal-500/12 text-teal-800 dark:bg-teal-500/18 dark:text-teal-300",
  "border-orange-500/35 bg-orange-500/12 text-orange-800 dark:bg-orange-500/18 dark:text-orange-300",
  "border-indigo-500/35 bg-indigo-500/12 text-indigo-800 dark:bg-indigo-500/18 dark:text-indigo-300",
  "border-cyan-500/35 bg-cyan-500/12 text-cyan-800 dark:bg-cyan-500/18 dark:text-cyan-300",
  "border-fuchsia-500/35 bg-fuchsia-500/12 text-fuchsia-800 dark:bg-fuchsia-500/18 dark:text-fuchsia-300",
] as const;

function hashAssigneeName(name: string): number {
  const normalized = name.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = Math.trunc(hash * 31 + normalized.codePointAt(i)!);
  }
  return Math.abs(hash);
}

/** Clases de tag/badge por persona; el mismo nombre siempre obtiene el mismo color. */
export function getAssigneeTagClasses(name: string): string {
  const index = hashAssigneeName(name) % ASSIGNEE_TAG_STYLES.length;
  return ASSIGNEE_TAG_STYLES[index]!;
}
