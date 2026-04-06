import { Timestamp } from 'firebase-admin/firestore';

export interface Task {
    taskId: string;
    title: string;
    type: string;
    eventId: string | null;
    isCompleted: boolean;
    description?: string;
    goals?: string[];
}

export interface DailyTask {
    date: Date;
    tasks: Task[];
}

export interface DailyTaskDocument extends Omit<DailyTask, 'date'> {
    date: Timestamp;
}

export function toFirestore(dailyTask: DailyTask): DailyTaskDocument {
    return {
        ...dailyTask,
        date: Timestamp.fromDate(dailyTask.date),
    };
}

export function fromFirestore(doc: DailyTaskDocument): DailyTask {
    return {
        ...doc,
        date: doc.date.toDate(),
    };
}