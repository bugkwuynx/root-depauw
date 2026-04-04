import { Notification } from "expo-notifications";

export interface PushNotificationState {
    expoPushToken: string | null;
    notification: Notification | null;
    error: Error | null;
    isLoading: boolean;
}

export interface SendNotificationPayload {
    title: string;
    body: string;
    data?: Record<string, unknown>;
}

export interface ExpoTicket {
    status: "ok" | "error";
    id?: string;
    message?: string;
    details?: Record<string, unknown>;
}

export interface SaveTokenPayload {
    token: string;
}

export interface SendToAllPayload {
    title: string;
    body: string;
    data?: Record<string, unknown>;
}

export interface SendToOnePayload {
    token: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
}

export interface BaseResponse {
    success: boolean;
    message?: string;
}

export interface SaveTokenResponse extends BaseResponse {};

export interface SendToAllResponse extends BaseResponse {
    count: number;
    tickets: ExpoTicket[];
}

export interface SendToOneResponse extends BaseResponse {
    tickets: ExpoTicket[];
}

export interface GetDevicesResponse {
    count: number;
    token: string[];
}


