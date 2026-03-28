import { Stack } from 'expo-router';

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