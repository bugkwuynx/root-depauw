// Tree phases — must match backend TreePhase enum values exactly
export type TreePhase = 'seed' | 'seedling' | 'sapling' | 'young' | 'full';

export interface GameState {
  coins: number;
  waterAppliedToPhase: number;
  currentTreeId: number;
  currentPhase: TreePhase;
  fertilizer: number;
  pendingDegradation: boolean;
  lastUpdated: string;
}

export interface UserStreak {
  fullCompletionDays: number;
  partialCompletionDays: number;
  zeroCompletionDays: number;
  lastFullCompletionDate: string;
  lastZeroDate: string;
  warningIssued: boolean;
}

export interface WellnessResource {
  name: string;
  contact: string;
}

export interface Tree {
  name: string;
  treeId: number;
  phases: TreePhase[];
  waterRequiredPerPhase: number;
  totalWaterRequired: number;
  rewardCoins: number;
}

export type WarningStatus =
  | { type: 'none' }
  | { type: 'wellness_check'; day: number; message: string; resources: WellnessResource[] }
  | { type: 'degradation_warning'; hasFertilizer: boolean };

export interface Task {
  taskId: string;
  title: string;
  type: string;
  eventId: string | null;
  isCompleted: boolean;
}

export interface DailyTask {
  date: string;
  tasks: Task[];
  confirmed: boolean;
  finalized: boolean;
}

export interface FinalizeResult {
  completionState: 'full' | 'partial' | 'none';
  coinsEarned: number;
  eventBonusCoins: number;
  waterApplied: number;
  gameState: GameState;
}

export interface UserProfile {
  name: string;
  email: string;
}
