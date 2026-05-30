import type { CopilotHistoryEntry } from "@/lib/history/copilot-history-entry";

const HISTORY_KEY_PREFIX = "taskpilot_history_v1";
const LEGACY_HISTORY_KEY = "taskpilot_history_v1";
const MIGRATION_FLAG_PREFIX = "taskpilot_history_migrated_v1";

export const MAX_HISTORY_ENTRIES = 500;

export function buildHistoryStorageKey(scopeKey: string): string {
  return `${HISTORY_KEY_PREFIX}:${scopeKey}`;
}

function parseHistoryPayload(raw: string): CopilotHistoryEntry[] {
  const data = JSON.parse(raw) as CopilotHistoryEntry[];
  return Array.isArray(data) ? data : [];
}

function readHistoryFromKey(storageKey: string): CopilotHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return parseHistoryPayload(raw);
  } catch {
    return [];
  }
}

function migrateLegacyHistory(scopeKey: string): void {
  if (typeof window === "undefined") return;

  const migrationFlagKey = `${MIGRATION_FLAG_PREFIX}:${scopeKey}`;
  if (localStorage.getItem(migrationFlagKey)) return;

  const scopedKey = buildHistoryStorageKey(scopeKey);
  const scopedEntries = readHistoryFromKey(scopedKey);
  if (scopedEntries.length > 0) {
    localStorage.setItem(migrationFlagKey, "1");
    return;
  }

  const legacyEntries = readHistoryFromKey(LEGACY_HISTORY_KEY);
  if (legacyEntries.length === 0) {
    localStorage.setItem(migrationFlagKey, "1");
    return;
  }

  writeScopedHistory(scopeKey, legacyEntries);
  localStorage.removeItem(LEGACY_HISTORY_KEY);
  localStorage.setItem(migrationFlagKey, "1");
}

export function readScopedHistory(scopeKey: string): CopilotHistoryEntry[] {
  migrateLegacyHistory(scopeKey);
  return readHistoryFromKey(buildHistoryStorageKey(scopeKey));
}

export function writeScopedHistory(scopeKey: string, entries: CopilotHistoryEntry[]): void {
  localStorage.setItem(
    buildHistoryStorageKey(scopeKey),
    JSON.stringify(entries.slice(0, MAX_HISTORY_ENTRIES)),
  );
}
