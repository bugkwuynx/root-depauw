import { SaveTokenResponse, SaveTokenPayload, GetDevicesResponse, SendNotificationPayload, SendToAllResponse, SendToAllPayload, SendToOneResponse, SendToOnePayload } from "@/types/notification.type";

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";

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
 * Saves the device's Expo push token to the backend
 * Call this once after the token is registered on app launch.
 */
export async function saveToken(token: string): Promise<SaveTokenResponse> {
    const payload: SaveTokenPayload = { token };
    return request<SaveTokenResponse>("/notifications/save-token", {
        method: "POST",
        body: JSON.stringify(payload)
    });
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