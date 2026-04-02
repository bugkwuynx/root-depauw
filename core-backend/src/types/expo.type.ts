import type { Request } from "express";

export interface ExpoMessage {
    to: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    sound?: "default" | null;
    priority?: "high" | "normal" | "default";
}

export interface ExpoTicket {
    status: "ok" | "error";
    id?: string;
    message?: string;
    details?: Record<string, unknown>;
}

export interface ExpoPushResponse {
    data: ExpoTicket[];
}

export interface SaveTokenRequest extends Request {
    body: {
        token: string;
    }
}

export interface SendToDeviceRequest extends Request {
    body: {
        token: string;
        title: string;
        body: string;
        data?: Record<string, unknown>;
    }
}

