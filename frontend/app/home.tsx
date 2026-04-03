import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  completedTrees: [
    { id: 'tree-000', phase: 'full_grown' as TreePhase, waterUnits: 7, totalWater: 35, createdAt: '2025-01-15', completedAt: '2025-02-28' },
  ],
  coins: 340,
  waterToday: false,
  streak: {
    currentStreak: 5,
    zeroStreak: 0,
    longestStreak: 12,
  },
  fertilizers: 2,
};

// First 3 daily tasks shown as incomplete on home preview
const PREVIEW_TASKS = mockDailyTasks.slice(0, 3);

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
      <View style={styles.treeEmojiWrap}>
        <Text style={styles.treeEmoji}>{treeEmojis[phase]}</Text>
      </View>

      <View style={styles.treeInfo}>
        <Text style={styles.treeName}>{name}</Text>
        <Text style={styles.treePhaseLabel}>{PHASE_LABELS[phase]}</Text>
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
// Home Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [gameState] = useState(MOCK_GAME_STATE);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
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
          {/* Streak */}
          <View style={styles.statBadge}>
            <Ionicons name="flame" size={16} color={GameColors.crossText} />
            <Text style={styles.statText}>{gameState.streak.currentStreak}</Text>
          </View>

          {/* Coins */}
          <View style={styles.coinBadge}>
            <FontAwesome5 name="coins" size={13} color={GameColors.coinText} />
            <Text style={styles.coinText}>{gameState.coins}</Text>
          </View>

          {/* Fertilizer */}
          <View style={styles.fertBadge}>
            <Ionicons name="leaf-outline" size={15} color="#3D7A3A" />
            <Text style={styles.fertText}>{gameState.fertilizers}</Text>
          </View>
        </View>
      </View>

      {/* ── Main content (tree + tasks preview) ── */}
      <View style={styles.mainContent}>
        {/* Tree */}
        <TreeVisual
          phase={gameState.currentTree.phase}
          waterUnits={gameState.currentTree.waterUnits}
          name={gameState.currentTree.name}
        />

        {/* Incomplete tasks preview */}
        <View style={styles.tasksPreview}>
          <Text style={styles.previewLabel}>Up Next</Text>
          {PREVIEW_TASKS.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <View style={styles.taskCircle} />
              <Text style={styles.taskEmoji}>{task.emoji}</Text>
              <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Bottom nav bar ── */}
      <View style={styles.navBar}>
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
  },
  dateText: {
    fontSize: 13,
    color: GameColors.textMid,
    marginTop: 2,
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
    backgroundColor: '#F0F9EE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#A8D8A0',
  },
  fertText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3D7A3A',
  },

  // ── Main content ─────────────────────────────────────────────────────────────
  mainContent: {
    flex: 1,
  },

  // ── Tree ─────────────────────────────────────────────────────────────────────
  treeContainer: {
    height: SCREEN_HEIGHT * 0.45,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: GameColors.bgSection,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GameColors.bgSection,
  },
  treeEmojiWrap: {
    flex: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  treeInfo: {
    flex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  treeBottom: {
    flex: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  treeEmoji: {
    fontSize: 160,
  },
  treeName: {
    fontSize: 24,
    fontWeight: '800',
    color: GameColors.textDark,
  },
  treePhaseLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: GameColors.textMid,
    marginTop: 2,
  },
  waterMeterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: -10,
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
    marginTop: 16,
    fontSize: 12,
    color: GameColors.textMid,
  },

  // ── Tasks preview ─────────────────────────────────────────────────────────────
  tasksPreview: {
    marginHorizontal: 20,
    marginTop: 14,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: GameColors.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: GameColors.bgSection,
    borderRadius: 10,
    marginBottom: 6,
    gap: 8,
  },
  taskCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: GameColors.accent,
  },
  taskEmoji: {
    fontSize: 15,
  },
  taskTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: GameColors.textDark,
  },

  // ── Nav bar ──────────────────────────────────────────────────────────────────
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: GameColors.bgSection,
    backgroundColor: GameColors.white,
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: GameColors.primary,
  },
});
