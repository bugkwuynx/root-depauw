import AsyncStorage from '@react-native-async-storage/async-storage';
import { Setting } from '@/types/setting.type';

const STORAGE_KEY = '@depauw_user_preferences_v1';

export type UserGoal =
  | { kind: 'preset'; presetId: string }
  | { kind: 'custom'; id: string; label: string };

export type UserPreferences = {
  goals: UserGoal[];
  preferEmptyGoalsList: boolean;
  displayName: string;
  remindersEnabled: boolean;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  goals: [],
  preferEmptyGoalsList: false,
  displayName: '',
  remindersEnabled: true,
};

function mergeWithDefaults(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_USER_PREFERENCES };

  const o = raw as Record<string, unknown>;
  const goals = Array.isArray(o.goals) ? o.goals : [];
  const normalizedGoals: UserGoal[] = goals
    .map((g): UserGoal | null => {
      if (!g || typeof g !== 'object') return null;
      const x = g as Record<string, unknown>;
      if (x.kind === 'preset' && typeof x.presetId === 'string') {
        return { kind: 'preset', presetId: x.presetId };
      }
      if (x.kind === 'custom' && typeof x.id === 'string' && typeof x.label === 'string') {
        return { kind: 'custom', id: x.id, label: x.label.trim() };
      }
      return null;
    })
    .filter((g): g is UserGoal => g != null && (g.kind !== 'custom' || g.label.length > 0));

  return {
    goals: normalizedGoals,
    preferEmptyGoalsList:
      typeof o.preferEmptyGoalsList === 'boolean' ? o.preferEmptyGoalsList : DEFAULT_USER_PREFERENCES.preferEmptyGoalsList,
    displayName: typeof o.displayName === 'string' ? o.displayName : '',
    remindersEnabled:
      typeof o.remindersEnabled === 'boolean' ? o.remindersEnabled : DEFAULT_USER_PREFERENCES.remindersEnabled,
  };
}

/**
 * Load preferences from your API (e.g. GET /me/preferences).
 * Return `null` to skip the network and use only AsyncStorage.
 * Throw on unrecoverable auth/network errors if you want `loadUserPreferences` to fall back to local cache.
 */
export async function fetchUserPreferencesFromBackend(userId: string): Promise<Setting | null> {
  try {
    const getSettingResponse = await fetch(`/api/setting/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!getSettingResponse.ok) {
      throw new Error('Failed to fetch user preferences from backend');
    }

    return await getSettingResponse.json();
  } catch (error) {
    throw new Error(`Failed to fetch user preferences from backend: ${(error as Error).message}`);
  }
}

export type UserProfileSyncPayload = Pick<
  UserPreferences,
  'displayName' | 'remindersEnabled' | 'preferEmptyGoalsList'
>;

/**
 * Sync the goals list after add / edit / remove in Settings or after onboarding.
 * Called automatically from `syncUserPreferencesToBackend` (which runs on every `saveUserPreferences`).
 * Use a dedicated route (e.g. `PUT /me/goals`) or leave empty if you only use the combined {@link syncUserPreferencesToBackend} upsert.
 */
export async function syncUserGoalsToBackend(_goals: UserGoal[]): Promise<void> {
  // Example (goals table or nested resource):
  // const res = await fetch(`${API_URL}/me/goals`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json', ...authHeaders },
  //   body: JSON.stringify({ goals: _goals }),
  // });
  // if (!res.ok) throw new Error('Failed to sync goals');
}

/**
 * Sync non-goal profile fields. Called together with {@link syncUserGoalsToBackend} from {@link syncUserPreferencesToBackend}.
 */
export async function syncUserProfileToBackend(_profile: UserProfileSyncPayload): Promise<void> {
  // Example:
  // const res = await fetch(`${API_URL}/me/profile`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json', ...authHeaders },
  //   body: JSON.stringify(_profile),
  // });
  // if (!res.ok) throw new Error('Failed to sync profile');
}

/**
 * Push the full preferences document to your backend after local save.
 * Runs for every `saveUserPreferences` (display name, toggles, week start, **and** goal CRUD).
 *
 * Default: two parallel requests via {@link syncUserGoalsToBackend} and {@link syncUserProfileToBackend}.
 * If you have a single resource, replace this implementation with one `PUT` of `next` (and no-op the split helpers).
 */
export async function syncUserPreferencesToBackend(next: UserPreferences): Promise<void> {
  const { goals, displayName, remindersEnabled, preferEmptyGoalsList } = next;
  await Promise.all([
    syncUserGoalsToBackend(goals),
    syncUserProfileToBackend({ displayName, remindersEnabled, preferEmptyGoalsList }),
  ]);
  // Alternative — one combined upsert:
  // const res = await fetch(`${API_URL}/user/preferences`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json', ...authHeaders },
  //   body: JSON.stringify(next),
  // });
  // if (!res.ok) throw new Error('Failed to sync preferences');
}

export async function loadUserPreferences(): Promise<UserPreferences> {
  try {
    const remote = await fetchUserPreferencesFromBackend();
    if (remote != null) {
      const merged = mergeWithDefaults(remote);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // keep merged result even if cache write fails
      }
      return merged;
    }
  } catch {
    // fall back to device storage when remote fails
  }

  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return { ...DEFAULT_USER_PREFERENCES };
    return mergeWithDefaults(JSON.parse(json));
  } catch {
    return { ...DEFAULT_USER_PREFERENCES };
  }
}

export async function saveUserPreferences(next: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  // Includes `next.goals` so add / edit / delete in Settings and onboarding stay aligned with the server.
  await syncUserPreferencesToBackend(next);
}

export function newCustomGoalId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
