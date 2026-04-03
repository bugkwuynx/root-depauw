import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  fetchCalendarDayCompletion,
  type CalendarDayCompletionMap,
} from '@/lib/calendarActivities';
import { dateKeyLocal, startOfLocalDay } from '@/lib/dailyTaskCompletion';
import { loadUserPreferences, type WeekStartPreference } from '@/lib/userPreferences';

const THEME = {
  bgPrimary: '#F3FAED',
  bgSecondary: '#E1F0E3',
  accentDark: '#5FAD89',
  text: '#103C2F',
  textMuted: '#2E6B57',
  border: 'rgba(16, 60, 47, 0.14)',
  card: 'rgba(255, 255, 255, 0.65)',
  dayGreen: '#5FAD89',
  dayGreenText: '#FFFFFF',
  dayRed: '#C75C5C',
  dayRedText: '#FFFFFF',
  dayFuture: 'rgba(255, 255, 255, 0.55)',
  dayFutureText: 'rgba(16, 60, 47, 0.35)',
} as const;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function weekdayLabels(weekStartsOn: WeekStartPreference): string[] {
  if (weekStartsOn === 'sunday') return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
}

function leadingBlanks(year: number, monthIndex: number, weekStartsOn: WeekStartPreference): number {
  const first = new Date(year, monthIndex, 1);
  const sun0 = first.getDay();
  if (weekStartsOn === 'sunday') return sun0;
  return (sun0 + 6) % 7;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

type Cell =
  | { kind: 'empty' }
  | { kind: 'day'; date: Date; key: string; dayNum: number };

function buildMonthGrid(year: number, monthIndex: number, weekStartsOn: WeekStartPreference): Cell[] {
  const lead = leadingBlanks(year, monthIndex, weekStartsOn);
  const dim = daysInMonth(year, monthIndex);
  const cells: Cell[] = [];
  for (let i = 0; i < lead; i++) cells.push({ kind: 'empty' });
  for (let d = 1; d <= dim; d++) {
    const date = new Date(year, monthIndex, d);
    cells.push({ kind: 'day', date, key: dateKeyLocal(date), dayNum: d });
  }
  while (cells.length % 7 !== 0) cells.push({ kind: 'empty' });
  while (cells.length < 42) cells.push({ kind: 'empty' });
  return cells;
}

function dayCompleted(map: CalendarDayCompletionMap, dateKey: string): boolean {
  return map[dateKey] === true;
}

export default function CalendarViewScreen() {
  const router = useRouter();
  const [cursor, setCursor] = React.useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), monthIndex: n.getMonth() };
  });
  const [weekStartsOn, setWeekStartsOn] = React.useState<WeekStartPreference>('monday');
  const [completionMap, setCompletionMap] = React.useState<CalendarDayCompletionMap>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void loadUserPreferences().then((prefs) => {
      if (!cancelled) setWeekStartsOn(prefs.weekStartsOn);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const map = await fetchCalendarDayCompletion({
          year: cursor.year,
          monthIndex: cursor.monthIndex,
        });
        if (!cancelled) setCompletionMap(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cursor.year, cursor.monthIndex]);

  const cells = React.useMemo(
    () => buildMonthGrid(cursor.year, cursor.monthIndex, weekStartsOn),
    [cursor.year, cursor.monthIndex, weekStartsOn]
  );

  const labels = weekdayLabels(weekStartsOn);

  const goPrevMonth = () => {
    setCursor((c) => {
      if (c.monthIndex === 0) return { year: c.year - 1, monthIndex: 11 };
      return { year: c.year, monthIndex: c.monthIndex - 1 };
    });
  };

  const goNextMonth = () => {
    setCursor((c) => {
      if (c.monthIndex === 11) return { year: c.year + 1, monthIndex: 0 };
      return { year: c.year, monthIndex: c.monthIndex + 1 };
    });
  };

  const monthTitle = `${MONTH_NAMES[cursor.monthIndex]} ${cursor.year}`;
  const today = startOfLocalDay(new Date());

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

          <View style={styles.card}>
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={THEME.accentDark} />
                <Text style={styles.loadingHint}>Loading activity…</Text>
              </View>
            ) : (
              <>
                <View style={styles.monthNav}>
                  <Pressable onPress={goPrevMonth} style={styles.navBtn} accessibilityLabel="Previous month">
                    <Text style={styles.navBtnText}>‹</Text>
                  </Pressable>
                  <Text style={styles.monthTitle}>{monthTitle}</Text>
                  <Pressable onPress={goNextMonth} style={styles.navBtn} accessibilityLabel="Next month">
                    <Text style={styles.navBtnText}>›</Text>
                  </Pressable>
                </View>

                <View style={styles.weekRow}>
                  {labels.map((l) => (
                    <View key={l} style={styles.weekCell}>
                      <Text style={styles.weekLabel}>{l}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.grid}>
                  {Array.from({ length: 6 }, (_, row) => (
                    <View key={row} style={styles.gridRow}>
                      {cells.slice(row * 7, row * 7 + 7).map((cell, idx) => {
                        const key = cell.kind === 'day' ? cell.key : `e-${row}-${idx}`;
                        if (cell.kind === 'empty') {
                          return <View key={key} style={styles.dayCell} />;
                        }

                        const dayStart = startOfLocalDay(cell.date);
                        const isFuture = dayStart > today;
                        const isToday = dayStart.getTime() === today.getTime();
                        const completed = dayCompleted(completionMap, cell.key);

                        let bg: string = THEME.dayFuture;
                        let fg: string = THEME.dayFutureText;
                        if (!isFuture) {
                          if (completed) {
                            bg = THEME.dayGreen;
                            fg = THEME.dayGreenText;
                          } else {
                            bg = THEME.dayRed;
                            fg = THEME.dayRedText;
                          }
                        }

                        const a11yState = isFuture
                          ? 'upcoming day'
                          : completed
                            ? 'at least one task completed'
                            : 'no tasks completed';

                        return (
                          <View
                            key={key}
                            style={styles.dayCell}
                            accessible
                            accessibilityRole="text"
                            accessibilityLabel={`${MONTH_NAMES[cursor.monthIndex]} ${cell.dayNum}, ${a11yState}`}
                          >
                            <View
                              style={[
                                styles.dayInner,
                                { backgroundColor: bg },
                                isToday && styles.dayInnerToday,
                              ]}
                            >
                              <Text style={[styles.dayNum, { color: fg }]}>{cell.dayNum}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>

                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendSwatch, { backgroundColor: THEME.dayGreen }]} />
                    <Text style={styles.legendText}>Completed a task</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendSwatch, { backgroundColor: THEME.dayRed }]} />
                    <Text style={styles.legendText}>No tasks completed</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendSwatch, { backgroundColor: THEME.dayFuture }]} />
                    <Text style={styles.legendText}>Upcoming</Text>
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

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#E1F0E3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  loading: { paddingVertical: 48, alignItems: 'center', gap: 12 },
  loadingHint: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: -0.3,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.accentDark,
    marginTop: -2,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  grid: {
    gap: 0,
  },
  gridRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    padding: 3,
  },
  dayInner: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  dayInnerToday: {
    borderWidth: 2,
    borderColor: THEME.text,
  },
  dayNum: {
    fontSize: 15,
    fontWeight: '800',
  },
  legend: {
    marginTop: 18,
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 60, 47, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendSwatch: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textMuted,
  },
});
