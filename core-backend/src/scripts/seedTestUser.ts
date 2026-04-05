// Run once to seed a test user into Firestore:
//   npx ts-node --esm src/scripts/seedTestUser.ts

import { db } from '../database/configFirestore.js';
import { TreePhase } from '../types/tree.type.js';

const TEST_USER_ID = 'testUser123';

const user = {
    email: 'test@depauw.edu',
    streak: {
        fullCompletionDays: 0,
        partialCompletionDays: 0,
        zeroCompletionDays: 4,   // 4 = triggers day 5 wellness check
        lastFullCompletionDate: new Date(),
        lastZeroDate: new Date(),
        warningIssued: false,
    },
};

const gameState = {
    coins: 50,
    waterAppliedToPhase: 2,
    currentTreeId: 1,
    currentPhase: TreePhase.Seedling,
    fertilizer: 3,
    pendingDegradation: false,  // false so wellness check shows instead of fertilizer modal
    lastUpdated: new Date(),
};

await db.doc(`users/${TEST_USER_ID}`).set(user);
await db.doc(`users/${TEST_USER_ID}/gameState/data`).set(gameState);

console.log(`Seeded user "${TEST_USER_ID}" with pendingDegradation=true and fertilizer=3`);
console.log(`Test endpoints:`);
console.log(`  POST /api/game/${TEST_USER_ID}/fertilizer/use`);
console.log(`  POST /api/game/${TEST_USER_ID}/fertilizer/decline`);

process.exit(0);
