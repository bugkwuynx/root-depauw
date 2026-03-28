export enum TreePhase {
  Seed = "seed",
  Seedling = "seedling",
  Sapling = "sapling",
  Young = "young",
  Full = "full"
}

export interface GameState {
  coins: number;
  water: number;
  currentTreeId: string;
  currentTreeProgress: number;
  currentPhase: TreePhase;
  fertilizer: number;
  lastUpdated: Date;
}