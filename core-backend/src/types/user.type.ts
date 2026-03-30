export interface UserPreferences {
    notificationsEnabled: boolean;
}

export interface UserStreak {
    fullCompletionDays: number;
    partialCompletionDays: number;
    zeroCompletionDays: number;
    lastFullCompletionDate: Date;
    lastZeroDate: Date;
    warningIssued: boolean;
}

export default interface User {
    // Profile
    email: string;
    name: string;
    createdAt: Date;
    lastLogin: Date;
    authProvider: "google" | "email";
    preferences: UserPreferences;

    // Goals
    goals: string[];
    goalsUpdatedAt: Date;

    // Streak
    streak: UserStreak;
}
