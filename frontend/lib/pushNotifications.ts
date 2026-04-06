import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { saveToken } from "@/lib/notifications";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: false,
    }),
});

/**
 * Requests push notification permissions, obtains the Expo push token,
 * and saves it to the backend associated with the given userId.
 * Returns the token string, or null if the device is a simulator,
 * permissions are denied, or the token fetch fails.
 */
export async function initializePushNotifications(userId: string): Promise<string | null> {
    if (!Device.isDevice) return null;

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    console.log(finalStatus);

    try {
        const projectId: string | undefined =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;

        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

        console.log(token);

        await saveToken(token, userId);

        return token;
    } catch {
        return null;
    }
}
