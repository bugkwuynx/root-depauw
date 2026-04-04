import { Timestamp } from 'firebase-admin/firestore';

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

export interface UserDocument extends Omit<User, 'createdAt' | 'lastLogin' | 'goalsUpdatedAt' | 'streak'> {
  createdAt: Timestamp;
  lastLogin: Timestamp;
  goalsUpdatedAt: Timestamp;
  streak: Omit<UserStreak, 'lastFullCompletionDate' | 'lastZeroDate'> & {
    lastFullCompletionDate: Timestamp;
    lastZeroDate: Timestamp;
  };
}

export function toFirestore(user: User): UserDocument {
  return {
    ...user,
    createdAt: Timestamp.fromDate(user.createdAt),
    lastLogin: Timestamp.fromDate(user.lastLogin),
    goalsUpdatedAt: Timestamp.fromDate(user.goalsUpdatedAt),
    streak: {
      ...user.streak,
      lastFullCompletionDate: Timestamp.fromDate(user.streak.lastFullCompletionDate),
      lastZeroDate: Timestamp.fromDate(user.streak.lastZeroDate),
    },
  };
}

export function fromFirestore(doc: UserDocument): User {
  return {
    ...doc,
    createdAt: doc.createdAt.toDate(),
    lastLogin: doc.lastLogin.toDate(),
    goalsUpdatedAt: doc.goalsUpdatedAt.toDate(),
    streak: {
      ...doc.streak,
      lastFullCompletionDate: doc.streak.lastFullCompletionDate.toDate(),
      lastZeroDate: doc.streak.lastZeroDate.toDate(),
    },
  };
}