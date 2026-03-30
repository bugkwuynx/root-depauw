export enum TreePhase {
  Seed = "seed",
  Seedling = "seedling",
  Sapling = "sapling",
  Young = "young",
  Full = "full"
}

export default interface Tree {
    name: string;
    phases: TreePhase[];
    waterRequiredPerPhase: number;
    totalWaterRequired: number;
    rewardCoins: number;
}
