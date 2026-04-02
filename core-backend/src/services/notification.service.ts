import type { ExpoMessage, ExpoTicket, ExpoPushResponse } from "../types/expo.type.js";

export async function sendExpoNotifications(
    messages: ExpoMessage[]
): Promise<ExpoTicket[]> {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(messages),
    });

    const result: ExpoPushResponse = await response.json();
    return result.data;
}

