import {initializeApp, cert, type App, getApps, getApp} from 'firebase-admin/app';
import {getFirestore, type Firestore} from 'firebase-admin/firestore';

import serviceAccountCredentials from '../credentials/service-account-file.json' with {type: 'json'};

const intializeAppOptions = () => {
    if (getApps.length === 0) {
        return initializeApp({credential: cert(serviceAccountCredentials as any)});
    }
    return getApp();
}

const adminApp: App = intializeAppOptions();

export const db: Firestore = getFirestore(adminApp);
