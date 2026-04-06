// Uses Firebase Functions v1 auth trigger — the v2 identity equivalent requires Identity Platform.
// Mixing v1 auth triggers with v2 scheduler functions in the same project is officially supported.
import { auth } from 'firebase-functions/v1';
import type { UserRecord } from 'firebase-functions/v1/auth';
import { db } from '../database/configFirestore.js';

export const initUserProfile = auth.user().onCreate(async (user: UserRecord) => {
  const userRef = db.collection('users').doc(user.uid);

  try {
    const snap = await userRef.get();

    if (snap.exists) {
      // set-goals.tsx already wrote the doc (race: frontend was faster).
      // Merge only the server-owned fields that the frontend doesn't write.
      await userRef.set(
        {
          email: user.email ?? '',
          authProvider: user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
          createdAt: new Date(),
          lastLogin: new Date(),
          preferences: { notificationsEnabled: true },
          streak: {
            fullCompletionDays: 0,
            partialCompletionDays: 0,
            zeroCompletionDays: 0,
            lastFullCompletionDate: new Date(),
            lastZeroDate: new Date(),
            warningIssued: false,
          },
        },
        { merge: true },
      );
      return;
    }

    // Normal case: trigger ran before the user finished set-goals.
    // Create the full doc; name/goals will be merged in by set-goals.tsx.
    await userRef.set({
      email: user.email ?? '',
      name: user.displayName ?? '',   // populated for Google, empty for email sign-up
      authProvider: user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
      createdAt: new Date(),
      lastLogin: new Date(),
      preferences: { notificationsEnabled: true },
      goals: [],
      goalsUpdatedAt: new Date(),
      streak: {
        fullCompletionDays: 0,
        partialCompletionDays: 0,
        zeroCompletionDays: 0,
        lastFullCompletionDate: new Date(),
        lastZeroDate: new Date(),
        warningIssued: false,
      },
    });
  } catch (err) {
    // Never let a Firestore failure block account creation.
    console.error('initUserProfile: failed to write user doc', err);
  }
});
