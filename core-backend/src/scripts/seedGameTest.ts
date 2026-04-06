// Game-logic test seed — run with:
//   npm run seed:game
//
// Writes a confirmed (but not finalized) daily task doc so the app skips
// recommendation setup and lands straight on the home screen ready to finalize.
// Edit the CONFIG block below to set up whichever scenario you want to test.

import { db } from '../database/configFirestore.js';
import { TreePhase } from '../types/tree.type.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — edit these values to set up your test scenario
// ─────────────────────────────────────────────────────────────────────────────

const USER_ID = 'testUser123';

// ── Game state ────────────────────────────────────────────────────────────────
// Uncomment the scenario you want to test.

// SCENARIO A: Normal phase advance (water 6/7, full completion → Young Tree)
const GAME_STATE = {
    coins: 62,
    currentTreeId: 1,           // 1 = Oak Sapling, 2 = Cherry Blossom, 3 = Cactus
    currentPhase: TreePhase.Full,
    waterAppliedToPhase: 6,     // one more full day → advance to Young Tree
    fertilizer: 2,
    pendingDegradation: false,
    lastUpdated: new Date(),
};

// SCENARIO B: Tree completion (set currentPhase: TreePhase.Full, water: 6)
// const GAME_STATE = {
//     coins: 62,
//     currentTreeId: 1,
//     currentPhase: TreePhase.Full,
//     waterAppliedToPhase: 6,    // one more full day → tree done, advance to tree 2
//     fertilizer: 2,
//     pendingDegradation: false,
//     lastUpdated: new Date(),
// };

// SCENARIO C: Streak milestone (fullCompletionDays: 6 → one more full day hits 7)
// const GAME_STATE = {
//     coins: 50,
//     currentTreeId: 1,
//     currentPhase: TreePhase.Seedling,
//     waterAppliedToPhase: 3,
//     fertilizer: 1,
//     pendingDegradation: false,
//     lastUpdated: new Date(),
// };

// SCENARIO D: Degradation warning test (zeroCompletionDays: 6, pendingDegradation: false)
// const GAME_STATE = {
//     coins: 30,
//     currentTreeId: 1,
//     currentPhase: TreePhase.Young,
//     waterAppliedToPhase: 4,
//     fertilizer: 0,              // no fertilizer → regression if warning fires
//     pendingDegradation: false,
//     lastUpdated: new Date(),
// };

// ── Streak ────────────────────────────────────────────────────────────────────
const STREAK = {
    fullCompletionDays: 20,      // change to 20 to test non-milestone continuation
    partialCompletionDays: 0,
    zeroCompletionDays: 0,      // change to 6 for scenario D
    lastFullCompletionDate: new Date(),
    lastZeroDate: new Date(),
    warningIssued: false,
};

// ── Today's tasks ─────────────────────────────────────────────────────────────
// All tasks start uncompleted. Mark isCompleted: true on any you want pre-done.
// For FULL completion bonus (water + coins): complete ALL tasks.
// For PARTIAL: complete at least one but not all.
// For ZERO: leave all uncompleted and skip finalize (or complete none and finalize).
const TODAY = new Date().toISOString().split('T')[0]!;

const TASKS = [
    {
        taskId: 'task-001',
        title: 'Go for a 20-minute walk',
        type: 'wellness',
        eventId: null,
        isCompleted: false,
        description: 'Take a walk around campus or your neighborhood.',
        goals: ['physical wellness'],
    },
    {
        taskId: 'task-002',
        title: 'Journal for 10 minutes',
        type: 'wellness',
        eventId: null,
        isCompleted: false,
        description: 'Write about your thoughts and feelings for the day.',
        goals: ['mental health'],
    },
    {
        taskId: 'task-003',
        title: 'Call or text a friend',
        type: 'wellness',
        eventId: null,
        isCompleted: false,
        description: 'Reach out and connect with someone you care about.',
        goals: ['social connection'],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Seed
// ─────────────────────────────────────────────────────────────────────────────

const user = {
    email: 'test@depauw.edu',
    name: 'Tra',
    goals: ['physical wellness', 'academic success', 'social connection', 'mental health', 'career growth'],
    preferences: { notificationsEnabled: true },
    streak: STREAK,
};

const dailyTaskDoc = {
    date: new Date(TODAY),
    tasks: TASKS,
    confirmed: true,   // skips recommendation setup screen
    finalized: false,  // not yet finalized — ready to complete tasks and finalize
};

await db.doc(`users/${USER_ID}`).set(user);
console.log(`✓ user written (streak: ${STREAK.fullCompletionDays} full days)`);

await db.doc(`users/${USER_ID}/gameState/data`).set(GAME_STATE);
console.log(`✓ gameState written (tree ${GAME_STATE.currentTreeId}, phase: ${GAME_STATE.currentPhase}, water: ${GAME_STATE.waterAppliedToPhase}/7)`);

await db.doc(`users/${USER_ID}/dailyTasks/${TODAY}`).set(dailyTaskDoc);
console.log(`✓ dailyTasks/${TODAY} written (${TASKS.length} tasks, confirmed, not finalized)`);

await db.doc(`users/${USER_ID}/recommendations/${TODAY}`).delete();
console.log(`✓ recommendations/${TODAY} cleared`);

console.log(`
Scenarios:
  A (current) — complete all 3 tasks → finalize → ${GAME_STATE.currentPhase} advances one phase
  B           — set phase: Full, water: 6 → finalize → tree complete + new tree starts
  C           — set streak fullCompletionDays: 6 → finalize → 7-day streak reward
  D           — set zeroCompletionDays: 6, fertilizer: 0 → finalize without tasks → degradation warning
`);
