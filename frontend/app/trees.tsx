import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as gameApi from '@/lib/gameApi';

const { width: SCREEN_W } = Dimensions.get('window');
const COLS = 4;
const SLOT_W = SCREEN_W / COLS;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const USER_ID = 'testUser123';
const TOTAL_SLOTS = 12;

// Full-grown emoji for each treeId (shown in the collection shelf)
const TREE_FULL_EMOJI: Record<number, string> = {
  1: '🌲', // Oak Sapling
  2: '💐', // Cherry Blossom
  3: '🌵', // Cactus
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CompletedTree = {
  status: 'completed';
  id: number;
  name: string;
  emoji: string;
};
type LockedTree = { status: 'locked'; id: number };
type TreeSlot = CompletedTree | LockedTree;

// ─────────────────────────────────────────────────────────────────────────────
// Pot
// ─────────────────────────────────────────────────────────────────────────────

function Pot({ locked }: { locked: boolean }) {
  return (
    <View style={s.potWrap}>
      <View style={[s.potRim, locked && s.potRimLocked]} />
      <View style={[s.potBody, locked && s.potBodyLocked]} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Plant slot
// ─────────────────────────────────────────────────────────────────────────────

function PlantSlot({ slot }: { slot: TreeSlot }) {
  return (
    <View style={s.slot}>
      {slot.status === 'completed' ? (
        <>
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
// Name label
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
      <View style={s.plantsRow}>
        {slots.map((sl) => (
          <PlantSlot key={sl.id} slot={sl} />
        ))}
      </View>
      <View style={s.plank}>
        <View style={s.plankHighlight} />
        <View style={s.plankShadow} />
      </View>
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
  const [completedCount, setCompletedCount] = useState(0);
  const [slots, setSlots] = useState<TreeSlot[]>(() =>
    Array.from({ length: TOTAL_SLOTS }, (_, i) => ({ status: 'locked', id: i } as LockedTree))
  );
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        setLoading(true);
        try {
          const trees = await gameApi.getCompletedTrees(USER_ID);
          if (!active) return;

          const completed: CompletedTree[] = trees.map((t, i) => ({
            status: 'completed',
            id: i,
            name: t.name,
            emoji: TREE_FULL_EMOJI[t.treeId] ?? '🌱',
          }));

          const allSlots: TreeSlot[] = Array.from({ length: TOTAL_SLOTS }, (_, i) =>
            i < completed.length
              ? completed[i]!
              : ({ status: 'locked', id: i } as LockedTree)
          );

          setCompletedCount(completed.length);
          setSlots(allSlots);
        } catch {
          // keep showing locked slots on error
        } finally {
          if (active) setLoading(false);
        }
      }
      load();
      return () => { active = false; };
    }, [])
  );

  // Split into rows of 4
  const shelves: TreeSlot[][] = [];
  for (let i = 0; i < slots.length; i += COLS) {
    shelves.push(slots.slice(i, i + COLS));
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#2D5A3D" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>My Trees</Text>
          <Text style={s.headerSub}>Your completed garden</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>🌳 {completedCount}/{TOTAL_SLOTS}</Text>
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

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#5FAD89" />
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.shopHeader}>
            <Text style={s.shopTitle}>🌿  Tree Collection</Text>
            <Text style={s.shopHint}>Complete daily tasks to grow more trees!</Text>
          </View>

          {shelves.map((shelf, i) => (
            <Shelf key={i} slots={shelf} />
          ))}

          <View style={{ height: 48 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const WALL_COLOR = '#EFF8EE';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WALL_COLOR },

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

  awning: { flexDirection: 'row', height: 20 },
  awningStripe: { flex: 1 },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 0 },

  shopHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: WALL_COLOR,
  },
  shopTitle: { fontSize: 17, fontWeight: '700', color: '#2D5A3D' },
  shopHint: { fontSize: 12, color: '#83BF99', marginTop: 4, fontWeight: '500' },

  shelfWrap: { marginBottom: 10 },
  plantsRow: {
    flexDirection: 'row',
    backgroundColor: WALL_COLOR,
    paddingTop: 12,
    alignItems: 'flex-end',
  },

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

  potWrap: { alignItems: 'center' },
  potRim: { width: 48, height: 9, borderRadius: 5, backgroundColor: '#B84A1A' },
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
    top: 0, left: 0, right: 0,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  plankShadow: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 5,
    backgroundColor: '#A07040',
  },

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
  nameLabelLocked: { backgroundColor: '#EBEBEB', borderColor: '#D8D8D8' },
  nameLabelText: {
    fontSize: 11,
    color: '#5FAD89',
    fontWeight: '700',
    textAlign: 'center',
  },
  nameLabelTextLocked: { color: '#B8B8B8' },
});
