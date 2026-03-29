import { TreePhase } from './forest.type.js';

export default interface Tree {
    name: string;
    phases: TreePhase[];
    waterRequiredPerPhase: number;
    totalWaterRequired: number;
    rewardCoins: number;
}
