import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchCalendarDayCompletion,
  type CalendarDayCompletionMap,
  type CalendarDayCompletionState,
} from "@/lib/calendarActivities";
import { dateKeyLocal, startOfLocalDay } from "@/lib/dailyTaskCompletion";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Each day can have one of three completion states:
 *  - 'none'     → user had no activity (leave empty / neutral)
 *  - 'partial'  → user completed at least one task but not all (light green)
 *  - 'complete' → user completed every task for that day (dark green)
 *
 * Update `fetchCalendarDayCompletion` to return this richer map.
 * The old boolean map (true = complete) is treated as 'complete' for
 * backwards-compatibility via the helper `resolveState` below.
 */
export type DayCompletionState = "none" | "partial" | "complete";

/**
 * Extended map type. Your backend/lib can return either the legacy
 * `boolean` shape or the new `DayCompletionState` shape — both are handled.
 */
export type RichCalendarDayCompletionMap = Record<
  string,
  DayCompletionState | boolean
>;

// ─── Theme ────────────────────────────────────────────────────────────────────

const THEME = {
  bgPrimary: "#F3FAED",
  bgSecondary: "#E1F0E3",
  accentDark: "#5FAD89",
  text: "#103C2F",
  textMuted: "#2E6B57",
  border: "rgba(16, 60, 47, 0.14)",
  card: "rgba(255, 255, 255, 0.65)",

  // Empty past day — subtle neutral, not alarming
  dayEmpty: "rgba(16, 60, 47, 0.06)",
  dayEmptyText: "rgba(16, 60, 47, 0.35)",

  // Partial completion — light green
  dayPartial: "#A8D5B5",
  dayPartialText: "#1A5C3A",

  // Full completion — dark green
  dayComplete: "#2E7D52",
  dayCompleteText: "#FFFFFF",

  // Future day — ghost / transparent
  dayFuture: "rgba(255, 255, 255, 0.45)",
  dayFutureText: "rgba(16, 60, 47, 0.28)",
} as const;

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const STREAK_BORDER = "#F5C842";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalise legacy boolean values to the new DayCompletionState union. */
function resolveState(
  raw: DayCompletionState | boolean | undefined,
): DayCompletionState {
  if (raw === true) return "complete";
  if (raw === false || raw === undefined) return "none";
  return raw;
}

function weekdayLabels(): string[] {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
}

function leadingBlanks(year: number, monthIndex: number): number {
  const sun0 = new Date(year, monthIndex, 1).getDay();
  return (sun0 + 6) % 7;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

type Cell =
  | { kind: "empty" }
  | { kind: "day"; date: Date; key: string; dayNum: number };

function buildMonthGrid(year: number, monthIndex: number): Cell[] {
  const lead = leadingBlanks(year, monthIndex);
  const dim = daysInMonth(year, monthIndex);
  const cells: Cell[] = [];
  for (let i = 0; i < lead; i++) cells.push({ kind: "empty" });
  for (let d = 1; d <= dim; d++) {
    const date = new Date(year, monthIndex, d);
    cells.push({ kind: "day", date, key: dateKeyLocal(date), dayNum: d });
  }
  while (cells.length % 7 !== 0) cells.push({ kind: "empty" });
  while (cells.length < 42) cells.push({ kind: "empty" });
  return cells;
}

/**
 * Compute the set of dateKeys that belong to the user's current active streak.
 *
 * A streak is an unbroken run of consecutive past/today days where the user
 * had at least *partial* completion. The streak runs backwards from today (or
 * the most-recent completed day if today hasn't been completed yet).
 */
function computeStreakKeys(
  map: RichCalendarDayCompletionMap,
  today: Date,
): Set<string> {
  const streakKeys = new Set<string>();

  // Walk backwards day-by-day from today until we hit a 'none' day.
  let cursor = new Date(today);
  while (true) {
    const key = dateKeyLocal(cursor);
    const state = resolveState(map[key]);
    if (state === "none" || state === undefined) break;
    streakKeys.add(key);
    cursor = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate() - 1,
    );
  }

  return streakKeys;
}

// ─── Visual helpers ───────────────────────────────────────────────────────────

interface DayVisual {
  bg: string;
  fg: string;
  isStreak: boolean;
}

function resolveDayVisual(
  state: DayCompletionState,
  isFuture: boolean,
  streakKeys: Set<string>,
  dateKey: string,
): DayVisual {
  if (isFuture) {
    return { bg: THEME.dayFuture, fg: THEME.dayFutureText, isStreak: false };
  }
  const isStreak = streakKeys.has(dateKey);
  switch (state) {
    case "complete":
      return { bg: THEME.dayComplete, fg: THEME.dayCompleteText, isStreak };
    case "partial":
      return { bg: THEME.dayPartial, fg: THEME.dayPartialText, isStreak };
    case "none":
    default:
      // Past day with no activity — render empty/neutral (no colour fill)
      return { bg: THEME.dayEmpty, fg: THEME.dayEmptyText, isStreak: false };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarViewScreen() {
  const router = useRouter();
  const [cursor, setCursor] = React.useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), monthIndex: n.getMonth() };
  });
  const [completionMap, setCompletionMap] =
    React.useState<RichCalendarDayCompletionMap>({});
  const [loading, setLoading] = React.useState(true);
  const userId = "testUser123";

  // Fetch completion data whenever the visible month or userId changes
  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const map = await fetchCalendarDayCompletion({
          year: cursor.year,
          monthIndex: cursor.monthIndex,
          userId,
        });
        if (!cancelled) setCompletionMap(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cursor.year, cursor.monthIndex, userId]);

  const cells = React.useMemo(
    () => buildMonthGrid(cursor.year, cursor.monthIndex),
    [cursor.year, cursor.monthIndex],
  );

  const today = React.useMemo(() => startOfLocalDay(new Date()), []);

  const streakKeys = React.useMemo(
    () => computeStreakKeys(completionMap, today),
    [completionMap, today],
  );

  const labels = weekdayLabels();
  const monthTitle = `${MONTH_NAMES[cursor.monthIndex]} ${cursor.year}`;

  const goPrevMonth = () =>
    setCursor((c) =>
      c.monthIndex === 0
        ? { year: c.year - 1, monthIndex: 11 }
        : { year: c.year, monthIndex: c.monthIndex - 1 },
    );

  const goNextMonth = () =>
    setCursor((c) =>
      c.monthIndex === 11
        ? { year: c.year + 1, monthIndex: 0 }
        : { year: c.year, monthIndex: c.monthIndex + 1 },
    );

  return (
    <LinearGradient
      colors={[THEME.bgPrimary, THEME.bgSecondary]}
      start={{ x: 0.1, y: 0.0 }}
      end={{ x: 0.9, y: 1.0 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color="#2D5A3D" />
            </Pressable>
            <View style={{ width: 56 }} />
          </View>

          {/* ── Streak badge (only shown when there is an active streak) ── */}
          {streakKeys.size > 1 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>
                🔥 {streakKeys.size}-day streak
              </Text>
            </View>
          )}

          {/* ── Calendar card ── */}
          <View style={styles.card}>
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={THEME.accentDark} />
                <Text style={styles.loadingHint}>Loading activity…</Text>
              </View>
            ) : (
              <>
                {/* Month navigation */}
                <View style={styles.monthNav}>
                  <Pressable
                    onPress={goPrevMonth}
                    style={styles.navBtn}
                    accessibilityLabel="Previous month"
                  >
                    <Text style={styles.navBtnText}>‹</Text>
                  </Pressable>
                  <Text style={styles.monthTitle}>{monthTitle}</Text>
                  <Pressable
                    onPress={goNextMonth}
                    style={styles.navBtn}
                    accessibilityLabel="Next month"
                  >
                    <Text style={styles.navBtnText}>›</Text>
                  </Pressable>
                </View>

                {/* Weekday labels */}
                <View style={styles.weekRow}>
                  {labels.map((l) => (
                    <View key={l} style={styles.weekCell}>
                      <Text style={styles.weekLabel}>{l}</Text>
                    </View>
                  ))}
                </View>

                {/* Day grid */}
                <View style={styles.grid}>
                  {Array.from({ length: 6 }, (_, row) => {
                    const rowCells = cells.slice(row * 7, row * 7 + 7);

                    // Find the first and last streak cell indices in this row
                    // so we can draw a continuous border band across them.
                    const streakIndices = rowCells
                      .map((c, i) =>
                        c.kind === "day" && streakKeys.has(c.key) ? i : -1,
                      )
                      .filter((i) => i !== -1);
                    const rowHasStreak = streakIndices.length > 0;

                    return (
                      <View key={row} style={styles.gridRow}>
                        {rowCells.map((cell, idx) => {
                          const key =
                            cell.kind === "day" ? cell.key : `e-${row}-${idx}`;

                          if (cell.kind === "empty") {
                            return <View key={key} style={styles.dayCell} />;
                          }

                          const dayStart = startOfLocalDay(cell.date);
                          const isFuture = dayStart > today;
                          const isToday =
                            dayStart.getTime() === today.getTime();
                          const state = resolveState(completionMap[cell.key]);
                          const { bg, fg, isStreak } = resolveDayVisual(
                            state,
                            isFuture,
                            streakKeys,
                            cell.key,
                          );

                          const streakBandStyle = isStreak
                            ? {
                                borderWidth: 4,
                                borderColor: STREAK_BORDER,
                                borderRadius: 12,
                              }
                            : undefined;

                          const a11yLabel = isFuture
                            ? `${MONTH_NAMES[cursor.monthIndex]} ${cell.dayNum}, upcoming`
                            : state === "complete"
                              ? `${MONTH_NAMES[cursor.monthIndex]} ${cell.dayNum}, all tasks completed${isStreak ? ", on streak" : ""}`
                              : state === "partial"
                                ? `${MONTH_NAMES[cursor.monthIndex]} ${cell.dayNum}, partially completed${isStreak ? ", on streak" : ""}`
                                : `${MONTH_NAMES[cursor.monthIndex]} ${cell.dayNum}, no tasks completed`;

                          return (
                            <View
                              key={key}
                              style={styles.dayCell}
                              accessible
                              accessibilityRole="text"
                              accessibilityLabel={a11yLabel}
                            >
                              <View
                                style={[
                                  styles.dayInner,
                                  { backgroundColor: bg },
                                  isToday && styles.dayInnerToday,
                                  streakBandStyle,
                                ]}
                              >
                                <Text style={[styles.dayNum, { color: fg }]}>
                                  {cell.dayNum}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>

                {/* Legend */}
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendSwatch,
                        { backgroundColor: THEME.dayComplete },
                      ]}
                    />
                    <Text style={styles.legendText}>All tasks done</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendSwatch,
                        { backgroundColor: THEME.dayPartial },
                      ]}
                    />
                    <Text style={styles.legendText}>Partially done</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendSwatch,
                        {
                          backgroundColor: THEME.dayEmpty,
                          borderWidth: 1,
                          borderColor: THEME.border,
                        },
                      ]}
                    />
                    <Text style={styles.legendText}>No activity</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendSwatch,
                        styles.legendSwatchStreak,
                        { backgroundColor: THEME.dayComplete },
                      ]}
                    />
                    <Text style={styles.legendText}>Streak day 🔥</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#E1F0E3",
    justifyContent: "center",
    alignItems: "center",
  },
  backChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: "center",
  },
  backChipText: {
    color: THEME.textMuted,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  streakBadge: {
    alignSelf: "flex-start",
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(46, 125, 82, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(46, 125, 82, 0.25)",
  },
  streakBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: THEME.dayComplete,
    letterSpacing: -0.2,
  },
  card: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  loading: { paddingVertical: 48, alignItems: "center", gap: 12 },
  loadingHint: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.textMuted,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: THEME.text,
    letterSpacing: -0.3,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnText: {
    fontSize: 22,
    fontWeight: "900",
    color: THEME.accentDark,
    marginTop: -2,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekCell: {
    flex: 1,
    alignItems: "center",
  },
  weekLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: THEME.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  grid: { gap: 0 },
  gridRow: { flexDirection: "row" },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    padding: 3,
  },
  dayInner: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  dayInnerToday: {
    borderWidth: 2,
    borderColor: THEME.text,
  },
  dayNum: {
    fontSize: 15,
    fontWeight: "600",
  },
  legend: {
    marginTop: 18,
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(16, 60, 47, 0.1)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendSwatch: {
    width: 18,
    height: 18,
    borderRadius: 6,
  },
  legendSwatchStreak: {
    borderWidth: 2,
    borderColor: STREAK_BORDER,
  },
  legendText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.textMuted,
  },
});
