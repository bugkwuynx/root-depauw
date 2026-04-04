import { TreePhase } from '../types/tree.type.js';
import type { Task } from '../types/dailyTasks.type.js';
import type { UserStreak } from '../types/user.type.js';

export type CompletionState = 'full' | 'partial' | 'none';

const PHASE_ORDER: TreePhase[] = [
    TreePhase.Seed,
    TreePhase.Seedling,
    TreePhase.Sapling,
    TreePhase.Young,
    TreePhase.Full,
];

export function determineCompletionState(tasks: Task[]): CompletionState {
    if (tasks.length === 0) return 'none';
    const completedCount = tasks.filter((t) => t.isCompleted).length;
    if (completedCount === tasks.length) return 'full';
    if (completedCount > 0) return 'partial';
    return 'none';
}

export function computeCompletionRewards(state: CompletionState): { coins: number; water: number } {
    if (state === 'full') return { coins: 10, water: 1 };
    if (state === 'partial') return { coins: 5, water: 0 };
    return { coins: 0, water: 0 };
}

export function computeStreakUpdate(
    streak: UserStreak,
    state: CompletionState,
    now: Date = new Date()
): Partial<UserStreak> {
    if (state === 'full') {
        return {
            fullCompletionDays: (streak.fullCompletionDays ?? 0) + 1,
            zeroCompletionDays: 0,
            lastFullCompletionDate: now,
        };
    }
    if (state === 'partial') {
        return {
            partialCompletionDays: (streak.partialCompletionDays ?? 0) + 1,
            fullCompletionDays: 0,
        };
    }
    // none
    return {
        zeroCompletionDays: (streak.zeroCompletionDays ?? 0) + 1,
        fullCompletionDays: 0,
        lastZeroDate: now,
    };
}

export interface StreakMilestoneResult {
    bonusCoins: number;
    bonusFertilizer: number;
    resetFullCompletionDays: boolean;
    triggerDegradationWarning: boolean;
}

export function checkStreakMilestones(
    updatedStreak: Partial<UserStreak> & Pick<UserStreak, 'fullCompletionDays' | 'zeroCompletionDays'>
): StreakMilestoneResult {
    const result: StreakMilestoneResult = {
        bonusCoins: 0,
        bonusFertilizer: 0,
        resetFullCompletionDays: false,
        triggerDegradationWarning: false,
    };

    if ((updatedStreak.fullCompletionDays ?? 0) >= 7) {
        result.bonusCoins = 50;
        result.bonusFertilizer = 1;
        result.resetFullCompletionDays = true;
    }

    if ((updatedStreak.zeroCompletionDays ?? 0) >= 7) {
        result.triggerDegradationWarning = true;
    }

    return result;
}

export interface PhaseAdvanceResult {
    shouldAdvance: boolean;
    nextPhase: TreePhase;
    isTreeComplete: boolean;
}

export function computePhaseAdvance(
    current: TreePhase,
    waterApplied: number,
    waterRequired: number
): PhaseAdvanceResult {
    if (waterApplied < waterRequired) {
        return { shouldAdvance: false, nextPhase: current, isTreeComplete: false };
    }

    const currentIndex = PHASE_ORDER.indexOf(current);
    const isLastPhase = currentIndex === PHASE_ORDER.length - 1;

    if (isLastPhase) {
        return { shouldAdvance: true, nextPhase: TreePhase.Seed, isTreeComplete: true };
    }

    const nextPhase = PHASE_ORDER[currentIndex + 1]!;
    return { shouldAdvance: true, nextPhase, isTreeComplete: false };
}

export function computeEventBonusCoins(tasks: Task[]): number {
    return tasks.filter((t) => t.type === 'campus_event' && t.isCompleted).length * 10;
}

export function regressPhase(current: TreePhase): TreePhase {
    const currentIndex = PHASE_ORDER.indexOf(current);
    if (currentIndex <= 0) return TreePhase.Seed;
    return PHASE_ORDER[currentIndex - 1]!;
}
