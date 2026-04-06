import { Stack } from "expo-router";
import React from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean | null>(
    auth.currentUser !== null  // non-null if session was restored from AsyncStorage
  );

  React.useEffect(() => {
    return onAuthStateChanged(auth, (user) => setIsLoggedIn(user !== null));
  }, []);

  // Wait for auth state to be confirmed before rendering any screen.
  if (isLoggedIn === null) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <Stack.Screen name="home" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      )}
      <Stack.Screen name="tasks" options={{ headerShown: false }} />
      <Stack.Screen name="trees" options={{ headerShown: false }} />
      <Stack.Screen name="setting-view" options={{ headerShown: false }} />
      <Stack.Screen name="calendar-view" options={{ headerShown: false }} />
    </Stack>
  );
}
