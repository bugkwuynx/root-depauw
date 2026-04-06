import { useState, useCallback, useRef, useEffect } from 'react';
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
import { auth } from '@/lib/firebase';
import { GameColors } from '../constants/theme';
import * as gameApi from '@/lib/gameApi';
import type { GameState, UserStreak, Tree, WarningStatus, WellnessResource, DailyTask } from '@/types/game.type';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────


const WATER_PER_PHASE = 7;

const PHASE_LABELS: Record<string, string> = {
  seed: 'Seed',
  seedling: 'Seedling',
  sapling: 'Sapling',
  young: 'Young Tree',
  full: 'Full Grown',
};

// Per-tree phase emojis: TREE_PHASE_EMOJIS[treeId][phase]
const TREE_PHASE_EMOJIS: Record<number, Record<string, string>> = {
  1: { seed: '🌰', seedling: '🌱', sapling: '🌿', young: '🌳', full: '🌲' }, // Oak Sapling
  2: { seed: '🌰', seedling: '🌱', sapling: '🌿', young: '🌸', full: '💐' }, // Cherry Blossom
  3: { seed: '🌱', seedling: '🪴', sapling: '🌵', young: '🌵', full: '🌵' }, // Cactus
};

const TREE_NAMES: Record<number, string> = {
  1: 'Oak Sapling',
  2: 'Cherry Blossom',
  3: 'Cactus',
};

function getPhaseEmoji(treeId: number, phase: string): string {
  return TREE_PHASE_EMOJIS[treeId]?.[phase] ?? '🌱';
}

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

  if (!hasFertilizer) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={modal.overlay}>
          <View style={noFertStyles.card}>
            <View style={noFertStyles.iconCircle}>
              <Text style={noFertStyles.sadEmoji}>🪴</Text>
            </View>
            <View style={noFertStyles.warningBanner}>
              <Text style={noFertStyles.warningBannerText}>⚠️  Tree Regression Warning</Text>
            </View>
            <Text style={noFertStyles.title}>No Fertilizer Left</Text>
            <Text style={noFertStyles.body}>
              Your <Text style={noFertStyles.treeName}>{treeName}</Text> is about to regress to the previous phase.{'\n\n'}
              You have no fertilizers left to protect it. Complete more tasks to earn fertilizers!
            </Text>
            <View style={noFertStyles.tipRow}>
              <Text style={noFertStyles.tipText}>💡 Tip: Streak completions reward you with fertilizers</Text>
            </View>
            {busy ? (
              <ActivityIndicator color="#C05A00" style={{ marginTop: 20 }} />
            ) : (
              <TouchableOpacity
                style={noFertStyles.acceptBtn}
                onPress={() => handle(onDecline)}
                activeOpacity={0.8}
              >
                <Text style={noFertStyles.acceptBtnText}>Accept Regression</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modal.overlay}>
        <View style={modal.card}>
          <Text style={modal.bigEmoji}>🌿</Text>

          <Text style={modal.title}>Your Tree Needs Help!</Text>

          <Text style={modal.body}>
            {`Your ${treeName} is about to regress to the previous phase of growth.\n\nUse a fertilizer to protect it!`}
          </Text>

          <View style={modal.fertRow}>
            <Image
              source={require('../assets/icons/fertilizer.png')}
              style={modal.fertIcon}
            />
            <Text style={modal.fertCount}>
              {fertilizerCount} fertilizer{fertilizerCount !== 1 ? 's' : ''} available
            </Text>
          </View>

          {busy ? (
            <ActivityIndicator color={GameColors.primary} style={{ marginTop: 20 }} />
          ) : (
            <View style={modal.buttonCol}>
              <TouchableOpacity
                style={modal.primaryBtn}
                onPress={() => handle(onUse)}
                activeOpacity={0.8}
              >
                <Text style={modal.primaryBtnText}>Use Fertilizer 🌿</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modal.secondaryBtn}
                onPress={() => handle(onDecline)}
                activeOpacity={0.8}
              >
                <Text style={modal.secondaryBtnText}>Let it regress</Text>
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
  treeId,
  phase,
  waterUnits,
  name,
}: {
  treeId: number;
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
        <Text style={styles.treeEmoji}>{getPhaseEmoji(treeId, phase)}</Text>
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

  const userId = auth.currentUser?.uid ?? '';

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

  // ── Phase-up modal ──
  const [showPhaseUp, setShowPhaseUp] = useState(false);
  const [nextPhase, setNextPhase] = useState('');
  const pendingPhaseUpRef = useRef<string | null>(null);

  // ── Tree-complete modal ──
  const [showTreeComplete, setShowTreeComplete] = useState(false);
  const [completedTreeName, setCompletedTreeName] = useState('');
  const [nextTreeName, setNextTreeName] = useState('');
  const pendingTreeCompleteRef = useRef<{ completedName: string; nextName: string } | null>(null);

  // ── Streak reward modal ──
  const [showStreakReward, setShowStreakReward] = useState(false);
  const [streakMilestone, setStreakMilestone] = useState(7);
  const pendingStreakRef = useRef<number | null>(null);

  // ── Day Complete pre-modal (shown before finalize is called) ──
  const [showDayComplete, setShowDayComplete] = useState(false);

  // ── Coin popup (per-task completion) ──
  const [showCoinPopup, setShowCoinPopup] = useState(false);
  const [coinPopupTitle, setCoinPopupTitle] = useState('');
  const coinPopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track whether the user already dismissed the wellness/check-in modal this
  // session so that useFocusEffect re-fetches don't re-show it.
  const warningDismissedRef = useRef(false);

  // ── Fetch all data — runs on every focus so cross-screen changes sync ──
  const loadData = useCallback(async () => {
    try {
      const [state, streakData, warning, profile] = await Promise.all([
        gameApi.getGameState(userId),
        gameApi.getStreak(userId),
        gameApi.getWarningStatus(userId),
        gameApi.getUserProfile(userId),
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
        const todayTasks = await gameApi.getDailyTasks(userId, gameApi.todayDate());
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

  // After loadData resolves, detect if all tasks are done but day not finalized yet.
  // This covers the redirect from tasks.tsx after the last task is completed there.
  useEffect(() => {
    if (!dailyTask) return;
    if (!dailyTask.confirmed || dailyTask.finalized) return;
    const allDone =
      dailyTask.tasks.length > 0 && dailyTask.tasks.every((t) => t.isCompleted);
    if (allDone && !showDayComplete && !showCongrats) {
      setShowDayComplete(true);
    }
  }, [dailyTask]);

  // ── Fertilizer handlers ──
  const handleUseFertilizer = async () => {
    const updated = await gameApi.useFertilizer(userId);
    setGameState(updated);
    warningDismissedRef.current = true;
    setWarningStatus({ type: 'none' });
  };

  const handleDeclineFertilizer = async () => {
    const updated = await gameApi.declineFertilizer(userId);
    setGameState(updated);
    warningDismissedRef.current = true;
    setWarningStatus({ type: 'none' });
  };

  // ── Task handlers ──

  // Called when user accepts the "Day Complete" pre-modal — THIS is when finalize runs
  const handleAcceptDayComplete = async () => {
    setShowDayComplete(false);
    try {
      const oldPhase = phase;
      const oldTreeId = gameState?.currentTreeId ?? 1;
      const oldStreakCount = streak?.fullCompletionDays ?? 0;

      const result = await gameApi.finalizeDailyTasks(userId, gameApi.todayDate());
      setDailyTask((prev) => (prev ? { ...prev, finalized: true } : prev));
      setCoinsEarned(result.coinsEarned + result.eventBonusCoins);

      // Tree completion: treeId advanced (full phase finished)
      if (result.gameState.currentTreeId !== oldTreeId) {
        const newId = result.gameState.currentTreeId;
        pendingTreeCompleteRef.current = {
          completedName: treeName,
          nextName: TREE_NAMES[newId] ?? 'New Tree',
        };
      } else if (result.gameState.currentPhase !== oldPhase) {
        // Normal phase advance
        pendingPhaseUpRef.current = result.gameState.currentPhase;
      }

      // Streak milestone check — compute from oldStreakCount before the backend resets it
      if (result.completionState === 'full') {
        const wouldBeCount = oldStreakCount + 1;
        if (wouldBeCount % 7 === 0) {
          pendingStreakRef.current = wouldBeCount;
        }
      }
      try {
        const newStreakData = await gameApi.getStreak(userId);
        setStreak(newStreakData);
      } catch {}

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
      await gameApi.completeTask(userId, gameApi.todayDate(), taskId);
      const task = dailyTask.tasks.find((t) => t.taskId === taskId);
      const updatedTasks = dailyTask.tasks.map((t) =>
        t.taskId === taskId ? { ...t, isCompleted: true } : t,
      );
      setDailyTask({ ...dailyTask, tasks: updatedTasks });

      const allDone = updatedTasks.every((t) => t.isCompleted);

      // Show coin popup for this task
      if (task) {
        setCoinPopupTitle(task.title);
        setShowCoinPopup(true);
        if (coinPopupTimerRef.current) clearTimeout(coinPopupTimerRef.current);
        if (allDone) {
          // Dismiss coin popup early and immediately show Day Complete modal
          coinPopupTimerRef.current = setTimeout(() => {
            setShowCoinPopup(false);
            setShowDayComplete(true);
          }, 2500);
        } else {
          coinPopupTimerRef.current = setTimeout(() => setShowCoinPopup(false), 2500);
        }
      } else if (allDone) {
        // No popup shown — go straight to Day Complete
        setShowDayComplete(true);
      }
    } catch (e) {
      console.error('Failed to complete task:', e);
    }
  };

  // Chain: congrats → streak reward → tree complete → phase-up → loadData
  const handleAcceptCongrats = () => {
    setShowCongrats(false);
    if (pendingStreakRef.current) {
      const days = pendingStreakRef.current;
      pendingStreakRef.current = null;
      setStreakMilestone(days);
      setShowStreakReward(true);
    } else if (pendingTreeCompleteRef.current) {
      const { completedName, nextName } = pendingTreeCompleteRef.current;
      pendingTreeCompleteRef.current = null;
      setCompletedTreeName(completedName);
      setNextTreeName(nextName);
      setShowTreeComplete(true);
    } else if (pendingPhaseUpRef.current) {
      const p = pendingPhaseUpRef.current;
      pendingPhaseUpRef.current = null;
      setNextPhase(p);
      setShowPhaseUp(true);
    } else {
      loadData();
    }
  };

  const handleDismissStreakReward = () => {
    setShowStreakReward(false);
    if (pendingTreeCompleteRef.current) {
      const { completedName, nextName } = pendingTreeCompleteRef.current;
      pendingTreeCompleteRef.current = null;
      setCompletedTreeName(completedName);
      setNextTreeName(nextName);
      setShowTreeComplete(true);
    } else if (pendingPhaseUpRef.current) {
      const p = pendingPhaseUpRef.current;
      pendingPhaseUpRef.current = null;
      setNextPhase(p);
      setShowPhaseUp(true);
    } else {
      loadData();
    }
  };

  const handleDismissTreeComplete = () => {
    setShowTreeComplete(false);
    loadData();
  };

  const handleDismissPhaseUp = () => {
    setShowPhaseUp(false);
    loadData();
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

      {/* ── Day Complete Pre-Modal (shown before finalize is called) ── */}
      <Modal visible={showDayComplete} transparent animationType="fade">
        <View style={congratsStyles.overlay}>
          <View style={congratsStyles.card}>
            <Text style={congratsStyles.bigEmoji}>🌟</Text>
            <Text style={congratsStyles.title}>Day Complete!</Text>
            <Text style={congratsStyles.body}>
              Amazing work — you finished all your tasks today!{'\n\n'}
              Tap below to water your tree and collect your rewards.
            </Text>
            <Pressable
              style={({ pressed }) => [
                congratsStyles.acceptBtn,
                pressed && congratsStyles.acceptBtnPressed,
              ]}
              onPress={handleAcceptDayComplete}
            >
              <Text style={congratsStyles.acceptText}>Collect Rewards 🎁</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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

      {/* ── Streak Reward Modal ── */}
      <Modal visible={showStreakReward} transparent animationType="fade">
        <View style={congratsStyles.overlay}>
          <View style={streakRewardStyles.card}>
            <View style={streakRewardStyles.flameBg}>
              <Text style={streakRewardStyles.flameEmoji}>🔥</Text>
            </View>
            <View style={streakRewardStyles.badgeRow}>
              <Text style={streakRewardStyles.badgeText}>{streakMilestone}-DAY STREAK</Text>
            </View>
            <Text style={streakRewardStyles.title}>Incredible Consistency!</Text>
            <Text style={streakRewardStyles.body}>
              You've completed all your tasks for{' '}
              <Text style={streakRewardStyles.highlight}>{streakMilestone} days in a row</Text>
              !{'\n\n'}
              As a reward you've earned{' '}
              <Text style={streakRewardStyles.reward}>bonus coins and 1 fertilizer</Text>
              {' '}to help your tree grow.{'\n\n'}
              Keep it up tomorrow! 💪
            </Text>
            <Pressable
              style={({ pressed }) => [streakRewardStyles.btn, pressed && streakRewardStyles.btnPressed]}
              onPress={handleDismissStreakReward}
            >
              <Text style={streakRewardStyles.btnText}>Claim Rewards! 🎁</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Phase-Up Modal ── */}
      <Modal visible={showPhaseUp} transparent animationType="fade">
        <View style={congratsStyles.overlay}>
          <View style={phaseUpStyles.card}>
            <View style={phaseUpStyles.badgeRow}>
              <Text style={phaseUpStyles.badgeText}>LEVEL UP</Text>
            </View>
            <Text style={phaseUpStyles.phaseEmoji}>{getPhaseEmoji(gameState?.currentTreeId ?? 1, nextPhase)}</Text>
            <Text style={phaseUpStyles.title}>Your tree grew!</Text>
            <Text style={phaseUpStyles.body}>
              <Text style={phaseUpStyles.treeName}>{treeName}</Text>
              {' has grown into a '}
              <Text style={phaseUpStyles.phaseName}>{PHASE_LABELS[nextPhase] ?? nextPhase}</Text>
              {'!\n\nYou\'ve been awarded '}
              <Text style={phaseUpStyles.reward}>bonus coins and 1 fertilizer</Text>
              {' for reaching this milestone.\n\nKeep up the great work tomorrow! 🌟'}
            </Text>
            <Pressable
              style={({ pressed }) => [phaseUpStyles.btn, pressed && phaseUpStyles.btnPressed]}
              onPress={handleDismissPhaseUp}
            >
              <Text style={phaseUpStyles.btnText}>Amazing! Keep Growing 🌱</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Tree Complete Modal ── */}
      <Modal visible={showTreeComplete} transparent animationType="fade">
        <View style={congratsStyles.overlay}>
          <View style={phaseUpStyles.card}>
            <View style={[phaseUpStyles.badgeRow, treeCompleteStyles.badgeRow]}>
              <Text style={phaseUpStyles.badgeText}>🌳 FULLY GROWN</Text>
            </View>
            <Text style={phaseUpStyles.phaseEmoji}>🎉</Text>
            <Text style={phaseUpStyles.title}>Tree Complete!</Text>
            <Text style={phaseUpStyles.body}>
              {'Your '}
              <Text style={phaseUpStyles.treeName}>{completedTreeName}</Text>
              {' is fully grown and has been added to your '}
              <Text style={phaseUpStyles.reward}>Tree Collection</Text>
              {'!\n\nYou\'ve received '}
              <Text style={phaseUpStyles.reward}>bonus coins</Text>
              {' as a reward.\n\nA new seed has sprouted — your next tree is '}
              <Text style={phaseUpStyles.treeName}>{nextTreeName}</Text>
              {'. Keep growing! 🌱'}
            </Text>
            <Pressable
              style={({ pressed }) => [phaseUpStyles.btn, pressed && phaseUpStyles.btnPressed]}
              onPress={handleDismissTreeComplete}
            >
              <Text style={phaseUpStyles.btnText}>Start Growing {nextTreeName}!</Text>
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
        <TreeVisual treeId={gameState?.currentTreeId ?? 1} phase={phase} waterUnits={waterUnits} name={treeName} />

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

      {/* ── Coin Popup (per-task) — rendered last so it sits above all other modals ── */}
      <Modal visible={showCoinPopup} transparent animationType="fade" statusBarTranslucent>
        <Pressable
          style={coinPopupStyles.overlay}
          onPress={() => {
            if (coinPopupTimerRef.current) clearTimeout(coinPopupTimerRef.current);
            setShowCoinPopup(false);
            // If last task was just completed, show Day Complete now instead of waiting
            const allDone = dailyTask?.tasks.length
              ? dailyTask.tasks.every((t) => t.isCompleted)
              : false;
            if (allDone && !dailyTask?.finalized) {
              setShowDayComplete(true);
            }
          }}
        >
          <View style={coinPopupStyles.card}>
            <FontAwesome5 name="coins" size={28} color="#D4A017" />
            <Text style={coinPopupStyles.amount}>+5 Coins!</Text>
            <Text style={coinPopupStyles.label} numberOfLines={2}>
              "{coinPopupTitle}"
            </Text>
          </View>
        </Pressable>
      </Modal>

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
// Styles — Streak Reward Modal
// ─────────────────────────────────────────────────────────────────────────────

const streakRewardStyles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFF8F0',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0A030',
    shadowColor: '#C05A00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 14,
  },
  flameBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FEE9C5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#F0C070',
  },
  flameEmoji: {
    fontSize: 46,
  },
  badgeRow: {
    backgroundColor: '#E8830A',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#7C3700',
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: '#7C5026',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  highlight: { fontWeight: '800', color: '#E8830A' },
  reward: { fontWeight: '800', color: '#D4A017' },
  btn: {
    width: '100%',
    backgroundColor: '#E8830A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#E8830A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  btnPressed: { backgroundColor: '#C05A00', transform: [{ scale: 0.98 }] },
  btnText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles — Phase-Up Modal
// ─────────────────────────────────────────────────────────────────────────────

const phaseUpStyles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#F0FAF4',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#83BF99',
    shadowColor: '#2D5A3D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 14,
  },
  badgeRow: {
    backgroundColor: '#5FAD89',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  phaseEmoji: {
    fontSize: 72,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#2D5A3D',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  treeName: { fontWeight: '800', color: '#2D5A3D' },
  phaseName: { fontWeight: '800', color: '#5FAD89' },
  reward: { fontWeight: '800', color: '#D4A017' },
  btn: {
    width: '100%',
    backgroundColor: '#5FAD89',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#5FAD89',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  btnPressed: { backgroundColor: '#4A9A76', transform: [{ scale: 0.98 }] },
  btnText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
});

const treeCompleteStyles = StyleSheet.create({
  badgeRow: { backgroundColor: '#D4A017' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles — Coin Popup
// ─────────────────────────────────────────────────────────────────────────────

const coinPopupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 60,
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
// Styles — No-Fertilizer Modal (redesigned)
// ─────────────────────────────────────────────────────────────────────────────

const noFertStyles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFF8F0',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0C070',
    shadowColor: '#C05A00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FEE9C5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#F0C070',
  },
  sadEmoji: {
    fontSize: 48,
  },
  warningBanner: {
    backgroundColor: '#FEE9C5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0C070',
  },
  warningBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C05A00',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#7C3700',
    marginBottom: 10,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: '#7C5026',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 14,
  },
  treeName: {
    fontWeight: '800',
    color: '#C05A00',
  },
  tipRow: {
    backgroundColor: '#FFF3DC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F5D68A',
  },
  tipText: {
    fontSize: 12,
    color: '#92710A',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 17,
  },
  acceptBtn: {
    width: '100%',
    backgroundColor: '#C05A00',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#C05A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
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
