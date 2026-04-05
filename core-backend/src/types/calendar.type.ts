export enum CalendarCompletionState {
    COMPLETE = 'complete',
    PARTIAL = 'partial',
    NONE = 'none',
};

export interface CalendarCompletionMap {
    [date: string]: CalendarCompletionState;
}