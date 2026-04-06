import { getFirestore } from 'firebase/firestore';
// firebase.ts (imported by auth) already initializes the default Firebase app.
// getFirestore() with no args uses that default app.
export const db = getFirestore();