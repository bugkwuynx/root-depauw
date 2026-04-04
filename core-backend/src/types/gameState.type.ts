import { TreePhase } from './tree.type.js';

export interface GameState {
  coins: number;
  waterAppliedToPhase: number;
  currentTreeId: number;
  currentPhase: TreePhase;
  fertilizer: number;
  pendingDegradation: boolean;
  lastUpdated: Date;
}