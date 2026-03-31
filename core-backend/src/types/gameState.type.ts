import { TreePhase } from './tree.type.js';

export interface GameState {
  coins: number;
  water: number;
  currentTreeId: number;
  currentPhase: TreePhase;
  fertilizer: number;
  lastUpdated: Date;
}