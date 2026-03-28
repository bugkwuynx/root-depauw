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