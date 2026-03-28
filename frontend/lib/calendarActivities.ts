import { dateKeyLocal } from '@/lib/dailyTaskCompletion';

/**
 * Map of local calendar day (YYYY-MM-DD) → whether the user completed at least one
 * task that day. Days omitted are treated as “no activity” for display.
 *
 * Replace `fetchCalendarDayCompletion` with a real HTTP call, for example:
 *   GET /api/v1/me/activity-calendar?year=2026&month=3
 * and map the response into this shape.
 */
export type CalendarDayCompletionMap = Record<string, boolean>;

export type CalendarFetchRange = {
  year: number;
  /** 0–11 */
  monthIndex: number;
};

function buildMockCalendarCompletionMap(range: CalendarFetchRange): CalendarDayCompletionMap {
  const out: CalendarDayCompletionMap = {};
  const anchor = new Date(range.year, range.monthIndex, 15);

  // Surrounding weeks so prev/next month navigation already has colored days at edges.
  for (let delta = -35; delta <= 35; delta++) {
    const d = new Date(anchor);
    d.setDate(d.getDate() + delta);
    const key = dateKeyLocal(d);
    const dow = d.getDay();
    // Mock pattern: “completed” on Sun/Tue/Thu, plus a few streaks — purely for UI demo.
    const pseudoWeek = Math.floor((delta + 35) / 7);
    const completed =
      dow === 0 || dow === 2 || dow === 4 ? pseudoWeek % 3 !== 1 : pseudoWeek % 4 === 0;
    out[key] = completed;
  }

  return out;
}

/**
 * Fetch per-day “any task completed?” for the calendar. Currently returns mock data.
 * Pass `range` to request the visible month (and use it in your query params).
 */
export async function fetchCalendarDayCompletion(
  range: CalendarFetchRange
): Promise<CalendarDayCompletionMap> {
  // Simulate network latency; remove when using fetch().
  await new Promise((r) => setTimeout(r, 280));

  // TODO: const res = await fetch(`${API}/me/activity-calendar?year=${range.year}&month=${range.monthIndex + 1}`);
  // TODO: const json = await res.json();
  // TODO: return normalizeApiResponse(json);

  return buildMockCalendarCompletionMap(range);
}
