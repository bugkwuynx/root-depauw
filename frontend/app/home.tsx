import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_HEIGHT = Dimensions.get('window').height;
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { GameColors } from '../constants/theme';
import { mockDailyTasks } from '@/data/mockTasks';

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

type TreePhase = 'seed' | 'seedling' | 'sapling' | 'young_tree' | 'full_grown';

const WATER_PER_PHASE = 7;

const PHASE_LABELS: Record<TreePhase, string> = {
  seed: 'Seed',
  seedling: 'Seedling',
  sapling: 'Sapling',
  young_tree: 'Young Tree',
  full_grown: 'Full Grown',
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock data (replace with Firestore hooks)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_USER = { name: 'Alex' };

const MOCK_GAME_STATE = {
  currentTree: {
    id: 'tree-001',
    name: 'Bambu',
    phase: 'sapling' as TreePhase,
    waterUnits: 4,
    totalWater: 18,
    createdAt: '2025-03-01',
  },
  coins: 340,
  waterToday: false,
  streak: { currentStreak: 5, zeroStreak: 0, longestStreak: 12 },
  fertilizers: 2,
};

// ─────────────────────────────────────────────────────────────────────────────
// Nav items
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Tasks',    icon: 'checkmark-done-circle-outline' as const, route: '/tasks'         },
  { label: 'Trees',    icon: 'leaf-outline'                  as const, route: '/trees'         },
  { label: 'Calendar', icon: 'calendar-outline'              as const, route: '/calendar-view' },
  { label: 'Settings', icon: 'settings-outline'              as const, route: '/setting-view'  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Tree Visual
// ─────────────────────────────────────────────────────────────────────────────

function TreeVisual({ phase, waterUnits, name }: { phase: TreePhase; waterUnits: number; name: string }) {
  const treeEmojis: Record<TreePhase, string> = {
    seed: '🌱',
    seedling: '🌿',
    sapling: '🪴',
    young_tree: '🌳',
    full_grown: '🌲',
  };

  return (
    <View style={styles.treeContainer}>
      {/* Name + phase at top */}
      <View style={styles.treeTopInfo}>
        <Text style={styles.treeName}>{name}</Text>
        <Text style={styles.treePhaseLabel}>{PHASE_LABELS[phase]}</Text>
      </View>

      {/* Emoji centered in remaining space */}
      <View style={styles.treeEmojiWrap}>
        <Text style={styles.treeEmoji}>{treeEmojis[phase]}</Text>
      </View>

      {/* Water bar at bottom */}
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
// Home Screen
// ─────────────────────────────────────────────────────────────────────────────

const ALL_TASKS = mockDailyTasks;

export default function HomeScreen() {
  const [gameState] = useState(MOCK_GAME_STATE);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // IDs of completed tasks
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  // IDs currently shown in the preview (up to 3 at a time)
  const [visibleTaskIds, setVisibleTaskIds] = useState<string[]>(
    ALL_TASKS.slice(0, 3).map((t) => t.id),
  );

  const visibleTasks = visibleTaskIds
    .map((id) => ALL_TASKS.find((t) => t.id === id)!)
    .filter(Boolean);

  const allTasksDone = completedTaskIds.size > 0 && visibleTasks.length === 0;

  const handleCompleteTask = (id: string) => {
    const newCompleted = new Set([...completedTaskIds, id]);
    setCompletedTaskIds(newCompleted);

    const newVisible = visibleTaskIds.filter((tid) => tid !== id);
    const nextTask = ALL_TASKS.find(
      (t) => !newCompleted.has(t.id) && !newVisible.includes(t.id),
    );
    setVisibleTaskIds(nextTask ? [...newVisible, nextTask.id] : newVisible);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {MOCK_USER.name}!</Text>
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
            <Text style={styles.statText}>{gameState.streak.currentStreak}</Text>
          </View>
          <View style={styles.coinBadge}>
            <FontAwesome5 name="coins" size={13} color={GameColors.coinText} />
            <Text style={styles.coinText}>{gameState.coins}</Text>
          </View>
          <View style={styles.fertBadge}>
            <Image
              source={require('../assets/icons/fertilizer.png')}
              style={styles.fertIcon}
            />
            <Text style={styles.fertText}>{gameState.fertilizers}</Text>
          </View>
        </View>
      </View>

      {/* ── Main content ── */}
      <View style={styles.mainContent}>
        <TreeVisual
          phase={gameState.currentTree.phase}
          waterUnits={gameState.currentTree.waterUnits}
          name={gameState.currentTree.name}
        />

        {/* Today's tasks preview */}
        <View style={styles.tasksPreview}>
          <Text style={styles.previewLabel}>Today's Tasks</Text>
          <View style={styles.tasksList}>
            {allTasksDone ? (
              <View style={styles.allDoneWrap}>
                <Text style={styles.allDoneText}>
                  All tasks are complete, amazing job! 🎉
                </Text>
              </View>
            ) : (
              visibleTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskRow}
                  onPress={() => handleCompleteTask(task.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskCircle} />
                  <Text style={styles.taskEmoji}>{task.emoji}</Text>
                  <Text style={styles.taskTitle} numberOfLines={1}>
                    {task.title}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
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
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.bgLight,
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
  // Pastel brown fertilizer badge
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
  // Name + phase pinned at top
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
  // Emoji fills remaining height, centered
  treeEmojiWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  treeEmoji: {
    fontSize: 160,
  },
  // Water bar sits at bottom with its own padding
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
    flex: 1,
    justifyContent: 'space-evenly',
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
