import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@depauw_daily_task_completion_v1';

/** Local calendar day key: YYYY-MM-DD */
export function dateKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export type CompletionMap = Record<string, number>;

function normalizeMap(raw: unknown): CompletionMap {
  if (!raw || typeof raw !== 'object') return {};
  const out: CompletionMap = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) continue;
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n) && n > 0) out[k] = Math.min(999, Math.floor(n));
  }
  return out;
}

export async function loadCompletionMap(): Promise<CompletionMap> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return {};
    return normalizeMap(JSON.parse(json));
  } catch {
    return {};
  }
}

export async function saveCompletionMap(map: CompletionMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** True if at least one task was completed that local day. */
export function dayHasCompletion(map: CompletionMap, dateKey: string): boolean {
  return (map[dateKey] ?? 0) > 0;
}

/** Set whether the user completed any tasks that day (MVP: boolean → count 0 or 1). */
export async function setDayAnyCompletion(dateKey: string, completed: boolean): Promise<CompletionMap> {
  const prev = await loadCompletionMap();
  const next = { ...prev };
  if (completed) next[dateKey] = Math.max(1, next[dateKey] ?? 1);
  else delete next[dateKey];
  await saveCompletionMap(next);
  return next;
}
