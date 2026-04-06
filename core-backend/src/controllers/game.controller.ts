import type { Request, Response } from 'express';
import {
    fetchGameState,
    fetchAllTrees,
    fetchTree,
    useFertilizer,
    declineFertilizer,
    getWarningStatus,
    updateTreeId,
    fetchCompletedTrees,
    getStreak,
} from '../services/game.service.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import { db } from '../database/configFirestore.js';

export async function getGameStateHandler(req: Request, res: Response): Promise<void> {
    const { userId } = req.params as { userId: string };
    try {
        const state = await fetchGameState(userId);
        res.json(state);
    } catch (err) {
        if (err instanceof NotFoundError) { res.status(404).json({ error: err.message }); return; }
        res.status(500).json({ error: 'Internal server error' });
    }
}

export function getTreesHandler(_req: Request, res: Response): void {
    res.json(fetchAllTrees());
}

export function getTreeHandler(req: Request, res: Response): void {
    const treeId = Number(req.params['treeId']);
    if (isNaN(treeId)) { res.status(400).json({ error: 'treeId must be a number' }); return; }
    try {
        res.json(fetchTree(treeId));
    } catch (err) {
        if (err instanceof NotFoundError) { res.status(404).json({ error: err.message }); return; }
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getWarningStatusHandler(req: Request, res: Response): Promise<void> {
    const { userId } = req.params as { userId: string };
    try {
        const status = await getWarningStatus(userId);
        res.json(status);
    } catch (err) {
        if (err instanceof NotFoundError) { res.status(404).json({ error: err.message }); return; }
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function useFertilizerHandler(req: Request, res: Response): Promise<void> {
    const { userId } = req.params as { userId: string };
    try {
        const state = await useFertilizer(userId);
        res.json(state);
    } catch (err) {
        if (err instanceof NotFoundError) { res.status(404).json({ error: err.message }); return; }
        if (err instanceof ConflictError) { res.status(409).json({ error: err.message }); return; }
        if (err instanceof ValidationError) { res.status(400).json({ error: err.message }); return; }
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function updateTreeIdHandler(req: Request, res: Response): Promise<void> {
    const { userId } = req.params as { userId: string };
    const { treeId } = req.body as { treeId?: unknown };
    const newTreeId = Number(treeId);
    if (isNaN(newTreeId) || newTreeId <= 0) {
        res.status(400).json({ error: 'treeId must be a positive number' });
        return;
    }
    try {
        const state = await updateTreeId(userId, newTreeId);
        res.json(state);
    } catch (err) {
        if (err instanceof NotFoundError) { res.status(404).json({ error: err.message }); return; }
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getCompletedTreesHandler(req: Request, res: Response): Promise<void> {
    const { userId } = req.params as { userId: string };
    try {
        const trees = await fetchCompletedTrees(userId);
        res.json(trees);
    } catch (err) {
        if (err instanceof NotFoundError) { res.status(404).json({ error: err.message }); return; }
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function declineFertilizerHandler(req: Request, res: Response): Promise<void> {
    const { userId } = req.params as { userId: string };
    try {
        const state = await declineFertilizer(userId);
        res.json(state);
    } catch (err) {
        if (err instanceof NotFoundError) { res.status(404).json({ error: err.message }); return; }
        if (err instanceof ConflictError) { res.status(409).json({ error: err.message }); return; }
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getStreakHandler(req: Request, res: Response): Promise<void> {
    const { userId } = req.params as { userId: string };
    try {
        const streak = await getStreak(userId);
        res.json(streak);
    } catch (err) {
        if (err instanceof NotFoundError) { res.status(404).json({ error: err.message }); return; }
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getUserProfileHandler(req: Request, res: Response): Promise<void> {
    const { userId } = req.params as { userId: string };
    try {
        const snap = await db.doc(`users/${userId}`).get();
        if (!snap.exists) { res.status(404).json({ error: 'User not found' }); return; }
        const data = snap.data() as { name?: string; email?: string };
        res.json({ name: data.name ?? 'Friend', email: data.email ?? '' });
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
}
