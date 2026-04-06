/**
 * Seed script for testing finalizeJob.
 *
 * Creates one test user with:
 *   - users/{userId}               (user doc with goals & streak)
 *   - users/{userId}/gameState/data (game state)
 *   - users/{userId}/dailyTasks/{yesterday} (unfinalized tasks)
 *
 * Run:
 *   npx ts-node --esm src/jobs/seedTestData.ts
 * Or after building:
 *   node build/jobs/seedTestData.js
 */

import { db } from '../database/configFirestore.js';
import { TreePhase } from '../types/tree.type.js';
import { FieldValue } from 'firebase-admin/firestore';

const TEST_USER_ID = 'test-user-finalize-job';

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const prevDay = yesterday.toISOString().split('T')[0]!;

async function seed() {
    console.log(`Seeding test data for user "${TEST_USER_ID}", prevDay = ${prevDay}`);

    // 1. User document
    await db.collection('users').doc(TEST_USER_ID).set({
        email: 'testuser@depauw.edu',
        name: 'Test User',
        createdAt: FieldValue.serverTimestamp(),
        lastLogin: FieldValue.serverTimestamp(),
        authProvider: 'email',
        preferences: { notificationsEnabled: false },
        goals: ['academic success', 'mental wellness', 'career growth'],
        goalsUpdatedAt: FieldValue.serverTimestamp(),
        streak: {
            fullCompletionDays: 0,
            partialCompletionDays: 0,
            zeroCompletionDays: 0,
            lastFullCompletionDate: new Date(0),
            lastZeroDate: new Date(0),
            warningIssued: false,
        },
    });
    console.log('  ✓ users/' + TEST_USER_ID);

    // 2. Game state document
    await db.doc(`users/${TEST_USER_ID}/gameState/data`).set({
        coins: 0,
        waterAppliedToPhase: 0,
        currentTreeId: 1,
        currentPhase: TreePhase.Seed,
        fertilizer: 0,
        pendingDegradation: false,
        lastUpdated: FieldValue.serverTimestamp(),
    });
    console.log('  ✓ users/' + TEST_USER_ID + '/gameState/data');

    // 3. Daily tasks for yesterday (unfinalized, mix of completed/incomplete)
    await db.doc(`users/${TEST_USER_ID}/dailyTasks/${prevDay}`).set({
        date: yesterday,
        confirmed: true,
        finalized: false,
        tasks: [
            { taskId: 'task-1', title: 'Review lecture notes', type: 'task', eventId: null, isCompleted: true },
            { taskId: 'task-2', title: 'Go for a 20-min walk', type: 'task', eventId: null, isCompleted: true },
            { taskId: 'task-3', title: 'Read one chapter', type: 'task', eventId: null, isCompleted: false },
        ],
    });
    console.log('  ✓ users/' + TEST_USER_ID + '/dailyTasks/' + prevDay);

    console.log('\nDone. Run finalizeJob to process this user.');
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
