export interface Task {
    taskId: string;
    title: string;
    type: string;
    eventId: string | null;
    isCompleted: boolean;
}

export interface DailyTask {
    date: string;
    tasks: Task[];
}