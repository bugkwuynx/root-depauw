import { useState, useCallback, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Modal,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { GameColors } from '../constants/theme';
import * as gameApi from '@/lib/gameApi';
import type { GameState, UserStreak, Tree, WarningStatus, WellnessResource, DailyTask, UserProfile } from '@/types/game.type';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// TODO: replace with userId from auth context once teammate's PR is merged
const USER_ID = 'testUser123';

const WATER_PER_PHASE = 7;

const PHASE_LABELS: Record<string, string> = {
  seed: 'Seed',
  seedling: 'Seedling',
  sapling: 'Sapling',
  young: 'Young Tree',
  full: 'Full Grown',
};

const PHASE_EMOJIS: Record<string, string> = {
  seed: '🌱',
  seedling: '🌿',
  sapling: '🪴',
  young: '🌳',
  full: '🌲',
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

const NAV_ITEMS = [
  { label: 'Tasks',    icon: 'checkmark-done-circle-outline' as const, route: '/tasks'         },
  { label: 'Trees',    icon: 'leaf-outline'                  as const, route: '/trees'         },
  { label: 'Calendar', icon: 'calendar-outline'              as const, route: '/calendar-view' },
  { label: 'Settings', icon: 'settings-outline'              as const, route: '/setting-view'  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Fertilizer Modal
// ─────────────────────────────────────────────────────────────────────────────

function FertilizerModal({
  visible,
  hasFertilizer,
  fertilizerCount,
  treeName,
  onUse,
  onDecline,
}: {
  visible: boolean;
  hasFertilizer: boolean;
  fertilizerCount: number;
  treeName: string;
  onUse: () => Promise<void>;
  onDecline: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const handle = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); } finally { setBusy(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modal.overlay}>
        <View style={modal.card}>
          <Text style={modal.bigEmoji}>{hasFertilizer ? '🌿' : '😢'}</Text>

          <Text style={modal.title}>
            {hasFertilizer ? 'Your Tree Needs Help!' : 'No Fertilizer Left'}
          </Text>

          <Text style={modal.body}>
            {hasFertilizer
              ? `Your ${treeName} is about to regress to the previous phase of growth.\n\nUse a fertilizer to protect it!`
              : `Your ${treeName} is about to regress to the previous phase.\n\nYou have no fertilizers left to protect it.`}
          </Text>

          {hasFertilizer && (
            <View style={modal.fertRow}>
              <Image
                source={require('../assets/icons/fertilizer.png')}
                style={modal.fertIcon}
              />
              <Text style={modal.fertCount}>
                {fertilizerCount} fertilizer{fertilizerCount !== 1 ? 's' : ''} available
              </Text>
            </View>
          )}

          {busy ? (
            <ActivityIndicator color={GameColors.primary} style={{ marginTop: 20 }} />
          ) : (
            <View style={modal.buttonCol}>
              {hasFertilizer && (
                <TouchableOpacity
                  style={modal.primaryBtn}
                  onPress={() => handle(onUse)}
                  activeOpacity={0.8}
                >
                  <Text style={modal.primaryBtnText}>Use Fertilizer 🌿</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={modal.secondaryBtn}
                onPress={() => handle(onDecline)}
                activeOpacity={0.8}
              >
                <Text style={modal.secondaryBtnText}>
                  {hasFertilizer ? 'Let it regress' : 'Accept regression'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Wellness Warning Modal (days 5-7 of zero completions)
// ─────────────────────────────────────────────────────────────────────────────

function WellnessModal({
  visible,
  day,
  message,
  resources,
  onDismiss,
}: {
  visible: boolean;
  day: number;
  message: string;
  resources: WellnessResource[];
  onDismiss: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modal.overlay}>
        <View style={[modal.card, modal.wellnessCard]}>
          <Text style={modal.bigEmoji}>💙</Text>
          <Text style={modal.title}>Day {day} Check-In</Text>
          <Text style={modal.body}>{message}</Text>

          <View style={wellness.divider} />

          <Text style={wellness.resourcesLabel}>Support Resources</Text>
          <ScrollView style={wellness.resourcesList} showsVerticalScrollIndicator={false}>
            {resources.map((r, i) => (
              <View key={i} style={wellness.resourceRow}>
                <Text style={wellness.resourceName}>{r.name}</Text>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${r.contact.replace(/\D/g, '')}`)}>
                  <Text style={wellness.resourceContact}>{r.contact}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[modal.primaryBtn, wellness.okBtn]}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={modal.primaryBtnText}>I'm okay, I'll get back on track!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tree Visual
// ─────────────────────────────────────────────────────────────────────────────

function TreeVisual({
  phase,
  waterUnits,
  name,
}: {
  phase: string;
  waterUnits: number;
  name: string;
}) {
  return (
    <View style={styles.treeContainer}>
      <View style={styles.treeTopInfo}>
        <Text style={styles.treeName}>{name}</Text>
        <Text style={styles.treePhaseLabel}>{PHASE_LABELS[phase] ?? phase}</Text>
      </View>

      <View style={styles.treeEmojiWrap}>
        <Text style={styles.treeEmoji}>{PHASE_EMOJIS[phase] ?? '🌱'}</Text>
      </View>

      <View style={styles.treeBottom}>
        <View style={styles.waterMeterRow}>
          {Array.from({ length: WATER_PER_PHASE }).map((_, i) => (
            <View
              key={i}
              style={[styles.waterDrop, i < waterUnits && styles.waterDropFilled]}
            >
              <Ionicons
                name="water"
                size={22}
                color={i < waterUnits ? '#4EAADE' : '#C8C8C8'}
              />
            </View>
          ))}
        </View>
        <Text style={styles.waterLabel}>
          {waterUnits}/{WATER_PER_PHASE} water to next phase
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Emoji assignment (same mapping as tasks.tsx)
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
  { keywords: ['coffee', 'tea', 'cafe'], emoji: '☕' },
];

function assignEmoji(title: string, type: string): string {
  if (type === 'event') return '📅';
  const lower = title.toLowerCase();
  for (const { keywords, emoji } of EMOJI_MAP) {
    if (keywords.some((k) => lower.includes(k))) return emoji;
  }
  return '✨';
}

// ─────────────────────────────────────────────────────────────────────────────
// Home Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Remote state ──
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [tree, setTree] = useState<Tree | null>(null);
  const [warningStatus, setWarningStatus] = useState<WarningStatus>({ type: 'none' });
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  // ── Daily tasks state ──
  const [dailyTask, setDailyTask] = useState<DailyTask | null>(null);

  // ── Congrats modal ──
  const [showCongrats, setShowCongrats] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);

  // Track whether the user already dismissed the wellness/check-in modal this
  // session so that useFocusEffect re-fetches don't re-show it.
  const warningDismissedRef = useRef(false);

  // ── Fetch all data — runs on every focus so cross-screen changes sync ──
  const loadData = useCallback(async () => {
    try {
      const [state, streakData, warning, profile] = await Promise.all([
        gameApi.getGameState(USER_ID),
        gameApi.getStreak(USER_ID),
        gameApi.getWarningStatus(USER_ID),
        gameApi.getUserProfile(USER_ID),
      ]);
      setGameState(state);
      setStreak(streakData);
      // Only show the warning modal once per session — don't re-trigger it
      // every time useFocusEffect fires (e.g. returning from Tasks screen).
      if (!warningDismissedRef.current) {
        setWarningStatus(warning);
      }
      setUsername(profile.name);

      const treeData = await gameApi.getTree(state.currentTreeId);
      setTree(treeData);

      // Load today's confirmed tasks
      try {
        const todayTasks = await gameApi.getDailyTasks(USER_ID, gameApi.todayDate());
        setDailyTask(todayTasks);
      } catch {
        // 404 = no tasks confirmed yet for today
        setDailyTask(null);
      }
    } catch (e) {
      console.error('Failed to load game data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch every time the screen comes into focus (covers initial load +
  // returning from the Tasks screen after confirming or completing tasks)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // ── Fertilizer handlers ──
  const handleUseFertilizer = async () => {
    const updated = await gameApi.useFertilizer(USER_ID);
    setGameState(updated);
    warningDismissedRef.current = true;
    setWarningStatus({ type: 'none' });
  };

  const handleDeclineFertilizer = async () => {
    const updated = await gameApi.declineFertilizer(USER_ID);
    setGameState(updated);
    warningDismissedRef.current = true;
    setWarningStatus({ type: 'none' });
  };

  // ── Task handlers ──
  const handleFinalizeDay = async () => {
    try {
      const result = await gameApi.finalizeDailyTasks(USER_ID, gameApi.todayDate());
      setDailyTask((prev) => (prev ? { ...prev, finalized: true } : prev));
      setCoinsEarned(result.coinsEarned + result.eventBonusCoins);
      setShowCongrats(true);
    } catch (e: any) {
      if (e.message?.includes('409') || e.message?.includes('already been finalized')) {
        setDailyTask((prev) => (prev ? { ...prev, finalized: true } : prev));
      } else {
        console.error('Failed to finalize day:', e);
      }
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!dailyTask || dailyTask.finalized) return;
    try {
      await gameApi.completeTask(USER_ID, gameApi.todayDate(), taskId);
      const updatedTasks = dailyTask.tasks.map((t) =>
        t.taskId === taskId ? { ...t, isCompleted: true } : t,
      );
      setDailyTask({ ...dailyTask, tasks: updatedTasks });

      if (updatedTasks.every((t) => t.isCompleted)) {
        setTimeout(() => handleFinalizeDay(), 600);
      }
    } catch (e) {
      console.error('Failed to complete task:', e);
    }
  };

  const handleAcceptCongrats = async () => {
    setShowCongrats(false);
    await loadData(); // refresh coins, water level, and streak in header
  };

  // ── Derived values (null-safe) ──
  const coins = gameState?.coins ?? 0;
  const fertilizer = gameState?.fertilizer ?? 0;
  const waterUnits = gameState?.waterAppliedToPhase ?? 0;
  const phase = gameState?.currentPhase ?? 'seed';
  const treeName = tree?.name ?? '...';
  const streakCount = streak?.fullCompletionDays ?? 0;

  const uncompletedTasks = (dailyTask?.tasks ?? []).filter((t) => !t.isCompleted);
  // Show at most 3; as each is completed the next one in the list slides into view
  const visibleTasks = uncompletedTasks.slice(0, 3);
  const allTasksDone =
    dailyTask?.confirmed === true &&
    (dailyTask?.tasks.length ?? 0) > 0 &&
    uncompletedTasks.length === 0;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={GameColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* ── Congrats Modal ── */}
      <Modal visible={showCongrats} transparent animationType="fade">
        <View style={congratsStyles.overlay}>
          <View style={congratsStyles.card}>
            <Text style={congratsStyles.bigEmoji}>🎉</Text>
            <Text style={congratsStyles.title}>Congrats!!!</Text>
            <Text style={congratsStyles.body}>
              Your {treeName} is watered because of your hard work today!{'\n\n'}
              You receive{' '}
              <Text style={congratsStyles.coins}>{coinsEarned} Coins</Text>
              {' '}for completing all the tasks!
            </Text>
            <Pressable
              style={({ pressed }) => [
                congratsStyles.acceptBtn,
                pressed && congratsStyles.acceptBtnPressed,
              ]}
              onPress={handleAcceptCongrats}
            >
              <Text style={congratsStyles.acceptText}>Accept</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Fertilizer Modal ── */}
      <FertilizerModal
        visible={warningStatus.type === 'degradation_warning'}
        hasFertilizer={warningStatus.type === 'degradation_warning' && warningStatus.hasFertilizer}
        fertilizerCount={fertilizer}
        treeName={treeName}
        onUse={handleUseFertilizer}
        onDecline={handleDeclineFertilizer}
      />

      {/* ── Wellness Warning Modal ── */}
      {warningStatus.type === 'wellness_check' && (
        <WellnessModal
          visible
          day={warningStatus.day}
          message={warningStatus.message}
          resources={warningStatus.resources}
          onDismiss={() => {
            warningDismissedRef.current = true;
            setWarningStatus({ type: 'none' });
          }}
        />
      )}

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello{username ? ` ${username}` : ''}! 👋</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.headerStats}>
          <View style={styles.statBadge}>
            <Ionicons name="flame" size={16} color={GameColors.crossText} />
            <Text style={styles.statText}>{streakCount}</Text>
          </View>
          <View style={styles.coinBadge}>
            <FontAwesome5 name="coins" size={13} color={GameColors.coinText} />
            <Text style={styles.coinText}>{coins}</Text>
          </View>
          <View style={styles.fertBadge}>
            <Image
              source={require('../assets/icons/fertilizer.png')}
              style={styles.fertIcon}
            />
            <Text style={styles.fertText}>{fertilizer}</Text>
          </View>
        </View>
      </View>

      {/* ── Main content ── */}
      <View style={styles.mainContent}>
        <TreeVisual phase={phase} waterUnits={waterUnits} name={treeName} />

        {/* Today's tasks preview */}
        <View style={styles.tasksPreview}>
          <Text style={styles.previewLabel}>Today's Tasks</Text>

          {!dailyTask?.confirmed ? (
            /* ── Not confirmed yet: prompt user to set up tasks ── */
            <View style={styles.setupPromptCard}>
              <Text style={styles.setupPromptText}>
                🌱 Set up your tasks for today to start growing!
              </Text>
              <TouchableOpacity
                style={styles.setupBtn}
                onPress={() => router.push('/tasks')}
                activeOpacity={0.8}
              >
                <Text style={styles.setupBtnText}>Go to Tasks →</Text>
              </TouchableOpacity>
            </View>
          ) : allTasksDone ? (
            /* ── All done ── */
            <View style={styles.allDoneWrap}>
              <Text style={styles.allDoneText}>
                All tasks are complete, amazing job! 🎉
              </Text>
            </View>
          ) : (
            /* ── Show up to 3 uncompleted tasks; next slides in as each is done ── */
            <View style={styles.tasksList}>
              {visibleTasks.map((task) => (
                <TouchableOpacity
                  key={task.taskId}
                  style={styles.taskRow}
                  onPress={() => handleCompleteTask(task.taskId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskCircle} />
                  <Text style={styles.taskEmoji}>
                    {assignEmoji(task.title, task.type)}
                  </Text>
                  <Text style={styles.taskTitle} numberOfLines={1}>
                    {task.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* ── Bottom nav bar ── */}
      <View style={[styles.navBar, { paddingBottom: insets.bottom + 8 }]}>
        {NAV_ITEMS.map(({ label, icon, route }) => (
          <TouchableOpacity
            key={label}
            style={styles.navItem}
            onPress={() => router.push(route as any)}
            activeOpacity={0.7}
          >
            <Ionicons name={icon} size={24} color={GameColors.primary} />
            <Text style={styles.navLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — Congrats Modal
// ─────────────────────────────────────────────────────────────────────────────

const congratsStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 14,
  },
  bigEmoji: { fontSize: 64, marginBottom: 14 },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#2D5A3D',
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  coins: { fontWeight: '800', color: '#D4A017' },
  acceptBtn: {
    width: '100%',
    backgroundColor: GameColors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: GameColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  acceptBtnPressed: { backgroundColor: '#4A9A76', transform: [{ scale: 0.98 }] },
  acceptText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles — Modal
// ─────────────────────────────────────────────────────────────────────────────

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  wellnessCard: {
    maxHeight: SCREEN_HEIGHT * 0.78,
  },
  bigEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  fertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5E8D0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#D4A96A',
  },
  fertIcon: {
    width: 18,
    height: 18,
  },
  fertCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C5026',
  },
  buttonCol: {
    width: '100%',
    gap: 10,
    marginTop: 20,
  },
  primaryBtn: {
    backgroundColor: GameColors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DADADA',
  },
  secondaryBtnText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles — Wellness Modal extras
// ─────────────────────────────────────────────────────────────────────────────

const wellness = StyleSheet.create({
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#EBEBEB',
    marginBottom: 14,
  },
  resourcesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  resourcesList: {
    width: '100%',
    maxHeight: 160,
    marginBottom: 16,
  },
  resourceRow: {
    marginBottom: 12,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  resourceContact: {
    fontSize: 13,
    color: GameColors.primary,
    textDecorationLine: 'underline',
  },
  okBtn: {
    width: '100%',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles — Screen
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.bgLight,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: GameColors.textDark,
    letterSpacing: -0.3,
  },
  dateText: {
    fontSize: 13,
    color: GameColors.textMid,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GameColors.crossBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: GameColors.crossBorder,
  },
  statText: {
    fontSize: 14,
    fontWeight: '700',
    color: GameColors.crossText,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GameColors.coinBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
    borderWidth: 1,
    borderColor: GameColors.coinBorder,
  },
  coinText: {
    fontSize: 14,
    fontWeight: '700',
    color: GameColors.coinText,
  },
  fertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5E8D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
    borderWidth: 1,
    borderColor: '#D4A96A',
  },
  fertIcon: {
    width: 16,
    height: 16,
  },
  fertText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C5026',
  },

  // ── Main content ─────────────────────────────────────────────────────────────
  mainContent: {
    flex: 1,
  },

  // ── Tree ─────────────────────────────────────────────────────────────────────
  treeContainer: {
    height: SCREEN_HEIGHT * 0.48,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: GameColors.bgSection,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GameColors.bgSection,
  },
  treeTopInfo: {
    alignItems: 'center',
    paddingTop: 18,
    gap: 5,
  },
  treeName: {
    fontSize: 26,
    fontWeight: '800',
    color: GameColors.textDark,
    letterSpacing: 3,
  },
  treePhaseLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: GameColors.textMid,
    letterSpacing: 3.5,
    textTransform: 'uppercase',
  },
  treeEmojiWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  treeEmoji: {
    fontSize: 160,
  },
  treeBottom: {
    alignItems: 'center',
    paddingBottom: 18,
  },
  waterMeterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  waterDrop: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D8D8D8',
  },
  waterDropFilled: {
    backgroundColor: '#DBEEFE',
    borderColor: '#9ECFFA',
  },
  waterLabel: {
    marginTop: 8,
    fontSize: 12,
    color: GameColors.textMid,
    letterSpacing: 0.3,
  },

  // ── Tasks preview ─────────────────────────────────────────────────────────────
  tasksPreview: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: GameColors.textMid,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginBottom: 10,
  },
  tasksList: {
    justifyContent: 'flex-start',
    gap: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: GameColors.bgSection,
    borderRadius: 12,
    gap: 10,
  },
  taskCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: GameColors.accent,
  },
  taskEmoji: {
    fontSize: 18,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: GameColors.textDark,
    letterSpacing: 0.1,
  },
  allDoneWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allDoneText: {
    fontSize: 15,
    fontWeight: '600',
    color: GameColors.primary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  setupPromptCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  setupPromptText: {
    fontSize: 14,
    fontWeight: '500',
    color: GameColors.textMid,
    textAlign: 'center',
    lineHeight: 21,
  },
  setupBtn: {
    backgroundColor: GameColors.primary,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 14,
  },
  setupBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // ── Nav bar ──────────────────────────────────────────────────────────────────
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: GameColors.bgSection,
    backgroundColor: GameColors.white,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: GameColors.primary,
  },
});
