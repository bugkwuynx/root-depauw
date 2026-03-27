import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SetupTaskItem, TrackingTaskItem } from '@/components/TaskItem';
import { mockDailyTasks, mockSuggestedEvents, mockCustomTasks } from '@/data/mockTasks';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type AppTask = {
  id: string;
  title: string;
  emoji: string;
  source: 'daily' | 'event' | 'custom';
  setupStatus: 'pending' | 'fixed';
  completed: boolean;
  subtitle?: string;
  coinBonus?: number;
};

type Phase = 'setup' | 'tracking';

// ─────────────────────────────────────────────────────────────────────────────
// Seed data from mocks
// ─────────────────────────────────────────────────────────────────────────────

const seedDailyTasks: AppTask[] = mockDailyTasks.map((t) => ({
  id: t.id,
  title: t.title,
  emoji: t.emoji,
  source: 'daily',
  setupStatus: 'pending',
  completed: false,
}));

const seedEvents: AppTask[] = mockSuggestedEvents.map((e) => ({
  id: e.id,
  title: e.title,
  emoji: e.emoji,
  source: 'event',
  setupStatus: 'pending',
  completed: false,
  subtitle: `${e.time}  ·  ${e.location}`,
  coinBonus: e.coinBonus,
}));

const seedCustomTasks: AppTask[] = mockCustomTasks.map((t) => ({
  id: t.id,
  title: t.title,
  emoji: t.emoji,
  source: 'custom',
  setupStatus: 'pending',
  completed: false,
}));

// ─────────────────────────────────────────────────────────────────────────────
// Small shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  emoji,
  title,
  count,
}: {
  emoji: string;
  title: string;
  count: number;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionEmoji}>{emoji}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function TasksScreen() {
  const [phase, setPhase] = useState<Phase>('setup');

  // ── Setup phase state ──
  const [dailyTasks, setDailyTasks] = useState<AppTask[]>(seedDailyTasks);
  const [events, setEvents] = useState<AppTask[]>(seedEvents);
  const [customTasks, setCustomTasks] = useState<AppTask[]>(seedCustomTasks);
  const [newTaskText, setNewTaskText] = useState('');

  // ── Tracking phase state ──
  const [allTasks, setAllTasks] = useState<AppTask[]>([]);

  // ── Confirm button animation ──
  const confirmScale = useSharedValue(0);
  const confirmOpacity = useSharedValue(0);

  const setupTasks = [...dailyTasks, ...events, ...customTasks];
  const canConfirm =
    setupTasks.length > 0 && setupTasks.every((t) => t.setupStatus === 'fixed');

  useEffect(() => {
    if (canConfirm) {
      confirmOpacity.value = withTiming(1, { duration: 300 });
      confirmScale.value = withSpring(1, { damping: 12, stiffness: 160 });
    } else {
      confirmOpacity.value = withTiming(0, { duration: 180 });
      confirmScale.value = withSpring(0, { damping: 14 });
    }
  }, [canConfirm]);

  const confirmAnimStyle = useAnimatedStyle(() => ({
    opacity: confirmOpacity.value,
    transform: [{ scale: confirmScale.value }],
  }));

  // ── Handlers ──

  const handleFix = (id: string, section: 'daily' | 'event' | 'custom') => {
    const updater = (prev: AppTask[]) =>
      prev.map((t) => (t.id === id ? { ...t, setupStatus: 'fixed' as const } : t));
    if (section === 'daily') setDailyTasks(updater);
    else if (section === 'event') setEvents(updater);
    else setCustomTasks(updater);
  };

  const handleDelete = (id: string, section: 'daily' | 'event' | 'custom') => {
    const updater = (prev: AppTask[]) => prev.filter((t) => t.id !== id);
    if (section === 'daily') setDailyTasks(updater);
    else if (section === 'event') setEvents(updater);
    else setCustomTasks(updater);
  };

  const handleConfirm = () => {
    const merged = [...dailyTasks, ...events, ...customTasks]
      .filter((t) => t.setupStatus === 'fixed')
      .map((t) => ({ ...t, completed: false }));
    setAllTasks(merged);
    setPhase('tracking');
  };

  const handleToggleComplete = (taskId: string) => {
    setAllTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t,
      );
      // Incomplete tasks float to top, completed sink to bottom
      return [
        ...updated.filter((t) => !t.completed),
        ...updated.filter((t) => t.completed),
      ];
    });
  };

  const handleAddTask = () => {
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    setCustomTasks((prev) => [
      ...prev,
      {
        id: `c${Date.now()}`,
        title: trimmed,
        emoji: '✨',
        source: 'custom',
        setupStatus: 'pending',
        completed: false,
      },
    ]);
    setNewTaskText('');
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const completedCount = allTasks.filter((t) => t.completed).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerIconWrap}>
            <Text style={styles.headerIcon}>🌿</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Task List</Text>
            <Text style={styles.headerDate}>{today}</Text>
          </View>
          {phase === 'tracking' && allTasks.length > 0 && (
            <View style={styles.progressPill}>
              <Text style={styles.progressText}>
                {completedCount}/{allTasks.length} done
              </Text>
            </View>
          )}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ════════════════════════════════════════════════════════════════
              SETUP PHASE
          ════════════════════════════════════════════════════════════════ */}
          {phase === 'setup' && (
            <>
              {/* Hint text */}
              <View style={styles.hintRow}>
                <Text style={styles.hintText}>
                  ✕ remove  ·  ✓ keep — confirm when ready
                </Text>
              </View>

              {/* Section 1 — Today's Tasks */}
              <View style={styles.section}>
                <SectionHeader
                  emoji="🌱"
                  title="Today's Tasks"
                  count={dailyTasks.length}
                />
                {dailyTasks.length === 0 ? (
                  <EmptyState message="Section cleared!" />
                ) : (
                  dailyTasks.map((task) => (
                    <SetupTaskItem
                      key={task.id}
                      title={task.title}
                      emoji={task.emoji}
                      isFixed={task.setupStatus === 'fixed'}
                      onFix={() => handleFix(task.id, 'daily')}
                      onDelete={() => handleDelete(task.id, 'daily')}
                    />
                  ))
                )}
              </View>

              {/* Section 2 — Suggested Events */}
              <View style={styles.section}>
                <SectionHeader
                  emoji="📅"
                  title="Today's Suggested Events"
                  count={events.length}
                />
                {events.length === 0 ? (
                  <EmptyState message="Section cleared!" />
                ) : (
                  events.map((event) => (
                    <SetupTaskItem
                      key={event.id}
                      title={event.title}
                      emoji={event.emoji}
                      subtitle={event.subtitle}
                      coinBonus={event.coinBonus}
                      isFixed={event.setupStatus === 'fixed'}
                      onFix={() => handleFix(event.id, 'event')}
                      onDelete={() => handleDelete(event.id, 'event')}
                    />
                  ))
                )}
              </View>

              {/* Section 3 — Add Your Own */}
              <View style={styles.section}>
                <SectionHeader
                  emoji="✨"
                  title="Add Your Own Tasks!"
                  count={customTasks.length}
                />
                {customTasks.map((task) => (
                  <SetupTaskItem
                    key={task.id}
                    title={task.title}
                    emoji={task.emoji}
                    isFixed={task.setupStatus === 'fixed'}
                    onFix={() => handleFix(task.id, 'custom')}
                    onDelete={() => handleDelete(task.id, 'custom')}
                  />
                ))}

                {/* Add task input row */}
                <View style={styles.addRow}>
                  <TextInput
                    style={styles.input}
                    value={newTaskText}
                    onChangeText={setNewTaskText}
                    placeholder="Add a new activity..."
                    placeholderTextColor="#A8C8B4"
                    returnKeyType="done"
                    onSubmitEditing={handleAddTask}
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.addButton,
                      pressed && styles.addButtonPressed,
                    ]}
                    onPress={handleAddTask}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>

              {/* Confirm button — animates in once everything is fixed */}
              <Animated.View
                style={[styles.confirmWrap, confirmAnimStyle]}
                pointerEvents={canConfirm ? 'auto' : 'none'}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.confirmButton,
                    pressed && styles.confirmButtonPressed,
                  ]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmText}>🌿  Confirm Tasks</Text>
                </Pressable>
              </Animated.View>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TRACKING PHASE  — single merged section
          ════════════════════════════════════════════════════════════════ */}
          {phase === 'tracking' && (
            <View style={styles.section}>
              <SectionHeader
                emoji="🌱"
                title="Today's Tasks"
                count={allTasks.filter((t) => !t.completed).length}
              />
              {allTasks.length === 0 ? (
                <EmptyState message="No tasks for today!" />
              ) : (
                allTasks.map((task) => (
                  <TrackingTaskItem
                    key={task.id}
                    title={task.title}
                    emoji={task.emoji}
                    subtitle={task.subtitle}
                    completed={task.completed}
                    onToggleComplete={() => handleToggleComplete(task.id)}
                  />
                ))
              )}

              {allTasks.length > 0 &&
                allTasks.every((t) => t.completed) && (
                  <View style={styles.allDoneRow}>
                    <Text style={styles.allDoneText}>
                      🎉  All done! Amazing work today!
                    </Text>
                  </View>
                )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3FAED' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 14,
  },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E1F0E3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: { fontSize: 28 },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D5A3D',
    letterSpacing: -0.3,
  },
  headerDate: { fontSize: 13, color: '#83BF99', marginTop: 2, fontWeight: '500' },
  progressPill: {
    backgroundColor: '#E1F0E3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#83BF99',
  },
  progressText: { fontSize: 13, fontWeight: '700', color: '#5FAD89' },

  // Hint
  hintRow: { marginBottom: 10, paddingHorizontal: 4 },
  hintText: { fontSize: 12, color: '#83BF99', fontWeight: '500', textAlign: 'center' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },

  // Section card
  section: {
    backgroundColor: '#E1F0E3',
    borderRadius: 22,
    padding: 14,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionEmoji: { fontSize: 18 },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#2D5A3D' },
  countBadge: {
    backgroundColor: '#5FAD89',
    borderRadius: 10,
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignItems: 'center',
  },
  countText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },

  // Empty state
  emptyState: { paddingVertical: 18, alignItems: 'center' },
  emptyText: { color: '#83BF99', fontSize: 14, fontWeight: '500' },

  // Add task row
  addRow: { flexDirection: 'row', marginTop: 10, gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#2D5A3D',
    borderWidth: 1.5,
    borderColor: '#83BF99',
  },
  addButton: {
    width: 46,
    height: 46,
    backgroundColor: '#5FAD89',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonPressed: { backgroundColor: '#4A9A76', transform: [{ scale: 0.94 }] },
  addButtonText: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 30,
    marginTop: -2,
  },

  // Confirm button
  confirmWrap: { marginBottom: 16, marginHorizontal: 4 },
  confirmButton: {
    backgroundColor: '#5FAD89',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#5FAD89',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmButtonPressed: {
    backgroundColor: '#4A9A76',
    transform: [{ scale: 0.98 }],
  },
  confirmText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // All done banner
  allDoneRow: {
    marginTop: 6,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#83BF99',
  },
  allDoneText: { fontSize: 14, fontWeight: '700', color: '#5FAD89' },
});
