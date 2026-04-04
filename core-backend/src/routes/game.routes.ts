import { Router } from 'express';
import {
    getGameStateHandler,
    getTreesHandler,
    getTreeHandler,
    useFertilizerHandler,
    declineFertilizerHandler,
    getWarningStatusHandler,
} from '../controllers/game.controller.js';

const router = Router();

// GET /api/game/trees  (must be before /:userId to avoid conflict)
router.get('/trees', getTreesHandler);

// GET /api/game/trees/:treeId
router.get('/trees/:treeId', getTreeHandler);

// GET /api/game/:userId/state
router.get('/:userId/state', getGameStateHandler);

// GET /api/game/:userId/warning-status
router.get('/:userId/warning-status', getWarningStatusHandler);

// POST /api/game/:userId/fertilizer/use
router.post('/:userId/fertilizer/use', useFertilizerHandler);

// POST /api/game/:userId/fertilizer/decline
router.post('/:userId/fertilizer/decline', declineFertilizerHandler);

export default router;
