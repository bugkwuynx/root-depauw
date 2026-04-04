import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getAllPresetIds,
  getPresetLabel,
  GOAL_CATALOG,
} from "@/lib/goalsCatalog";
import {
  DEFAULT_USER_PREFERENCES,
  loadUserPreferences,
  newCustomGoalId,
  saveUserPreferences,
  type UserGoal,
  type UserPreferences,
} from "@/lib/userPreferences";

const THEME = {
  bgPrimary: "#F3FAED",
  bgSecondary: "#E1F0E3",
  accent: "#83BF99",
  accentDark: "#5FAD89",
  text: "#103C2F",
  textMuted: "#2E6B57",
  border: "rgba(16, 60, 47, 0.14)",
  card: "rgba(255, 255, 255, 0.65)",
  danger: "#8A1E2F",
} as const;

const CUSTOM_GOAL_MIN = 3;

/** Sample goals when storage is empty (UI/dev). Set false to show the real empty state in production. */
const USE_MOCK_GOALS_WHEN_EMPTY = true;

const MOCK_GOALS: UserGoal[] = [
  { kind: "preset", presetId: "move" },
  { kind: "preset", presetId: "learn" },
  {
    kind: "custom",
    id: "mock_goal_read",
    label: "Read for 20 minutes most days",
  },
  {
    kind: "custom",
    id: "mock_goal_journal",
    label: "Journal three evenings a week",
  },
];

function goalLabel(g: UserGoal): string {
  if (g.kind === "preset") return getPresetLabel(g.presetId);
  return g.label;
}

function presetIdsOnProfile(goals: UserGoal[]): Set<string> {
  const s = new Set<string>();
  for (const g of goals) {
    if (g.kind === "preset") s.add(g.presetId);
  }
  return s;
}

export default function SettingViewScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = React.useState<UserPreferences>(
    DEFAULT_USER_PREFERENCES,
  );
  const [loading, setLoading] = React.useState(true);
  const [savingField, setSavingField] = React.useState<string | null>(null);

  const [addOpen, setAddOpen] = React.useState(false);
  const [customDraft, setCustomDraft] = React.useState("");
  const [displayNameDraft, setDisplayNameDraft] = React.useState("");

  const [editCustom, setEditCustom] = React.useState<UserGoal | null>(null);
  const [editDraft, setEditDraft] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const next = await loadUserPreferences();
      setPrefs(next);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!loading) {
      setDisplayNameDraft(prefs.displayName);
    }
  }, [loading, prefs.displayName]);

  const persist = React.useCallback(
    async (next: UserPreferences, fieldKey: string) => {
      setSavingField(fieldKey);
      try {
        await saveUserPreferences(next);
        setPrefs(next);
      } catch {
        Alert.alert("Could not save", "Please try again.");
      } finally {
        setSavingField(null);
      }
    },
    [],
  );

  const displayedGoals = React.useMemo((): UserGoal[] => {
    if (prefs.goals.length > 0) return prefs.goals;
    if (USE_MOCK_GOALS_WHEN_EMPTY && !prefs.preferEmptyGoalsList)
      return MOCK_GOALS;
    return [];
  }, [prefs.goals, prefs.preferEmptyGoalsList]);

  const persistGoals = (nextGoals: UserGoal[]) => {
    void persist(
      {
        ...prefs,
        goals: nextGoals,
        preferEmptyGoalsList: nextGoals.length === 0,
      },
      "goals",
    );
  };

  const removeGoal = (index: number) => {
    const nextGoals = displayedGoals.filter((_, i) => i !== index);
    persistGoals(nextGoals);
  };

  const addPreset = (presetId: string) => {
    const taken = presetIdsOnProfile(displayedGoals);
    if (taken.has(presetId)) return;
    const nextGoals = [
      ...displayedGoals,
      { kind: "preset" as const, presetId },
    ];
    persistGoals(nextGoals);
    setAddOpen(false);
  };

  const addCustomFromModal = () => {
    const label = customDraft.trim();
    if (label.length < CUSTOM_GOAL_MIN) return;
    const nextGoals = [
      ...displayedGoals,
      { kind: "custom" as const, id: newCustomGoalId(), label },
    ];
    persistGoals(nextGoals);
    setCustomDraft("");
    setAddOpen(false);
  };

  const openEditCustom = (g: UserGoal) => {
    if (g.kind !== "custom") return;
    setEditCustom(g);
    setEditDraft(g.label);
  };

  const saveEditCustom = () => {
    if (!editCustom || editCustom.kind !== "custom") return;
    const label = editDraft.trim();
    if (label.length < CUSTOM_GOAL_MIN) return;
    const nextGoals = displayedGoals.map((g) =>
      g.kind === "custom" && g.id === editCustom.id ? { ...g, label } : g,
    );
    persistGoals(nextGoals);
    setEditCustom(null);
  };

  const availablePresetIds = React.useMemo(() => {
    const taken = presetIdsOnProfile(displayedGoals);
    return getAllPresetIds().filter((id) => !taken.has(id));
  }, [displayedGoals]);

  return (
    <LinearGradient
      colors={[THEME.bgPrimary, THEME.bgSecondary]}
      start={{ x: 0.1, y: 0.0 }}
      end={{ x: 0.9, y: 1.0 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 6 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
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

            <View style={styles.hero}>
              <Text style={styles.title}>Account & goals</Text>
              <Text style={styles.subtitle}>
                Update what you are working toward and how the app should feel
                day to day.
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={THEME.accentDark} />
                <Text style={styles.loadingText}>Loading your settings…</Text>
              </View>
            ) : (
              <>
                <View style={styles.sectionCard}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                      Profile
                    </Text>
                    {savingField === "profile" ? (
                      <ActivityIndicator
                        size="small"
                        color={THEME.accentDark}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.fieldLabel}>Current name</Text>
                  <Text style={styles.currentNameValue}>
                    {prefs.displayName.trim().length > 0
                      ? prefs.displayName.trim()
                      : "Not set yet"}
                  </Text>
                  <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                    New name
                  </Text>
                  <TextInput
                    value={displayNameDraft}
                    onChangeText={setDisplayNameDraft}
                    placeholder="How should we greet you?"
                    placeholderTextColor="rgba(16, 60, 47, 0.45)"
                    style={styles.input}
                    returnKeyType="done"
                    editable={savingField !== "profile"}
                  />
                  <Pressable
                    onPress={() => {
                      const displayName = displayNameDraft.trim();
                      void persist({ ...prefs, displayName }, "profile");
                    }}
                    disabled={
                      savingField === "profile" ||
                      displayNameDraft.trim() === prefs.displayName.trim()
                    }
                    style={({ pressed }) => [
                      styles.profileSaveBtn,
                      (savingField === "profile" ||
                        displayNameDraft.trim() === prefs.displayName.trim()) &&
                        styles.profileSaveBtnDisabled,
                      pressed &&
                        savingField !== "profile" &&
                        displayNameDraft.trim() !== prefs.displayName.trim() &&
                        styles.profileSaveBtnPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Save display name"
                  >
                    <Text style={styles.profileSaveBtnText}>Save name</Text>
                  </Pressable>
                </View>

                <View style={styles.sectionCard}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>Your goals</Text>
                    {savingField === "goals" ? (
                      <ActivityIndicator
                        size="small"
                        color={THEME.accentDark}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.sectionHint}>
                    Add suggestions from the list or write your own.
                  </Text>

                  {displayedGoals.length === 0 ? (
                    <Text style={styles.emptyGoals}>
                      No goals yet. Add one to get started.
                    </Text>
                  ) : (
                    <View style={styles.goalList}>
                      {displayedGoals.map((g, index) => (
                        <View
                          key={
                            g.kind === "preset"
                              ? `p-${g.presetId}`
                              : `c-${g.id}`
                          }
                          style={styles.goalRow}
                        >
                          <View style={styles.goalTextCol}>
                            <Text style={styles.goalLabel}>{goalLabel(g)}</Text>
                            <Text style={styles.goalKindTag}>
                              {g.kind === "preset" ? "Suggested" : "Custom"}
                            </Text>
                          </View>
                          <View style={styles.goalActions}>
                            {g.kind === "custom" ? (
                              <Pressable
                                onPress={() => openEditCustom(g)}
                                style={styles.smallBtn}
                                accessibilityRole="button"
                                accessibilityLabel="Edit goal"
                              >
                                <Text style={styles.smallBtnText}>Edit</Text>
                              </Pressable>
                            ) : null}
                            <Pressable
                              onPress={() => removeGoal(index)}
                              style={styles.smallBtnDanger}
                              accessibilityRole="button"
                              accessibilityLabel="Remove goal"
                            >
                              <Text style={styles.smallBtnDangerText}>
                                Remove
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <Pressable
                    onPress={() => setAddOpen(true)}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      pressed && styles.secondaryBtnPressed,
                    ]}
                  >
                    <Text style={styles.secondaryBtnText}>Add goal</Text>
                  </Pressable>
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Preferences</Text>

                  <View style={styles.switchRow}>
                    <View style={styles.switchLabels}>
                      <Text style={styles.switchTitle}>Gentle reminders</Text>
                      <Text style={styles.switchSubtitle}>
                        Nudges to check in with your goals
                      </Text>
                    </View>
                    <Switch
                      value={prefs.remindersEnabled}
                      onValueChange={(remindersEnabled) => {
                        const next = { ...prefs, remindersEnabled };
                        setPrefs(next);
                        void persist(next, "prefs");
                      }}
                      trackColor={{
                        false: "rgba(16,60,47,0.2)",
                        true: THEME.accent,
                      }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="rgba(16,60,47,0.2)"
                    />
                  </View>

                </View>

                <Pressable
                  onPress={() =>
                    Alert.alert(
                      "Sign out",
                      "This will clear this session when connected to a real account. For now it is a placeholder.",
                      [{ text: "OK" }],
                    )
                  }
                  style={styles.ghostBtn}
                >
                  <Text style={styles.ghostBtnText}>Sign out</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={addOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setAddOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setAddOpen(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add a goal</Text>
            <Text style={styles.modalSubtitle}>
              Pick a suggestion or add your own wording.
            </Text>

            <ScrollView
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              {availablePresetIds.length === 0 ? (
                <Text style={styles.modalEmpty}>
                  All suggested goals are already on your list.
                </Text>
              ) : (
                GOAL_CATALOG.map((group) => {
                  const items = group.goals.filter((g) =>
                    availablePresetIds.includes(g.id),
                  );
                  if (items.length === 0) return null;
                  return (
                    <View key={group.title} style={styles.modalGroup}>
                      <Text style={styles.modalGroupTitle}>{group.title}</Text>
                      {items.map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() => addPreset(item.id)}
                          style={({ pressed }) => [
                            styles.modalRow,
                            pressed && styles.modalRowPressed,
                          ]}
                        >
                          <Text style={styles.modalRowText}>{item.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  );
                })
              )}

              <View style={styles.modalCustomBlock}>
                <Text style={styles.modalGroupTitle}>Custom</Text>
                <TextInput
                  value={customDraft}
                  onChangeText={setCustomDraft}
                  placeholder="Describe your goal in your own words"
                  placeholderTextColor="rgba(16, 60, 47, 0.45)"
                  multiline
                  style={styles.modalInput}
                  textAlignVertical="top"
                />
                {customDraft.trim().length > 0 &&
                customDraft.trim().length < CUSTOM_GOAL_MIN ? (
                  <Text
                    style={styles.modalError}
                  >{`At least ${CUSTOM_GOAL_MIN} characters.`}</Text>
                ) : null}
                <Pressable
                  onPress={addCustomFromModal}
                  disabled={customDraft.trim().length < CUSTOM_GOAL_MIN}
                  style={({ pressed }) => [
                    styles.modalPrimary,
                    customDraft.trim().length < CUSTOM_GOAL_MIN &&
                      styles.modalPrimaryDisabled,
                    pressed &&
                      customDraft.trim().length >= CUSTOM_GOAL_MIN &&
                      styles.modalPrimaryPressed,
                  ]}
                >
                  <Text style={styles.modalPrimaryText}>Add custom goal</Text>
                </Pressable>
              </View>
            </ScrollView>

            <Pressable
              onPress={() => setAddOpen(false)}
              style={styles.modalClose}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={editCustom != null} animationType="fade" transparent>
        <View style={styles.editOverlay}>
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>Edit custom goal</Text>
            <TextInput
              value={editDraft}
              onChangeText={setEditDraft}
              multiline
              style={styles.modalInput}
              textAlignVertical="top"
            />
            {editDraft.trim().length > 0 &&
            editDraft.trim().length < CUSTOM_GOAL_MIN ? (
              <Text
                style={styles.modalError}
              >{`At least ${CUSTOM_GOAL_MIN} characters.`}</Text>
            ) : null}
            <View style={styles.editActions}>
              <Pressable
                onPress={() => setEditCustom(null)}
                style={styles.editCancel}
              >
                <Text style={styles.editCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveEditCustom}
                disabled={editDraft.trim().length < CUSTOM_GOAL_MIN}
                style={[
                  styles.editSave,
                  editDraft.trim().length < CUSTOM_GOAL_MIN &&
                    styles.modalPrimaryDisabled,
                ]}
              >
                <Text style={styles.editSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#E1F0E3",
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    marginTop: 6,
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: THEME.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: THEME.textMuted,
    fontWeight: "600",
    opacity: 0.95,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.textMuted,
  },
  sectionCard: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: THEME.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.textMuted,
    marginBottom: 12,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: THEME.text,
    marginBottom: 8,
  },
  fieldHint: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: THEME.textMuted,
  },
  currentNameValue: {
    fontSize: 17,
    fontWeight: "800",
    color: THEME.text,
    lineHeight: 24,
  },
  profileSaveBtn: {
    marginTop: 12,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.accentDark,
  },
  profileSaveBtnPressed: { opacity: 0.92 },
  profileSaveBtnDisabled: {
    backgroundColor: "rgba(95, 173, 137, 0.35)",
  },
  profileSaveBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderWidth: 1,
    borderColor: THEME.border,
    color: THEME.text,
    fontWeight: "600",
    fontSize: 15,
  },
  emptyGoals: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.textMuted,
    marginBottom: 12,
  },
  goalList: { gap: 10 },
  goalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  goalTextCol: { flex: 1 },
  goalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.text,
    lineHeight: 20,
  },
  goalKindTag: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "800",
    color: THEME.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  goalActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(95, 173, 137, 0.15)",
  },
  smallBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: THEME.accentDark,
  },
  smallBtnDanger: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(138, 30, 47, 0.1)",
  },
  smallBtnDangerText: {
    fontSize: 13,
    fontWeight: "800",
    color: THEME.danger,
  },
  secondaryBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.accentDark,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  secondaryBtnPressed: { opacity: 0.9 },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: THEME.accentDark,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  },
  switchLabels: { flex: 1 },
  switchTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: THEME.text,
  },
  switchSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: THEME.textMuted,
    lineHeight: 18,
  },
  ghostBtn: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  ghostBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: THEME.textMuted,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(16, 60, 47, 0.35)",
  },
  modalSheet: {
    width: "100%",
    maxHeight: "88%",
    backgroundColor: "#F7FBF5",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(16, 60, 47, 0.18)",
    marginTop: 10,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: THEME.text,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    color: THEME.textMuted,
    marginBottom: 12,
    lineHeight: 20,
  },
  modalScroll: { flexGrow: 0, maxHeight: 420 },
  modalGroup: { marginBottom: 14 },
  modalGroupTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: THEME.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  modalRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 8,
  },
  modalRowPressed: { opacity: 0.92 },
  modalRowText: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.text,
    lineHeight: 20,
  },
  modalEmpty: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.textMuted,
    marginBottom: 12,
  },
  modalCustomBlock: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(16, 60, 47, 0.1)",
  },
  modalInput: {
    minHeight: 88,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: THEME.border,
    color: THEME.text,
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 22,
  },
  modalError: {
    marginTop: 8,
    fontSize: 12,
    color: THEME.danger,
    fontWeight: "700",
  },
  modalPrimary: {
    marginTop: 12,
    height: 48,
    borderRadius: 16,
    backgroundColor: THEME.accentDark,
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryDisabled: { opacity: 0.5 },
  modalPrimaryPressed: { opacity: 0.95 },
  modalPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
  modalClose: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: "800",
    color: THEME.textMuted,
  },
  editOverlay: {
    flex: 1,
    backgroundColor: "rgba(16, 60, 47, 0.4)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  editCard: {
    borderRadius: 22,
    padding: 20,
    backgroundColor: "#F7FBF5",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: THEME.text,
    marginBottom: 12,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  editCancel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  editCancelText: {
    fontSize: 15,
    fontWeight: "800",
    color: THEME.textMuted,
  },
  editSave: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: THEME.accentDark,
  },
  editSaveText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
