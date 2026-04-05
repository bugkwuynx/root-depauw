import { Timestamp } from 'firebase-admin/firestore';

export enum NotificationType {
    REMINDER = 'reminder',
    STREAK_WARNING = 'streak_warning',
    EVENT = 'event',
}

export interface Notification {
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    scheduledAt: Date;
    sentAt: Date;
}

export interface NotificationDocument extends Omit<Notification, 'scheduledAt' | 'sentAt'> {
    scheduledAt: Timestamp;
    sentAt: Timestamp;
}

export function toFirestore(notification: Notification): NotificationDocument {
    return {
        ...notification,
        scheduledAt: Timestamp.fromDate(notification.scheduledAt),
        sentAt: Timestamp.fromDate(notification.sentAt),
    };
}

export function fromFirestore(doc: NotificationDocument): Notification {
    return {
        ...doc,
        scheduledAt: doc.scheduledAt.toDate(),
        sentAt: doc.sentAt.toDate(),
    };
}