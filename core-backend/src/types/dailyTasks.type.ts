export interface Task {
    taskId: string;
    title: string;
    type: string;
    eventId: string | null;
    isCompleted: boolean;
}

export default interface DailyTask {
    date: string;
    tasks: Task[];
}