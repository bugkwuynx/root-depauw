import { TreePhase } from './forest.type.js';

export interface GameState {
  coins: number;
  water: number;
  currentTreeId: string;
  currentTreeProgress: number;
  currentPhase: TreePhase;
  fertilizer: number;
  lastUpdated: Date;
}