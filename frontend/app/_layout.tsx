import { Stack } from 'expo-router';

export default function RootLayout() {
    const isLoggedIn = false;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            {isLoggedIn ? (
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            ) : (
                <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            )}
        </Stack>
    )
}