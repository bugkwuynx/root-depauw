import { TreePhase } from './gameState.type.js';

export interface Forest {
  treeID: string;
  treeIdRef: string;
  currentPhase: TreePhase;
  waterAccumulated: number;
  isCompleted: boolean;
  plantedAt: Date;
  completedAt: Date | null; 
}