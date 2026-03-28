import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
import { Ionicons } from '@expo/vector-icons';
import { GameColors } from '../constants/theme';

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

const ALL_PHASES: TreePhase[] = [
  'seed',
  'seedling',
  'sapling',
  'young_tree',
  'full_grown',
];

// ─────────────────────────────────────────────────────────────────────────────
// Mock data (replace with Firestore hooks)
// ─────────────────────────────────────────────────────────────────────────────

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
      {/* Emoji — 75% */}
      <View style={styles.treeEmojiWrap}>
        <Text style={styles.treeEmoji}>{treeEmojis[phase]}</Text>
      </View>

      {/* Name + phase — 10% */}
      <View style={styles.treeInfo}>
        <Text style={styles.treeName}>{name}</Text>
        <Text style={styles.treePhaseLabel}>{PHASE_LABELS[phase]}</Text>
      </View>

      {/* Water — 15% */}
      <View style={styles.treeBottom}>
        <View style={styles.waterMeterRow}>
          {Array.from({ length: WATER_PER_PHASE }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.waterDrop,
                i < waterUnits && styles.waterDropFilled,
              ]}
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning!</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statBadge}>
            <Ionicons name="flame" size={16} color={GameColors.crossText} />
            <Text style={styles.statText}>{gameState.streak.currentStreak}</Text>
          </View>
          <View style={styles.coinBadge}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinText}>{gameState.coins}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        {/* Tree */}
        <TreeVisual
          phase={gameState.currentTree.phase}
          waterUnits={gameState.currentTree.waterUnits}
          name={gameState.currentTree.name}
        />

        {/* Water Button */}
        <TouchableOpacity
          style={[
            styles.waterBtn,
            gameState.currentTree.waterUnits === 0 && styles.waterBtnDisabled,
          ]}
          activeOpacity={0.8}
          onPress={() => router.push('/tasks')}
        >
          <Ionicons name="water" size={20} color={GameColors.white} />
          <Text style={styles.waterBtnText}>Water your tree</Text>
        </TouchableOpacity>

        {/* Fertilizer */}
        {gameState.fertilizers > 0 && (
          <View style={styles.fertilizerBanner}>
            <Image
              source={require('../assets/icons/fertilizer.png')}
              style={styles.fertilizerIcon}
            />
            <Text style={styles.fertilizerText}>
              {gameState.fertilizers} fertilizer{gameState.fertilizers > 1 ? 's' : ''}
            </Text>
          </View>
        )}

      </ScrollView>
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

  // Header
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
    gap: 10,
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
    gap: 4,
    borderWidth: 1,
    borderColor: GameColors.coinBorder,
  },
  coinIcon: {
    fontSize: 14,
  },
  coinText: {
    fontSize: 14,
    fontWeight: '700',
    color: GameColors.coinText,
  },
  screenContent: {
    flex: 1,
    paddingBottom: 16,
  },

  // Tree
  treeContainer: {
    height: SCREEN_HEIGHT * 0.65,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: GameColors.bgSection,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GameColors.bgSection,
  },
  treeTop: {
    alignItems: 'center',
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
    fontSize: 200,
    marginTop: SCREEN_HEIGHT * 0.15,
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

  // Water button
  waterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: GameColors.primary,
    paddingVertical: 15,
    borderRadius: 16,
  },
  waterBtnDisabled: {
    backgroundColor: '#B8B8B8',
  },
  waterBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: GameColors.white,
  },

  // Fertilizer
  fertilizerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: GameColors.coinBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GameColors.coinBorder,
  },
  fertilizerIcon: {
    width: 24,
    height: 24,
  },
  fertilizerText: {
    fontSize: 15,
    color: GameColors.coinText,
    fontWeight: '600',
  },

  // Growth progress
  growthSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GameColors.textDark,
    marginBottom: 14,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  growthItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  growthDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCDCDC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C0C0C0',
    zIndex: 1,
  },
  growthDotDone: {
    backgroundColor: GameColors.primary,
    borderColor: GameColors.primary,
  },
  growthDotActive: {
    backgroundColor: GameColors.bgSection,
    borderColor: GameColors.primary,
    borderWidth: 2.5,
  },
  growthLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B0B0B0',
    marginTop: 6,
    textAlign: 'center',
  },
  growthLabelActive: {
    color: GameColors.textDark,
  },
  growthLine: {
    position: 'absolute',
    top: 11,
    right: '50%',
    left: '-50%',
    height: 2,
    backgroundColor: '#D8D8D8',
    zIndex: 0,
  },
  growthLineDone: {
    backgroundColor: GameColors.primary,
  },

  // Quick stats card
  quickCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: GameColors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: GameColors.accent,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: GameColors.textDark,
  },
  quickValue: {
    fontSize: 14,
    fontWeight: '800',
    color: GameColors.primary,
  },
  quickDivider: {
    height: 1,
    backgroundColor: GameColors.bgSection,
  },
});
