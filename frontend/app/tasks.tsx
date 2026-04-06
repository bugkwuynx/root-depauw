import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  LinearTransition,
  Easing,
} from 'react-native-reanimated';
import { SetupTaskItem, TrackingTaskItem } from '@/components/TaskItem';
import * as gameApi from '@/lib/gameApi';
import type { Task, Recommendation, RecommendationsCollection } from '@/types/game.type';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// TODO: replace with userId from auth context once teammate's PR is merged
const USER_ID = 'testUser123';

// Pastel colours for goal tag chips in the detail modal
const PASTEL_COLORS = [
  { bg: '#FFD6D6', text: '#A03030' },
  { bg: '#FFE8CC', text: '#8A4A00' },
  { bg: '#FFF8C2', text: '#7A6200' },
  { bg: '#D6F5E0', text: '#1E6B3A' },
  { bg: '#D6EEFF', text: '#1A5080' },
  { bg: '#EDD6FF', text: '#6A1A8A' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Emoji assignment based on task title keywords
// ─────────────────────────────────────────────────────────────────────────────

const EMOJI_MAP: { keywords: string[]; emoji: string }[] = [
  { keywords: ['walk', 'run', 'jog', 'exercise', 'gym', 'workout', 'sport', 'hike', 'bike', 'swim'], emoji: '🏃' },
  { keywords: ['study', 'read', 'homework', 'assignment', 'lecture', 'exam', 'quiz', 'academic', 'library', 'research'], emoji: '📚' },
  { keywords: ['meditat', 'mindful', 'yoga', 'breath', 'calm', 'stress', 'relax'], emoji: '🧘' },
  { keywords: ['water', 'drink', 'hydrat'], emoji: '💧' },
  { keywords: ['sleep', 'rest', 'nap'], emoji: '😴' },
  { keywords: ['eat', 'meal', 'food', 'breakfast', 'lunch', 'dinner', 'cook', 'snack', 'nutrition'], emoji: '🥗' },
  { keywords: ['friend', 'social', 'hang', 'connect', 'people', 'club'], emoji: '🤝' },
  { keywords: ['write', 'journal', 'reflect', 'diary', 'note'], emoji: '📝' },
  { keywords: ['music', 'sing', 'instrument', 'art', 'draw', 'paint', 'creat'], emoji: '🎨' },
  { keywords: ['volunteer', 'service', 'communit', 'help', 'support'], emoji: '🌍' },
  { keywords: ['career', 'resume', 'intern', 'job', 'network', 'profess', 'workshop'], emoji: '💼' },
  { keywords: ['stretch', 'warm', 'fit', 'active', 'move', 'dance'], emoji: '🤸' },
  { keywords: ['call', 'text', 'phone', 'reach out', 'check in', 'message'], emoji: '📱' },
  { keywords: ['meet', 'attend', 'join', 'visit', 'campus', 'session', 'event'], emoji: '📅' },
  { keywords: ['clean', 'tidy', 'organize', 'laundry', 'room'], emoji: '🧹' },
  { keywords: ['gratitude', 'grateful', 'thank', 'positive'], emoji: '🌸' },
  { keywords: ['outdoor', 'nature', 'park', 'garden', 'fresh air', 'outside'], emoji: '🌳' },
  { keywords: ['mental', 'health', 'wellness', 'wellbeing', 'self'], emoji: '💚' },
  { keywords: ['coffee', 'tea', 'cafe', 'breakfast'], emoji: '☕' },
];

function assignEmoji(title: string, type: 'event' | 'task'): string {
  if (type === 'event') return '📅';
  const lower = title.toLowerCase();
  for (const { keywords, emoji } of EMOJI_MAP) {
    if (keywords.some((k) => lower.includes(k))) return emoji;
  }
  return '✨';
}

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
  description?: string;
  goals?: string[];
};

type Phase = 'loading' | 'setup' | 'tracking';

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
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [isFinalized, setIsFinalized] = useState(false);

  // ── Setup phase state ──
  const [dailyTasks, setDailyTasks] = useState<AppTask[]>([]);
  const [events, setEvents] = useState<AppTask[]>([]);
  const [customTasks, setCustomTasks] = useState<AppTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [recommendationsLoaded, setRecommendationsLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Tracking phase state ──
  const [allTasks, setAllTasks] = useState<AppTask[]>([]);

  // ── Task detail modal ──
  const [selectedTask, setSelectedTask] = useState<AppTask | null>(null);

  // ── Coin popup (per-task completion) ──
  const [showCoinPopup, setShowCoinPopup] = useState(false);
  const [coinPopupTitle, setCoinPopupTitle] = useState('');
  const coinPopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track if all tasks just became done so we navigate to home after popup
  const navigateAfterPopupRef = useRef(false);

  // ── Confirm button animation ──
  const confirmScale = useSharedValue(0);
  const confirmOpacity = useSharedValue(0);

  const setupTasks = [...dailyTasks, ...events, ...customTasks];
  const canConfirm =
    setupTasks.length > 0 && setupTasks.every((t) => t.setupStatus === 'fixed');

  useEffect(() => {
    if (canConfirm) {
      confirmOpacity.value = withTiming(1, { duration: 300 });
      confirmScale.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.back(1.15)) });
    } else {
      confirmOpacity.value = withTiming(0, { duration: 180 });
      confirmScale.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.quad) });
    }
  }, [canConfirm]);

  const confirmAnimStyle = useAnimatedStyle(() => ({
    opacity: confirmOpacity.value,
    transform: [{ scale: confirmScale.value }],
  }));

  // ── Build event subtitle from recommendation times ──
  function buildEventSubtitle(rec: Recommendation): string | undefined {
    if (!rec.startTime) return undefined;
    const fmt = (iso: string) =>
      new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return rec.endTime
      ? `${fmt(rec.startTime)} – ${fmt(rec.endTime)}`
      : fmt(rec.startTime);
  }

  // ── Load initial state on mount ──
  const loadInitialData = useCallback(async () => {
    try {
      const date = gameApi.todayDate();
      const existing = await gameApi.getDailyTasks(USER_ID, date);

      if (existing.confirmed) {
        const mapped: AppTask[] = existing.tasks.map((t) => ({
          id: t.taskId,
          title: t.title,
          emoji: assignEmoji(t.title, t.type === 'event' ? 'event' : 'task'),
          source: (t.type === 'event'
            ? 'event'
            : t.type === 'custom'
            ? 'custom'
            : 'daily') as 'daily' | 'event' | 'custom',
          setupStatus: 'fixed' as const,
          completed: t.isCompleted,
          description: t.description,
          goals: t.goals,
        }));
        setAllTasks([
          ...mapped.filter((t) => !t.completed),
          ...mapped.filter((t) => t.completed),
        ]);
        setIsFinalized(existing.finalized);
        setPhase('tracking');
        return;
      }
    } catch {
      // 404 = no tasks confirmed yet — fall through to setup phase
    }

    // ── Setup phase: fetch AI recommendations, auto-generate if none exist ──
    const date = gameApi.todayDate();
    let recCollection: RecommendationsCollection | null = null;

    try {
      recCollection = await gameApi.getRecommendationsForUser(USER_ID, date);
    } catch {
      // 404 — no recommendations stored yet for today, trigger generation
      try {
        setIsGenerating(true);
        setPhase('setup'); // show setup UI with loading indicator while generating
        recCollection = await gameApi.generateRecommendations(USER_ID);
      } catch (genErr) {
        console.error('Failed to generate recommendations:', genErr);
      } finally {
        setIsGenerating(false);
      }
    }

    if (recCollection) {
      const recs: Recommendation[] = recCollection.recommendations ?? [];

      const taskRecs = recs
        .filter((r) => r.type === 'task')
        .map((r, i): AppTask => ({
          id: `rec-task-${i}`,
          title: r.title,
          emoji: assignEmoji(r.title, 'task'),
          source: 'daily',
          setupStatus: 'pending',
          completed: false,
          description: r.description,
          goals: r.goals,
        }));

      const eventRecs = recs
        .filter((r) => r.type === 'event')
        .map((r, i): AppTask => ({
          id: r.eventId ?? `rec-event-${i}`,
          title: r.title,
          emoji: '📅',
          source: 'event',
          setupStatus: 'pending',
          completed: false,
          subtitle: buildEventSubtitle(r),
          description: r.description,
          goals: r.goals,
        }));

      setDailyTasks(taskRecs);
      setEvents(eventRecs);
      setRecommendationsLoaded(true);
    } else {
      setDailyTasks([]);
      setEvents([]);
      setRecommendationsLoaded(false);
    }

    setCustomTasks([]);
    setPhase('setup');
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [loadInitialData]),
  );

  // ── Setup handlers ──

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

  const handleConfirm = async () => {
    const fixed = [...dailyTasks, ...events, ...customTasks].filter(
      (t) => t.setupStatus === 'fixed',
    );

    const backendTasks: Task[] = fixed.map((t) => ({
      taskId: t.id,
      title: t.title,
      type: t.source === 'event' ? 'event' : t.source === 'custom' ? 'custom' : 'task',
      eventId: t.source === 'event' ? t.id : null,
      isCompleted: false,
      description: t.description,
      goals: t.goals,
    }));

    try {
      await gameApi.confirmTasks(USER_ID, gameApi.todayDate(), backendTasks);
      setAllTasks(fixed.map((t) => ({ ...t, completed: false })));
      setPhase('tracking');
    } catch (e) {
      console.error('Failed to confirm tasks:', e);
    }
  };

  const handleAddTask = () => {
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    setCustomTasks((prev) => [
      ...prev,
      {
        id: `c${Date.now()}`,
        title: trimmed,
        emoji: assignEmoji(trimmed, 'task'),
        source: 'custom',
        setupStatus: 'pending',
        completed: false,
      },
    ]);
    setNewTaskText('');
  };

  // ── Tracking handlers ──

  const dismissCoinPopup = useCallback(() => {
    if (coinPopupTimerRef.current) clearTimeout(coinPopupTimerRef.current);
    setShowCoinPopup(false);
    // If all tasks are done, navigate to home for finalization
    if (navigateAfterPopupRef.current) {
      navigateAfterPopupRef.current = false;
      router.replace('/home');
    }
  }, [router]);

  const handleCompleteTask = async (taskId: string) => {
    if (isFinalized) return;

    try {
      await gameApi.completeTask(USER_ID, gameApi.todayDate(), taskId);

      const task = allTasks.find((t) => t.id === taskId);
      const updatedTasks = allTasks.map((t) =>
        t.id === taskId ? { ...t, completed: true } : t,
      );
      setAllTasks([
        ...updatedTasks.filter((t) => !t.completed),
        ...updatedTasks.filter((t) => t.completed),
      ]);

      const allDone = updatedTasks.every((t) => t.completed);

      // Show coin popup for this task
      if (task) {
        setCoinPopupTitle(task.title);
        setShowCoinPopup(true);
        if (coinPopupTimerRef.current) clearTimeout(coinPopupTimerRef.current);

        if (allDone) {
          // Flag so that when the popup dismisses (by tap or timer), we navigate to home
          navigateAfterPopupRef.current = true;
          coinPopupTimerRef.current = setTimeout(dismissCoinPopup, 2500);
        } else {
          coinPopupTimerRef.current = setTimeout(() => setShowCoinPopup(false), 2500);
        }
      } else if (allDone) {
        // No popup to wait for — navigate immediately
        router.replace('/home');
      }
    } catch (e) {
      console.error('Failed to complete task:', e);
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const completedCount = allTasks.filter((t) => t.completed).length;

  // ─────────────────────────────────────────────────────────────────────────
  // Loading screen
  // ─────────────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#5FAD89" />
          <Text style={styles.loadingText}>Loading your tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>

      {/* ── Coin Popup (per-task) ── */}
      <Modal visible={showCoinPopup} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={coinPopupStyles.overlay} onPress={dismissCoinPopup}>
          <View style={coinPopupStyles.card}>
            <FontAwesome5 name="coins" size={26} color="#D4A017" />
            <Text style={coinPopupStyles.amount}>+5 Coins!</Text>
            <Text style={coinPopupStyles.label} numberOfLines={2}>
              "{coinPopupTitle}"
            </Text>
          </View>
        </Pressable>
      </Modal>

      {/* ── Task Detail Modal ── */}
      <Modal
        visible={selectedTask !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTask(null)}
      >
        <Pressable style={detailStyles.overlay} onPress={() => setSelectedTask(null)}>
          <Pressable style={detailStyles.card} onPress={() => {}}>
            {/* Header */}
            <View style={detailStyles.headerRow}>
              <Text style={detailStyles.titleEmoji}>
                {selectedTask ? assignEmoji(selectedTask.title, selectedTask.source === 'event' ? 'event' : 'task') : '✨'}
              </Text>
              <Text style={detailStyles.title} numberOfLines={3}>
                {selectedTask?.title}
              </Text>
            </View>

            {/* Coins badge */}
            <View style={detailStyles.coinRow}>
              <FontAwesome5 name="coins" size={13} color="#D4A017" />
              <Text style={detailStyles.coinText}>+5 coins on completion</Text>
            </View>

            {/* Goals tags */}
            {selectedTask?.goals && selectedTask.goals.length > 0 && (
              <View style={detailStyles.goalsSection}>
                <Text style={detailStyles.goalsLabel}>Goals</Text>
                <View style={detailStyles.tagsWrap}>
                  {selectedTask.goals.map((g) => {
                    let h = 0;
                    for (let i = 0; i < g.length; i++) {
                      h = (Math.imul(31, h) + g.charCodeAt(i)) | 0;
                    }
                    const { bg, text } = PASTEL_COLORS[Math.abs(h) % PASTEL_COLORS.length]!;
                    return (
                      <View key={g} style={[detailStyles.tag, { backgroundColor: bg }]}>
                        <Text style={[detailStyles.tagText, { color: text }]}>{g}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Description */}
            {selectedTask?.description ? (
              <View style={detailStyles.descSection}>
                <Text style={detailStyles.descLabel}>About this task</Text>
                <Text style={detailStyles.descText}>{selectedTask.description}</Text>
              </View>
            ) : null}

            {/* Close button */}
            <Pressable
              style={({ pressed }) => [detailStyles.closeBtn, pressed && detailStyles.closeBtnPressed]}
              onPress={() => setSelectedTask(null)}
            >
              <Text style={detailStyles.closeBtnText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color="#2D5A3D" />
          </Pressable>
          <View style={styles.headerIconWrap}>
            <Text style={styles.headerIcon}>📋</Text>
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
              {/* Hint text / generating indicator */}
              {isGenerating ? (
                <View style={styles.generatingRow}>
                  <ActivityIndicator size="small" color="#5FAD89" />
                  <Text style={styles.generatingText}>
                    Generating your personalized tasks...
                  </Text>
                </View>
              ) : (
                <View style={styles.hintRow}>
                  <Text style={styles.hintText}>
                    ✕ remove  ·  ✓ keep — confirm when ready
                  </Text>
                </View>
              )}

              {/* Section 1 — Today's Tasks */}
              <View style={styles.section}>
                <SectionHeader
                  emoji="🌱"
                  title="Today's Tasks"
                  count={dailyTasks.length}
                />
                {dailyTasks.length === 0 ? (
                  <EmptyState
                    message={
                      recommendationsLoaded
                        ? 'Section cleared!'
                        : 'No recommendations yet. Add your own!'
                    }
                  />
                ) : (
                  dailyTasks.map((task) => (
                    <SetupTaskItem
                      key={task.id}
                      title={task.title}
                      emoji={task.emoji}
                      description={task.description}
                      goals={task.goals}
                      isFixed={task.setupStatus === 'fixed'}
                      onFix={() => handleFix(task.id, 'daily')}
                      onDelete={() => handleDelete(task.id, 'daily')}
                      onPressCard={() => setSelectedTask(task)}
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
                  <EmptyState
                    message={
                      recommendationsLoaded
                        ? 'Section cleared!'
                        : 'No recommendations yet. Add your own!'
                    }
                  />
                ) : (
                  events.map((event) => (
                    <SetupTaskItem
                      key={event.id}
                      title={event.title}
                      emoji={event.emoji}
                      subtitle={event.subtitle}
                      description={event.description}
                      goals={event.goals}
                      isFixed={event.setupStatus === 'fixed'}
                      onFix={() => handleFix(event.id, 'event')}
                      onDelete={() => handleDelete(event.id, 'event')}
                      onPressCard={() => setSelectedTask(event)}
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

              {/* Confirm button */}
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
              TRACKING PHASE
          ════════════════════════════════════════════════════════════════ */}
          {phase === 'tracking' && (
            <>
              {/* Section A — Events */}
              {allTasks.some((t) => t.source === 'event') && (
                <View style={styles.section}>
                  <SectionHeader
                    emoji="📅"
                    title="Today's Events"
                    count={allTasks.filter((t) => t.source === 'event' && !t.completed).length}
                  />
                  {allTasks
                    .filter((t) => t.source === 'event')
                    .map((task) => (
                      <Animated.View
                        key={task.id}
                        layout={LinearTransition.duration(320).easing(Easing.out(Easing.quad))}
                      >
                        <TrackingTaskItem
                          title={task.title}
                          emoji={task.emoji}
                          subtitle={task.subtitle}
                          goals={task.goals}
                          completed={task.completed}
                          onToggleComplete={() =>
                            !task.completed && handleCompleteTask(task.id)
                          }
                          onPressCard={() => setSelectedTask(task)}
                        />
                      </Animated.View>
                    ))}
                </View>
              )}

              {/* Section B — Tasks (daily + custom) */}
              <View style={styles.section}>
                <SectionHeader
                  emoji="🌱"
                  title="Today's Tasks"
                  count={
                    allTasks.filter(
                      (t) => t.source !== 'event' && !t.completed,
                    ).length
                  }
                />
                {allTasks.filter((t) => t.source !== 'event').length === 0 ? (
                  <EmptyState message="No tasks for today!" />
                ) : (
                  allTasks
                    .filter((t) => t.source !== 'event')
                    .map((task) => (
                      <Animated.View
                        key={task.id}
                        layout={LinearTransition.duration(320).easing(Easing.out(Easing.quad))}
                      >
                        <TrackingTaskItem
                          title={task.title}
                          emoji={task.emoji}
                          subtitle={task.subtitle}
                          goals={task.goals}
                          completed={task.completed}
                          onToggleComplete={() =>
                            !task.completed && handleCompleteTask(task.id)
                          }
                          onPressCard={() => setSelectedTask(task)}
                        />
                      </Animated.View>
                    ))
                )}
              </View>

              {allTasks.length > 0 && allTasks.every((t) => t.completed) && (
                <View style={styles.allDoneRow}>
                  <Text style={styles.allDoneText}>
                    🎉  All done! Heading back to home...
                  </Text>
                </View>
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — Coin Popup
// ─────────────────────────────────────────────────────────────────────────────

const coinPopupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  card: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
  },
  amount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D4A017',
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 13,
    color: '#92710A',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles — Task Detail Modal
// ─────────────────────────────────────────────────────────────────────────────

const detailStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  titleEmoji: { fontSize: 32 },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#2D5A3D',
    lineHeight: 26,
    marginTop: 4,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignSelf: 'flex-start',
  },
  coinText: {
    fontSize: 13,
    color: '#92710A',
    fontWeight: '700',
  },
  goalsSection: { marginBottom: 16 },
  goalsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#83BF99',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  descSection: { marginBottom: 20 },
  descLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#83BF99',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  descText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  closeBtn: {
    backgroundColor: '#5FAD89',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#5FAD89',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  closeBtnPressed: { backgroundColor: '#4A9A76', transform: [{ scale: 0.98 }] },
  closeBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles — Screen
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3FAED' },

  // Loading
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 15, color: '#5FAD89', fontWeight: '600' },

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

  // Hint / generating
  hintRow: { marginBottom: 10, paddingHorizontal: 4 },
  hintText: { fontSize: 12, color: '#83BF99', fontWeight: '500', textAlign: 'center' },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  generatingText: { fontSize: 12, color: '#5FAD89', fontWeight: '600' },

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
    backgroundColor: '#C8EDD8',
    borderRadius: 14,
    alignItems: 'center',
  },
  allDoneText: { fontSize: 14, fontWeight: '700', color: '#2D5A3D' },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#E1F0E3',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
