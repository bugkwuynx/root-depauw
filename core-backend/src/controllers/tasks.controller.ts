import type { Request, Response } from 'express';
import { confirmDaySetup, getDailyTasks, markTaskComplete, finalizeDay, getCalendarCompletion } from '../services/tasks.service.js';
import type { Task } from '../types/dailyTasks.type.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';

export async function getTasksHandler(req: Request, res: Response): Promise<void> {
    const { userId, date } = req.params as { userId: string; date: string };
    try {
        const tasks = await getDailyTasks(userId, date);
        res.json(tasks);
    } catch (err) {
        if (err instanceof NotFoundError) { res.status(404).json({ error: err.message }); return; }
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function completeTaskHandler(req: Request, res: Response): Promise<void> {
    const { userId, date } = req.params as { userId: string; date: string };
    const { taskId } = req.body as { taskId?: string };
    if (!taskId) { res.status(400).json({ error: 'taskId is required' }); return; }
    try {
        const task = await markTaskComplete(userId, date, taskId);
        res.json(task);
    } catch (err) {
        if (err instanceof NotFoundError) { res.status(404).json({ error: err.message }); return; }
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function confirmSetupHandler(req: Request, res: Response): Promise<void> {
    const { userId, date } = req.params as { userId: string; date: string };
    const body = req.body as { tasks?: Task[] } | undefined;
    const tasks = body?.tasks;
    if (!tasks || !Array.isArray(tasks)) {
        res.status(400).json({ error: 'tasks array is required' });
        return;
    }
    try {
        const result = await confirmDaySetup(userId, date, tasks);
        res.json(result);
    } catch (err) {
        if (err instanceof ConflictError) { res.status(409).json({ error: err.message }); return; }
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getCalendarHandler(req: Request, res: Response): Promise<void> {
    const { userId } = req.params as { userId: string };
    const { year, month } = req.query as { year?: string; month?: string };
    if (!year || !month) { res.status(400).json({ error: 'year and month query params are required' }); return; }
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) { res.status(400).json({ error: 'Invalid year or month' }); return; }
    try {
        const map = await getCalendarCompletion(userId, y, m);
        res.json(map);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function finalizeDayHandler(req: Request, res: Response): Promise<void> {
    const { userId, date } = req.params as { userId: string; date: string };
    try {
        const result = await finalizeDay(userId, date);
        res.json(result);
    } catch (err) {
        if (err instanceof NotFoundError) { res.status(404).json({ error: err.message }); return; }
        if (err instanceof ConflictError) { res.status(409).json({ error: err.message }); return; }
        res.status(500).json({ error: 'Internal server error' });
    }
}
