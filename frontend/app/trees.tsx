import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width: SCREEN_W } = Dimensions.get('window');
const COLS = 4;
const SLOT_W = SCREEN_W / COLS;

// ─────────────────────────────────────────────────────────────────────────────
// Types & mock data
// ─────────────────────────────────────────────────────────────────────────────

type CompletedTree = {
  status: 'completed';
  id: number;
  name: string;
  emoji: string;
  type: string;
};
type LockedTree = { status: 'locked'; id: number };
type TreeSlot = CompletedTree | LockedTree;

const TREE_DATA: Omit<CompletedTree, 'status' | 'id'>[] = [
  { name: 'Prickly Pete', emoji: '🌵', type: 'Cactus' },
  { name: 'Little Leaf',  emoji: '🌱', type: 'Sprout' },
  { name: 'Shroomy',      emoji: '🍄', type: 'Mushroom' },
  { name: 'Fernsby',      emoji: '🌿', type: 'Fern' },
  { name: 'Cherry Pop',   emoji: '🌸', type: 'Blossom' },
  { name: 'Bambu',        emoji: '🎋', type: 'Bamboo' },
];

const TOTAL_SLOTS = 12;
const COMPLETED_COUNT = TREE_DATA.length; // 6

const ALL_SLOTS: TreeSlot[] = Array.from({ length: TOTAL_SLOTS }, (_, i) =>
  i < COMPLETED_COUNT
    ? ({ status: 'completed', id: i, ...TREE_DATA[i] } as CompletedTree)
    : ({ status: 'locked', id: i } as LockedTree),
);

// Split into rows of 4
const SHELVES: TreeSlot[][] = [];
for (let i = 0; i < ALL_SLOTS.length; i += COLS) {
  SHELVES.push(ALL_SLOTS.slice(i, i + COLS));
}

// ─────────────────────────────────────────────────────────────────────────────
// Pot  (terracotta for completed, grey for locked)
// ─────────────────────────────────────────────────────────────────────────────

function Pot({ locked }: { locked: boolean }) {
  return (
    <View style={s.potWrap}>
      {/* Rim */}
      <View style={[s.potRim, locked && s.potRimLocked]} />
      {/* Body */}
      <View style={[s.potBody, locked && s.potBodyLocked]} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Plant slot (one cell on a shelf)
// ─────────────────────────────────────────────────────────────────────────────

function PlantSlot({ slot }: { slot: TreeSlot }) {
  return (
    <View style={s.slot}>
      {slot.status === 'completed' ? (
        <>
          {/* Completion star */}
          <View style={s.starWrap}>
            <Text style={s.star}>⭐</Text>
          </View>
          <Text style={s.plantEmoji}>{slot.emoji}</Text>
          <Pot locked={false} />
        </>
      ) : (
        <>
          <View style={s.lockedCircle}>
            <Text style={s.lockedQ}>?</Text>
          </View>
          <Pot locked />
        </>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Name label (below the shelf plank)
// ─────────────────────────────────────────────────────────────────────────────

function NameLabel({ slot }: { slot: TreeSlot }) {
  if (slot.status === 'completed') {
    return (
      <View style={s.nameLabel}>
        <Text style={s.nameLabelText} numberOfLines={1}>
          {slot.name}
        </Text>
      </View>
    );
  }
  return (
    <View style={[s.nameLabel, s.nameLabelLocked]}>
      <Text style={[s.nameLabelText, s.nameLabelTextLocked]}>???</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shelf row
// ─────────────────────────────────────────────────────────────────────────────

function Shelf({ slots }: { slots: TreeSlot[] }) {
  return (
    <View style={s.shelfWrap}>
      {/* Plants sitting above the plank */}
      <View style={s.plantsRow}>
        {slots.map((sl) => (
          <PlantSlot key={sl.id} slot={sl} />
        ))}
      </View>

      {/* Wooden shelf plank */}
      <View style={s.plank}>
        <View style={s.plankHighlight} />
        <View style={s.plankShadow} />
      </View>

      {/* Name tags below the plank */}
      <View style={s.nameRow}>
        {slots.map((sl) => (
          <NameLabel key={sl.id} slot={sl} />
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function TreesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>My Trees</Text>
          <Text style={s.headerSub}>Your completed garden</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>🌳 {COMPLETED_COUNT}/{TOTAL_SLOTS}</Text>
        </View>
      </View>

      {/* ── Striped awning ── */}
      <View style={s.awning}>
        {Array.from({ length: 30 }).map((_, i) => (
          <View
            key={i}
            style={[
              s.awningStripe,
              { backgroundColor: i % 2 === 0 ? '#5FAD89' : '#FFFFFF' },
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shop label */}
        <View style={s.shopHeader}>
          <Text style={s.shopTitle}>🌿  Tree Collection</Text>
          <Text style={s.shopHint}>Complete daily tasks to grow more trees!</Text>
        </View>

        {/* Shelves */}
        {SHELVES.map((shelf, i) => (
          <Shelf key={i} slots={shelf} />
        ))}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const WALL_COLOR = '#EFF8EE';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WALL_COLOR },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 12,
    backgroundColor: '#F3FAED',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#E1F0E3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: { fontSize: 20, color: '#2D5A3D', fontWeight: '700' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#2D5A3D', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: '#83BF99', marginTop: 1, fontWeight: '500' },
  badge: {
    backgroundColor: '#E1F0E3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: '#83BF99',
  },
  badgeText: { fontSize: 13, fontWeight: '700', color: '#5FAD89' },

  // Striped awning
  awning: { flexDirection: 'row', height: 20 },
  awningStripe: { flex: 1 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 0 },

  // Shop label above shelves
  shopHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: WALL_COLOR,
  },
  shopTitle: { fontSize: 17, fontWeight: '700', color: '#2D5A3D' },
  shopHint: { fontSize: 12, color: '#83BF99', marginTop: 4, fontWeight: '500' },

  // ── Shelf ──
  shelfWrap: { marginBottom: 10 },

  plantsRow: {
    flexDirection: 'row',
    backgroundColor: WALL_COLOR,
    paddingTop: 12,
    alignItems: 'flex-end', // pots sit on the shelf
  },

  // Single plant slot
  slot: {
    width: SLOT_W,
    alignItems: 'center',
    paddingBottom: 4,
    position: 'relative',
  },
  starWrap: {
    position: 'absolute',
    top: 0,
    right: SLOT_W * 0.1,
    zIndex: 1,
  },
  star: { fontSize: 12 },
  plantEmoji: {
    fontSize: 44,
    textAlign: 'center',
    marginBottom: 2,
  },

  // Locked "?" circle
  lockedCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCDCDC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#C0C0C0',
  },
  lockedQ: { fontSize: 24, color: '#B0B0B0', fontWeight: '900' },

  // Pot
  potWrap: { alignItems: 'center' },
  potRim: {
    width: 48,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#B84A1A',
  },
  potRimLocked: { backgroundColor: '#AAAAAA' },
  potBody: {
    width: 40,
    height: 30,
    backgroundColor: '#D4622A',
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    marginTop: -2,
  },
  potBodyLocked: { backgroundColor: '#C8C8C8' },

  // Wooden plank
  plank: {
    height: 20,
    backgroundColor: '#C8915A',
    overflow: 'hidden',
    shadowColor: '#6B4020',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 5,
  },
  plankHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  plankShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: '#A07040',
  },

  // Name row
  nameRow: {
    flexDirection: 'row',
    backgroundColor: WALL_COLOR,
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 4,
  },
  nameLabel: {
    width: SLOT_W - 10,
    marginHorizontal: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  nameLabelLocked: {
    backgroundColor: '#EBEBEB',
    borderColor: '#D8D8D8',
  },
  nameLabelText: {
    fontSize: 11,
    color: '#5FAD89',
    fontWeight: '700',
    textAlign: 'center',
  },
  nameLabelTextLocked: { color: '#B8B8B8' },
});
