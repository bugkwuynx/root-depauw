import { getAllPresetIds } from '@/lib/goalsCatalog';
import { Setting } from '@/types/setting.type';

export const USER_ID_STORAGE_KEY = '@app:userId';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export type UserGoal =
  | { kind: 'preset'; presetId: string }
  | { kind: 'custom'; id: string; label: string };

export interface UserPreferences {
  goals: UserGoal[];
  displayName: string;
  remindersEnabled: boolean;
  preferEmptyGoalsList: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  goals: [],
  displayName: '',
  remindersEnabled: true,
  preferEmptyGoalsList: false,
};

export function newCustomGoalId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function goalsToStrings(goals: UserGoal[]): string[] {
  return goals.map((g) =>
    g.kind === 'preset'
      ? g.presetId
      : JSON.stringify({ kind: 'custom', id: g.id, label: g.label }),
  );
}

function stringsToGoals(strings: string[]): UserGoal[] {
  const presetIds = new Set(getAllPresetIds());
  return strings.map((s) => {
    if (presetIds.has(s)) return { kind: 'preset' as const, presetId: s };
    try {
      const parsed = JSON.parse(s) as { kind: string; id: string; label: string };
      if (parsed.kind === 'custom' && parsed.id && parsed.label) {
        return { kind: 'custom' as const, id: parsed.id, label: parsed.label };
      }
    } catch {
      // not JSON — fall through to label fallback
    }
    return { kind: 'custom' as const, id: newCustomGoalId(), label: s };
  });
}

export async function loadUserPreferences(userId: string): Promise<UserPreferences> {
  const setting = await fetchUserPreferencesFromBackend(userId);
  if (!setting) return DEFAULT_USER_PREFERENCES;
  return {
    goals: stringsToGoals(setting.goals),
    displayName: setting.displayName,
    remindersEnabled: setting.remindersEnabled,
    preferEmptyGoalsList: setting.preferEmptyGoalsList,
  };
}

export async function saveUserPreferences(userId: string, prefs: UserPreferences): Promise<void> {
  await syncNewSettingToBackend(userId, {
    goals: goalsToStrings(prefs.goals),
    displayName: prefs.displayName,
    remindersEnabled: prefs.remindersEnabled,
    preferEmptyGoalsList: prefs.preferEmptyGoalsList,
  });
}

export async function fetchUserPreferencesFromBackend(userId: string): Promise<Setting | null> {
  try {
    const getSettingResponse = await fetch(`${BASE_URL}/api/setting/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('Fetch user preferences response:', getSettingResponse);

    if (!getSettingResponse.ok) {
      throw new Error('Failed to fetch user preferences from backend');
    }

    return await getSettingResponse.json() as Setting;
  } catch (error) {
    throw new Error(`Failed to fetch user preferences from backend: ${(error as Error).message}`);
  }
}

export async function syncNewSettingToBackend(userId: string, newSetting: Partial<Setting>): Promise<void> {
  const updateGoalsResult = await fetch(`${BASE_URL}/api/setting/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newSetting }),
  });

  if (!updateGoalsResult.ok) {
    throw new Error('Failed to sync user goals to backend');
  }
}
