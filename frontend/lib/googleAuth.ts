import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [request, , promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: [
      'openid',
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar.freebusy',
    ],
    redirectUri: 'https://auth.expo.io/@minhkhuedoanthi/frontend',
  });

  const startGoogleSignIn = async () => {
    const result = await promptAsync();

    if (result.type !== 'success' || !result.authentication) {
      throw new Error('Google sign-in cancelled');
    }

    const { idToken } = result.authentication;
    if (!idToken) throw new Error('No ID token returned from Google');

    const credential = GoogleAuthProvider.credential(idToken);
    return signInWithCredential(auth, credential);
  };

  return { request, startGoogleSignIn };
}