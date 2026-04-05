import { sendExpoNotifications } from "../services/notification.service.js";
import type { ExpoMessage } from "../types/expo.type.js";
import { db } from "../database/configFirestore.js";

const today = () => new Date().toISOString().split("T")[0]!;

/**
 * Fetches all Expo push tokens from the tokens collection.
 * Returns a flat array of token strings.
 */
async function getAllTokens(): Promise<string[]> {
    const snap = await db.collection("tokens").get();
    return snap.docs.map((doc) => doc.data().token as string).filter(Boolean);
}

/**
 * Fetches the Expo push token(s) associated with a specific user.
 * Requires tokens to be saved with a `userId` field.
 */
async function getTokensForUser(userId: string): Promise<string[]> {
    const snap = await db
        .collection("tokens")
        .where("userId", "==", userId)
        .get();
    return snap.docs.map((doc) => doc.data().token as string).filter(Boolean);
}

/**
 * Returns the count of incomplete tasks for a user on today's date.
 * Returns null if no daily task document exists for today.
 */
async function getIncompleteTaskCount(
    userId: string,
    date: string
): Promise<number | null> {
    const snap = await db.doc(`users/${userId}/dailyTasks/${date}`).get();
    if (!snap.exists) return null;

    const data = snap.data() as {
        tasks?: Array<{ isCompleted: boolean }>;
        confirmed?: boolean;
    };

    // Only count tasks if the day has been confirmed
    if (!data.confirmed) return null;

    const tasks = data.tasks ?? [];
    return tasks.filter((t) => !t.isCompleted).length;
}

/**
 * Morning notification (runs at ~8am):
 * Sends a broadcast to all registered devices asking users to confirm their task list for the day.
 */
export async function sendDailyNotifications(): Promise<void> {
    console.log("[notificationJob] sendDailyNotifications started");

    const tokens = await getAllTokens();

    if (tokens.length === 0) {
        console.log("[notificationJob] No tokens registered, skipping morning notification");
        return;
    }

    const messages: ExpoMessage[] = tokens.map((token) => ({
        to: token,
        title: "Good morning! 🌱",
        body: "Ready to grow today? Confirm your task list and let's get started!",
        sound: "default",
        priority: "high",
        data: { type: "daily_confirm" },
    }));

    try {
        const tickets = await sendExpoNotifications(messages);
        const failed = tickets.filter((t) => t.status === "error").length;
        console.log(
            `[notificationJob] Morning notifications sent to ${tickets.length} devices, ${failed} failed`
        );
    } catch (err) {
        console.error("[notificationJob] Failed to send morning notifications:", err);
    }
}

/**
 * Reminder notification (runs at 12pm and 6:30pm):
 * For each user, counts their remaining incomplete tasks for today and sends
 * a personalised reminder. Users with no remaining tasks are skipped.
 */
export async function sendReminderNotifications(): Promise<void> {
    console.log("[notificationJob] sendReminderNotifications started");

    const usersSnap = await db.collection("users").get();
    const date = today();

    const messages: ExpoMessage[] = [];

    await Promise.all(
        usersSnap.docs.map(async (userDoc) => {
            const userId = userDoc.id;

            const incompleteCount = await getIncompleteTaskCount(userId, date);

            // Skip users with no task document, unconfirmed task lists, or all tasks done
            if (incompleteCount === null || incompleteCount === 0) return;

            const tokens = await getTokensForUser(userId);
            if (tokens.length === 0) return;

            const taskWord = incompleteCount === 1 ? "task" : "tasks";
            const body = `You still have ${incompleteCount} ${taskWord} left today. Keep going — you're almost there!`;

            for (const token of tokens) {
                messages.push({
                    to: token,
                    title: "Don't forget your tasks! ⏰",
                    body,
                    sound: "default",
                    priority: "high",
                    data: { type: "reminder", incompleteCount },
                });
            }
        })
    );

    if (messages.length === 0) {
        console.log("[notificationJob] No reminder notifications to send (all users done or no tokens)");
        return;
    }

    try {
        const tickets = await sendExpoNotifications(messages);
        const failed = tickets.filter((t) => t.status === "error").length;
        console.log(
            `[notificationJob] Reminder notifications sent to ${tickets.length} devices, ${failed} failed`
        );
    } catch (err) {
        console.error("[notificationJob] Failed to send reminder notifications:", err);
    }
}
