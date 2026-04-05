import { db } from "../database/configFirestore.js";
import type { Setting } from "../types/setting.type.js";
import type User from "../types/user.type.js";

export async function getSetting(userId: string): Promise<Setting> {
    const getUserResult = await db.collection("users").doc(userId).get();
    if (!getUserResult.exists) {
        throw new Error("User not found");
    }
    const user: User = getUserResult.data() as User;

    return {
        goals: user.goals,
        displayName: user.name,
        remindersEnabled: user.preferences.notificationsEnabled,
        preferEmptyGoalsList: false,
    };
}

export async function patchSetting(userId: string, newSetting: Partial<Setting>): Promise<void> {
    const updates: Record<string, unknown> = {};
    if (newSetting.goals !== undefined) updates.goals = newSetting.goals;
    if (newSetting.displayName !== undefined) updates.name = newSetting.displayName;
    if (newSetting.remindersEnabled !== undefined) updates["preferences.notificationsEnabled"] = newSetting.remindersEnabled;

    if (Object.keys(updates).length === 0) return;

    const result = await db.collection("users").doc(userId).update(updates);
    if (!result) {
        throw new Error("Failed to patch setting");
    }
}

export async function updateSetting(userId: string, newSetting: Setting): Promise<void> {
    const updateSettingResult = await db.collection("users").doc(userId).update({
        goals: newSetting.goals,
        name: newSetting.displayName,
        "preferences.notificationsEnabled": newSetting.remindersEnabled,
    });

    if (!updateSettingResult) {
        throw new Error("Failed to update setting");
    }

    return;
}