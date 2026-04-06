import { db } from '../database/configFirestore.js';
import { Timestamp } from 'firebase-admin/firestore';
import type { GameState } from '../types/gameState.type.js';
import type { UserStreak } from '../types/user.type.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import { regressPhase } from '../utils/gameLogic.js';
import { TREES, getTreeById } from '../utils/mockData.js';
import type Tree from '../types/tree.type.js';

const gameStatePath = (userId: string) => `users/${userId}/gameState/data`;

// Mock wellness resources - CHANGE LATER
const WELLNESS_RESOURCES = [
    { name: '24/7 Mental Heath support', contact: '(765) 658-4268' },
    { name: 'DePauw Police', contact: '(765) 658-5555' },
    { name: 'Medical Emergency', contact: '911' },
];

export type WarningStatus =
    | { type: 'none' }
    | { type: 'wellness_check'; day: number; message: string; resources: typeof WELLNESS_RESOURCES }
    | { type: 'degradation_warning'; hasFertilizer: boolean };
const userPath = (userId: string) => `users/${userId}`;

function toGameState(data: FirebaseFirestore.DocumentData): GameState {
    return {
        ...data,
        lastUpdated: data['lastUpdated'] instanceof Timestamp
            ? data['lastUpdated'].toDate()
            : data['lastUpdated'] as Date,
    } as GameState;
}

async function getGameState(userId: string): Promise<GameState> {
    const snap = await db.doc(gameStatePath(userId)).get();
    if (!snap.exists) throw new NotFoundError(`Game state not found for user ${userId}`);
    return toGameState(snap.data()!);
}

export async function fetchGameState(userId: string): Promise<GameState> {
    return getGameState(userId);
}

export async function getStreak(userId: string): Promise<UserStreak> {
    const snap = await db.doc(userPath(userId)).get();
    if (!snap.exists) throw new NotFoundError(`User ${userId} not found`);
    const userData = snap.data() as { streak: UserStreak };
    return userData.streak;
}

export function fetchAllTrees(): Tree[] {
    return TREES;
}

export function fetchTree(treeId: number): Tree {
    const tree = getTreeById(treeId);
    if (!tree) throw new NotFoundError(`Tree ${treeId} not found`);
    return tree;
}

export async function getWarningStatus(userId: string): Promise<WarningStatus> {
    const [gameStateSnap, userSnap] = await Promise.all([
        db.doc(gameStatePath(userId)).get(),
        db.doc(userPath(userId)).get(),
    ]);

    if (!gameStateSnap.exists) throw new NotFoundError(`Game state not found for user ${userId}`);
    if (!userSnap.exists) throw new NotFoundError(`User ${userId} not found`);

    const gameState = gameStateSnap.data() as GameState;
    const userData = userSnap.data() as { streak: { zeroCompletionDays: number } };
    const zeroCompletionDays = userData.streak?.zeroCompletionDays ?? 0;

    if (gameState.pendingDegradation) {
        return { type: 'degradation_warning', hasFertilizer: gameState.fertilizer > 0 };
    }

    // zeroCompletionDays reflects yesterday's count; add 1 to get today's day number
    if (zeroCompletionDays >= 4 && zeroCompletionDays <= 6) {
        const day = zeroCompletionDays + 1;
        return {
            type: 'wellness_check',
            day,
            message: `Today is the ${day}${day === 5 ? 'th' : day === 6 ? 'th' : 'th'} day you haven't completed any tasks. Is everything good? Keep up with your tasks to save your little tree! If you need support, here are some helpful resources:`,
            resources: WELLNESS_RESOURCES,
        };
    }

    return { type: 'none' };
}

export async function useFertilizer(userId: string): Promise<GameState> {
    const gameStateRef = db.doc(gameStatePath(userId));
    const userRef = db.doc(userPath(userId));

    const [gameStateSnap, userSnap] = await Promise.all([
        gameStateRef.get(),
        userRef.get(),
    ]);

    if (!gameStateSnap.exists) throw new NotFoundError(`Game state not found for user ${userId}`);
    if (!userSnap.exists) throw new NotFoundError(`User ${userId} not found`);

    const gameState = gameStateSnap.data() as GameState;
    const userData = userSnap.data() as { streak: UserStreak };

    if (!gameState.pendingDegradation) {
        throw new ConflictError('No pending degradation to respond to');
    }
    if (gameState.fertilizer <= 0) {
        throw new ValidationError('No fertilizer available');
    }

    const updatedGameState: Partial<GameState> = {
        fertilizer: gameState.fertilizer - 1,
        pendingDegradation: false,
        lastUpdated: new Date(),
    };

    const batch = db.batch();
    batch.update(gameStateRef, updatedGameState as Record<string, unknown>);
    batch.update(userRef, {
        'streak.zeroCompletionDays': 0,
        'streak.warningIssued': false,
    });
    await batch.commit();

    return toGameState({ ...gameState, ...updatedGameState });
}

export async function updateTreeId(userId: string, newTreeId: number): Promise<GameState> {
    if (!getTreeById(newTreeId)) throw new NotFoundError(`Tree ${newTreeId} not found`);

    const gameStateRef = db.doc(gameStatePath(userId));
    const snap = await gameStateRef.get();
    if (!snap.exists) throw new NotFoundError(`Game state not found for user ${userId}`);

    const gameState = snap.data() as GameState;
    const updatedFields: Partial<GameState> = {
        currentTreeId: newTreeId,
        lastUpdated: new Date(),
    };

    await gameStateRef.update(updatedFields as Record<string, unknown>);
    return toGameState({ ...gameState, ...updatedFields });
}

export async function fetchCompletedTrees(userId: string): Promise<Tree[]> {
    const gameState = await getGameState(userId);
    return TREES.filter((t) => t.treeId < gameState.currentTreeId);
}

export async function declineFertilizer(userId: string): Promise<GameState> {
    const gameStateRef = db.doc(gameStatePath(userId));
    const userRef = db.doc(userPath(userId));

    const [gameStateSnap, userSnap] = await Promise.all([
        gameStateRef.get(),
        userRef.get(),
    ]);

    if (!gameStateSnap.exists) throw new NotFoundError(`Game state not found for user ${userId}`);
    if (!userSnap.exists) throw new NotFoundError(`User ${userId} not found`);

    const gameState = gameStateSnap.data() as GameState;

    if (!gameState.pendingDegradation) {
        throw new ConflictError('No pending degradation to respond to');
    }

    const regressedPhase = regressPhase(gameState.currentPhase);

    const updatedGameState: Partial<GameState> = {
        currentPhase: regressedPhase,
        waterAppliedToPhase: 0,
        pendingDegradation: false,
        lastUpdated: new Date(),
    };

    const batch = db.batch();
    batch.update(gameStateRef, updatedGameState as Record<string, unknown>);
    batch.update(userRef, {
        'streak.zeroCompletionDays': 0,
        'streak.warningIssued': false,
    });
    await batch.commit();

    return toGameState({ ...gameState, ...updatedGameState });
}
