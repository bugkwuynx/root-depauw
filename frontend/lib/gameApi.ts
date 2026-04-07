import type { GameState, UserStreak, Tree, WarningStatus, Task, DailyTask, FinalizeResult, UserProfile, RecommendationsCollection } from '@/types/game.type';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string; error?: string; detail?: string };
    const msg = err.message ?? err.error ?? `HTTP ${res.status}`;
    const detail = err.detail ? ` — ${err.detail}` : '';
    throw new Error(`${msg}${detail}`);
  }
  return res.json() as Promise<T>;
}

export const getGameState = (userId: string) =>
  request<GameState>(`/api/game/${userId}/state`);

export const getStreak = (userId: string) =>
  request<UserStreak>(`/api/game/${userId}/streak`);

export const getWarningStatus = (userId: string) =>
  request<WarningStatus>(`/api/game/${userId}/warning-status`);

export const getTree = (treeId: number) =>
  request<Tree>(`/api/game/trees/${treeId}`);

export const getCompletedTrees = (userId: string) =>
  request<Tree[]>(`/api/game/${userId}/completed-trees`);

export const useFertilizer = (userId: string) =>
  request<GameState>(`/api/game/${userId}/fertilizer/use`, { method: 'POST' });

export const declineFertilizer = (userId: string) =>
  request<GameState>(`/api/game/${userId}/fertilizer/decline`, { method: 'POST' });

export const getUserProfile = (userId: string) =>
  request<UserProfile>(`/api/game/${userId}/profile`);

// ── Helpers ──────────────────────────────────────────────────────────────────

export const todayDate = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const getDailyTasks = (userId: string, date: string) =>
  request<DailyTask>(`/api/tasks/${userId}/${date}`);

export const confirmTasks = (userId: string, date: string, tasks: Task[]) =>
  request<DailyTask>(`/api/tasks/${userId}/${date}/confirm-setup`, {
    method: 'POST',
    body: JSON.stringify({ tasks }),
  });

export const completeTask = (userId: string, date: string, taskId: string) =>
  request<Task>(`/api/tasks/${userId}/${date}/complete`, {
    method: 'PATCH',
    body: JSON.stringify({ taskId }),
  });

export const finalizeDailyTasks = (userId: string, date: string) =>
  request<FinalizeResult>(`/api/tasks/${userId}/${date}/finalize`, {
    method: 'POST',
  });

export const getRecommendationsForUser = (userId: string, date: string) =>
  request<RecommendationsCollection>(`/api/recommendations/${userId}?currentDate=${date}`);

export const generateRecommendations = (userId: string) =>
  request<RecommendationsCollection>(`/api/recommendations/${userId}/generate`, { method: 'POST' });
