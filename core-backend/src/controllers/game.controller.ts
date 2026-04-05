import type { Request, Response } from 'express';
import {
    fetchGameState,
    fetchAllTrees,
    fetchTree,
    useFertilizer,
    declineFertilizer,
    getWarningStatus,
    getStreak,
} from '../services/game.service.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';

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
