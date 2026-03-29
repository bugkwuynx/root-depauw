import {initializeApp, cert, type App} from 'firebase-admin/app';
import {getFirestore, type Firestore} from 'firebase-admin/firestore';

import serviceAccountCredentials from '../credentials/service-account-file.json' with {type: 'json'};

const adminApp: App = initializeApp({
    credential: cert(serviceAccountCredentials as any)
});

export const db: Firestore = getFirestore(adminApp);
