import { Stack } from 'expo-router';
<<<<<<< HEAD

export default function RootLayout() {
    const isLoggedIn = true;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            {isLoggedIn ? (
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            ) : (
                <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            )}
            <Stack.Screen name="setting-view" options={{ headerShown: false }} />
            <Stack.Screen name="calendar-view" options={{ headerShown: false }} />
        </Stack>
    )
}
=======
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
>>>>>>> 0dde567275ffe0ee0918a84b9c449a790201b820
