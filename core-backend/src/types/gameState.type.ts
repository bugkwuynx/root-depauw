import { Timestamp } from 'firebase-admin/firestore';
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

export interface GameStateDocument extends Omit<GameState, 'lastUpdated'> {
  lastUpdated: Timestamp;
}

export function toFirestore(gameState: GameState): GameStateDocument {
  return {
    ...gameState,
    lastUpdated: Timestamp.fromDate(gameState.lastUpdated),
  };
}

export function fromFirestore(doc: GameStateDocument): GameState {
  return {
    ...doc,
    lastUpdated: doc.lastUpdated.toDate(),
  };
}