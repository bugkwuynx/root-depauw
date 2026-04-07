import { SaveTokenResponse, SaveTokenPayload, GetDevicesResponse, SendNotificationPayload, SendToAllResponse, SendToAllPayload, SendToOneResponse, SendToOnePayload } from "@/types/notification.type";
import * as ExpoNotifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3000";

/**
 * Core fetch wrapper
 */
async function request<TResponse>(
    endpoint: string,
    options?: RequestInit
): Promise<TResponse> {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers: {"Content-Type": "application/json"},
        ...options
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message ?? `Request failed with status ${response.status}`);
    }

    return response.json() as Promise<TResponse>;
}

/**
 * TOKEN
 */

/**
 * Requests push notification permissions and returns the Expo push token.
 * Returns null if running on a simulator, permissions are denied, or token fetch fails.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) return null;

    if (Platform.OS === "android") {
        await ExpoNotifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: ExpoNotifications.AndroidImportance.MAX,
        });
    }

    const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync();

    console.log(existingStatus);

    let finalStatus = existingStatus;

    console.log(finalStatus);

    if (existingStatus !== "granted") {
        const { status } = await ExpoNotifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    try {
        const { data } = await ExpoNotifications.getExpoPushTokenAsync();
        return data;
    } catch {
        return null;
    }
}

/**
 * Saves the device's Expo push token to the backend
 * Call this once after the token is registered on app launch.
 */
export async function saveToken(token: string, userId: string): Promise<SaveTokenResponse> {
    const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://10.36.116.30:3000/";

    console.log("Saving token: ", token, " for userId: ", userId);

    const payload: SaveTokenPayload = { token, userId };

    console.log("Payload for saving token: ", payload);

    console.log(`${BASE_URL}api/notifications/save-token`);

    const response = await fetch(`${BASE_URL}api/notifications/save-token`, {
        method: "POST",
        body: await JSON.stringify(payload),
        headers: {
            "Content-Type": "application/json",
        },
    });

    console.log("Response from saving token: ", response);

    if (!response.ok) {
        throw new Error(response.statusText || "Failed to save token");
    }

    const responseData = await response.json();

    return responseData as SaveTokenResponse;
}

/**
 * DEVICE
 */

/**
 * Fetches all registered device tokens from the backend
 * Useful for building a device picker UI
 */
export async function getDevices(): Promise<GetDevicesResponse> {
    return request<GetDevicesResponse>("/notifications/devices");
}

/**
 * SEND
 */

/**
 * Sends a push notification to ALL registered devices
 */
export async function sendToAll(
    payload: SendToAllPayload
): Promise<SendToAllResponse> {
    return request<SendToAllResponse>("/notifications/send-to-all", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

/**
 * Sends a push notification to ONE specific device by token
 */
export async function sendToOne(
    payload: SendToOnePayload
): Promise<SendToOneResponse> {
    return request<SendToOneResponse>("/notifications/send-to-one", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

const notificationService = {
    saveToken,
    getDevices,
    sendToAll,
    sendToOne,
};

export default notificationService;