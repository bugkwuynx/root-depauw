const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export type CalendarDayCompletionState = 'complete' | 'partial' | 'none';

export type CalendarDayCompletionMap = Record<string, CalendarDayCompletionState>;

export type CalendarFetchRange = {
  year: number;
  /** 0–11 */
  monthIndex: number;
  userId: string;
};

export async function fetchCalendarDayCompletion(
  range: CalendarFetchRange
): Promise<CalendarDayCompletionMap> {
  const month = range.monthIndex + 1; // backend expects 1–12
  const res = await fetch(
    `${BASE_URL}/api/tasks/${range.userId}/calendar?year=${range.year}&month=${month}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch calendar data: ${res.status}`);
  }
  return res.json() as Promise<CalendarDayCompletionMap>;
}
