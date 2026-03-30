import { TreePhase } from './tree.type.js';

export interface GameState {
  coins: number;
  water: number;
  currentTreeId: string;
  currentPhase: TreePhase;
  fertilizer: number;
  lastUpdated: Date;
}