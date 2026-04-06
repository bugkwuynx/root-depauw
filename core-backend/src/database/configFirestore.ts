import {initializeApp, cert, type App, getApps, getApp} from 'firebase-admin/app';
import {getFirestore, type Firestore} from 'firebase-admin/firestore';
import {createRequire} from 'module';

const loadServiceAccount = (): object => {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    }
    // Local dev fallback: load from file
    const require = createRequire(import.meta.url);
    return require('../credentials/service-account-file.json') as object;
};

const intializeAppOptions = () => {
    if (getApps().length === 0) {
        return initializeApp({credential: cert(loadServiceAccount() as any)});
    }
    return getApp();
}

const adminApp: App = intializeAppOptions();

export const db: Firestore = getFirestore(adminApp);
