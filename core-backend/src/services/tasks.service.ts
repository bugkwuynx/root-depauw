import { db } from '../database/configFirestore.js';
import { FieldValue } from 'firebase-admin/firestore';
import { CalendarCompletionState, type CalendarCompletionMap } from '../types/calendar.type.js';
import type { DailyTask, Task } from '../types/dailyTasks.type.js';
import type { GameState } from '../types/gameState.type.js';
import type { UserStreak } from '../types/user.type.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import {
    determineCompletionState,
    computeCompletionRewards,
    computeStreakUpdate,
    checkStreakMilestones,
    computePhaseAdvance,
    computeEventBonusCoins,
    type CompletionState,
    type StreakMilestoneResult,
} from '../utils/gameLogic.js';
import { MAX_TREE_ID } from '../utils/mockData.js';

// Firestore path helpers
const dailyTasksPath = (userId: string, date: string) =>
    `users/${userId}/dailyTasks/${date}`;
const gameStatePath = (userId: string) => `users/${userId}/gameState/data`;
const userPath = (userId: string) => `users/${userId}`;

export interface FinalizeResult {
    completionState: CompletionState;
    coinsEarned: number;
    eventBonusCoins: number;
    waterApplied: number;
    streakUpdate: Partial<UserStreak>;
    milestones: StreakMilestoneResult;
    gameState: GameState;
}

export async function confirmDaySetup(
    userId: string,
    date: string,
    tasks: Task[]
): Promise<DailyTask & { confirmed: boolean; finalized: boolean }> {
    const ref = db.doc(dailyTasksPath(userId, date));
    const snap = await ref.get();

    if (snap.exists) {
        const existing = snap.data() as DailyTask & { finalized: boolean };
        if (existing.finalized) throw new ConflictError(`Day ${date} has already been finalized`);
    }

    const doc: DailyTask & { confirmed: boolean; finalized: boolean } = {
        date: new Date(date),
        tasks: tasks.map((t) => ({ ...t, isCompleted: false })),
        confirmed: true,
        finalized: false,
    };

    await ref.set(doc);
    return doc;
}

export async function getDailyTasks(userId: string, date: string): Promise<DailyTask & { finalized: boolean }> {
    const snap = await db.doc(dailyTasksPath(userId, date)).get();
    if (!snap.exists) throw new NotFoundError(`No tasks found for ${date}`);
    return snap.data() as DailyTask & { finalized: boolean };
}

export async function markTaskComplete(userId: string, date: string, taskId: string): Promise<Task> {
    const ref = db.doc(dailyTasksPath(userId, date));
    const gameStateRef = db.doc(gameStatePath(userId));
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError(`No tasks found for ${date}`);

    const dailyTask = snap.data() as DailyTask & { finalized: boolean };
    const tasks: Task[] = dailyTask.tasks ?? [];
    const taskIndex = tasks.findIndex((t) => t.taskId === taskId);

    if (taskIndex === -1) throw new NotFoundError(`Task ${taskId} not found`);

    tasks[taskIndex]!.isCompleted = true;

    const batch = db.batch();
    batch.update(ref, { tasks });
    batch.update(gameStateRef, { coins: FieldValue.increment(5) });
    await batch.commit();

    return tasks[taskIndex]!;
}

export async function getCalendarCompletion(
    userId: string,
    year: number,
    month: number, // 1–12
): Promise<CalendarCompletionMap> {
    const pad = (n: number) => String(n).padStart(2, '0');
    const from = `${year}-${pad(month)}-01`;
    const to   = `${year}-${pad(month)}-31`;

    const snap = await db
        .collection(`users/${userId}/dailyTasks`)
        .where('__name__', '>=', from)
        .where('__name__', '<=', to)
        .get();

    const result: CalendarCompletionMap = {};
    snap.forEach((doc) => {
        const data = doc.data() as { tasks?: Array<{ isCompleted: boolean }> };
        const state = determineCompletionState((data.tasks ?? []) as import('../types/dailyTasks.type.js').Task[]);
        result[doc.id] = state === 'full' ? CalendarCompletionState.COMPLETE : state === 'partial' ? CalendarCompletionState.PARTIAL : CalendarCompletionState.NONE;
    });
    return result;
}

export async function finalizeDay(userId: string, date: string): Promise<FinalizeResult> {
    const taskRef = db.doc(dailyTasksPath(userId, date));
    const gameStateRef = db.doc(gameStatePath(userId));
    const userRef = db.doc(userPath(userId));

    const [taskSnap, gameStateSnap, userSnap] = await Promise.all([
        taskRef.get(),
        gameStateRef.get(),
        userRef.get(),
    ]);

    if (!taskSnap.exists) throw new NotFoundError(`No tasks found for ${date}`);
    if (!gameStateSnap.exists) throw new NotFoundError(`Game state not found for user ${userId}`);
    if (!userSnap.exists) throw new NotFoundError(`User ${userId} not found`);

    const dailyTask = taskSnap.data() as DailyTask & { finalized: boolean };
    if (dailyTask.finalized) throw new ConflictError(`Day ${date} has already been finalized`);

    const gameState = gameStateSnap.data() as GameState;
    const userData = userSnap.data() as { streak: UserStreak };
    const streak = userData.streak;

    // 1. Determine completion state
    const completionState = determineCompletionState(dailyTask.tasks ?? []);

    // 2. Compute rewards
    const { coins: coinsEarned, water: waterEarned } = computeCompletionRewards(completionState);
    const eventBonusCoins = computeEventBonusCoins(dailyTask.tasks ?? []);

    // 3. Compute new game state values
    let newCoins = gameState.coins + coinsEarned + eventBonusCoins;
    let newWater = gameState.waterAppliedToPhase + waterEarned;
    let newPhase = gameState.currentPhase;
    let newTreeId = gameState.currentTreeId;
    let treeCompleted = false;

    // 4. Phase advance check (only on full completion which grants water)
    if (waterEarned > 0) {
        const currentTree = { waterRequiredPerPhase: 7 }; // from mock data
        const advance = computePhaseAdvance(newPhase, newWater, currentTree.waterRequiredPerPhase);
        if (advance.shouldAdvance) {
            newPhase = advance.nextPhase;
            newWater = 0;
            if (advance.isTreeComplete) {
                treeCompleted = true;
                newCoins += 100; // tree completion reward
                newTreeId = Math.min(newTreeId + 1, MAX_TREE_ID);
                newPhase = advance.nextPhase; // resets to Seed via gameLogic
            }
        }
    }

    // 5. Update streak
    const streakDelta = computeStreakUpdate(streak, completionState);
    const mergedStreak: UserStreak = { ...streak, ...streakDelta };

    // 6. Check milestones
    const milestones = checkStreakMilestones(mergedStreak);

    let finalFullCompletionDays = mergedStreak.fullCompletionDays;
    if (milestones.resetFullCompletionDays) {
        newCoins += milestones.bonusCoins;
        finalFullCompletionDays = 0;
    }

    const newFertilizer = gameState.fertilizer + milestones.bonusFertilizer;
    const newPendingDegradation = milestones.triggerDegradationWarning
        ? true
        : gameState.pendingDegradation;

    const finalStreak: Partial<UserStreak> = {
        ...streakDelta,
        fullCompletionDays: finalFullCompletionDays,
        warningIssued: milestones.triggerDegradationWarning ? true : streak.warningIssued,
    };

    // 7. Batch write
    const batch = db.batch();

    const updatedGameState: GameState = {
        coins: newCoins,
        waterAppliedToPhase: newWater,
        currentTreeId: newTreeId,
        currentPhase: newPhase,
        fertilizer: newFertilizer,
        pendingDegradation: newPendingDegradation,
        lastUpdated: new Date(),
    };

    batch.update(gameStateRef, updatedGameState as unknown as Record<string, unknown>);
    batch.update(taskRef, { finalized: true });
    batch.update(userRef, {
        'streak.fullCompletionDays': finalStreak.fullCompletionDays ?? mergedStreak.fullCompletionDays,
        'streak.partialCompletionDays': finalStreak.partialCompletionDays ?? mergedStreak.partialCompletionDays,
        'streak.zeroCompletionDays': finalStreak.zeroCompletionDays ?? mergedStreak.zeroCompletionDays,
        'streak.warningIssued': finalStreak.warningIssued ?? mergedStreak.warningIssued,
        ...(finalStreak.lastFullCompletionDate && { 'streak.lastFullCompletionDate': finalStreak.lastFullCompletionDate }),
        ...(finalStreak.lastZeroDate && { 'streak.lastZeroDate': finalStreak.lastZeroDate }),
    });

    await batch.commit();

    return {
        completionState,
        coinsEarned,
        eventBonusCoins,
        waterApplied: waterEarned,
        streakUpdate: finalStreak,
        milestones: {
            ...milestones,
            bonusCoins: milestones.resetFullCompletionDays ? milestones.bonusCoins : 0,
        },
        gameState: updatedGameState,
    };
}
