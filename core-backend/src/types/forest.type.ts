export enum TreePhase {
  Seed = "seed",
  Seedling = "seedling",
  Sapling = "sapling",
  Young = "young",
  Full = "full"
}

export interface Forest {
  treeID: string;
  treeIdRef: string;
  currentPhase: TreePhase;
  waterAccumulated: number;
  isCompleted: boolean;
  plantedAt: Date;
  completedAt: Date | null; 
}