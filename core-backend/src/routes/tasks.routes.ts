import { Router } from 'express';
import {
    getTasksHandler,
    completeTaskHandler,
    finalizeDayHandler,
    confirmSetupHandler,
} from '../controllers/tasks.controller.js';

const router = Router();

// GET /api/tasks/:userId/:date
router.get('/:userId/:date', getTasksHandler);

// POST /api/tasks/:userId/:date/confirm-setup
router.post('/:userId/:date/confirm-setup', confirmSetupHandler);

// PATCH /api/tasks/:userId/:date/complete
router.patch('/:userId/:date/complete', completeTaskHandler);

// POST /api/tasks/:userId/:date/finalize
router.post('/:userId/:date/finalize', finalizeDayHandler);

export default router;
