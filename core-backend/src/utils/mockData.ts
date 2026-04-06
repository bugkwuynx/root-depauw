import { TreePhase } from '../types/tree.type.js';
import type Tree from '../types/tree.type.js';

const ALL_PHASES: TreePhase[] = [
    TreePhase.Seed,
    TreePhase.Seedling,
    TreePhase.Sapling,
    TreePhase.Young,
    TreePhase.Full,
];

export const TREES: Tree[] = [
    {
        treeId: 1,
        name: 'Oak Sapling',
        phases: ALL_PHASES,
        waterRequiredPerPhase: 7,
        totalWaterRequired: 35,
        rewardCoins: 100,
    },
    {
        treeId: 2,
        name: 'Cherry Blossom',
        phases: ALL_PHASES,
        waterRequiredPerPhase: 7,
        totalWaterRequired: 35,
        rewardCoins: 100,
    },
    {
        treeId: 3,
        name: 'Cactus',
        phases: ALL_PHASES,
        waterRequiredPerPhase: 7,
        totalWaterRequired: 35,
        rewardCoins: 100,
    },
];

export const MAX_TREE_ID = 3;

export function getTreeById(treeId: number): Tree | undefined {
    return TREES.find((t) => t.treeId === treeId);
}
