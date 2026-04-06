// Run once to seed a test user into Firestore:
//   npx ts-node --esm src/scripts/seedTestUser.ts

import { db } from '../database/configFirestore.js';
import { TreePhase } from '../types/tree.type.js';

const TEST_USER_ID = 'testUser123';

const user = {
    email: 'test@depauw.edu',
    name: 'Tra',
    goals: ['physical wellness', 'academic success', 'social connection', 'mental health', 'career growth'],
    preferences: { notificationsEnabled: true },
    streak: {
        fullCompletionDays: 20,
        partialCompletionDays: 0,
        zeroCompletionDays: 0,
        lastFullCompletionDate: new Date(),
        lastZeroDate: new Date(),
        warningIssued: false,
    },
};

const gameState = {
    coins: 62,
    waterAppliedToPhase: 6,
    currentTreeId: 1,
    currentPhase: TreePhase.Full,
    fertilizer: 4,
    pendingDegradation: false,   // set true so fertilizer endpoints are testable immediately
    lastUpdated: new Date(),
};

const TODAY = new Date().toISOString().split('T')[0]!;

await db.doc(`users/${TEST_USER_ID}`).set(user);
console.log(`✓ user written (zeroCompletionDays=${user.streak.zeroCompletionDays})`);

await db.doc(`users/${TEST_USER_ID}/gameState/data`).set(gameState);
console.log(`✓ gameState written (coins=${gameState.coins}, pendingDegradation=${gameState.pendingDegradation})`);

await db.doc(`users/${TEST_USER_ID}/dailyTasks/${TODAY}`).delete();
console.log(`✓ dailyTasks/${TODAY} cleared`);

await db.doc(`users/${TEST_USER_ID}/recommendations/${TODAY}`).delete();
console.log(`✓ recommendations/${TODAY} cleared`);

console.log(`\nDone — no process.exit so writes fully flush before Node exits`);
