import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { GOAL_CATALOG } from "@/lib/goalsCatalog";
import {
  loadUserPreferences,
  newCustomGoalId,
  saveUserPreferences,
  type UserGoal,
} from "@/lib/userPreferences";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const THEME = {
  bgPrimary: "#F3FAED",
  bgSecondary: "#E1F0E3",
  accent: "#83BF99",
  accentDark: "#5FAD89",
  text: "#103C2F",
  textMuted: "#2E6B57",
  border: "rgba(16, 60, 47, 0.14)",
  card: "rgba(255, 255, 255, 0.65)",
} as const;

const CUSTOM_HABIT_MIN_LEN = 3;

const userId = "testUser123"; // TODO: get real user ID from auth context

export default function SetGoalsScreen() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [customHabit, setCustomHabit] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [prefsLoaded, setPrefsLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadUserPreferences(userId);
      if (cancelled) return;
      const presetIds = new Set<string>();
      let custom = "";
      for (const g of stored.goals) {
        if (g.kind === "preset") presetIds.add(g.presetId);
        else custom = g.label;
      }
      setSelected(presetIds);
      setCustomHabit(custom);
      setPrefsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const customHabitTrimmed = customHabit.trim();
  const customHabitOk = customHabitTrimmed.length >= CUSTOM_HABIT_MIN_LEN;

  const toggle = React.useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const canContinue =
    prefsLoaded && (selected.size > 0 || customHabitOk) && !isSaving;

  const onContinue = React.useCallback(async () => {
    if (!canContinue) return;
    setIsSaving(true);
    try {
      const prev = await loadUserPreferences(userId);
      const goals: UserGoal[] = [];
      for (const id of selected) goals.push({ kind: "preset", presetId: id });
      if (customHabitOk) {
        goals.push({
          kind: "custom",
          id: newCustomGoalId(),
          label: customHabitTrimmed,
        });
      }
      await saveUserPreferences(userId, {
        ...prev,
        goals,
        preferEmptyGoalsList: goals.length === 0,
      });
      await new Promise((r) => setTimeout(r, 200));
      router.replace("./login");
    } finally {
      setIsSaving(false);
    }
  }, [canContinue, router, selected, customHabitOk, customHabitTrimmed]);

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
                style={styles.backChip}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={styles.backChipText}>Back</Text>
              </Pressable>
              <View style={{ width: 56 }} />
            </View>

            <View style={styles.hero}>
              <Text style={styles.title}>What do you want to grow?</Text>
              <Text style={styles.subtitle}>
                Pick the areas that matter right now. You can refine them
                later—this is just a starting map.
              </Text>
            </View>

            <View style={styles.card}>
              {!prefsLoaded ? (
                <View style={styles.prefsLoading}>
                  <ActivityIndicator color="#5FAD89" />
                  <Text style={styles.prefsLoadingText}>
                    Loading your saved goals…
                  </Text>
                </View>
              ) : (
                <>
                  {GOAL_CATALOG.map((group) => (
                    <View key={group.title} style={styles.group}>
                      <Text style={styles.groupTitle}>{group.title}</Text>
                      <View style={styles.chipColumn}>
                        {group.goals.map((g) => {
                          const isOn = selected.has(g.id);
                          return (
                            <Pressable
                              key={g.id}
                              onPress={() => toggle(g.id)}
                              accessibilityRole="checkbox"
                              accessibilityState={{ checked: isOn }}
                              style={({ pressed }) => [
                                styles.chip,
                                isOn && styles.chipSelected,
                                pressed && styles.chipPressed,
                              ]}
                            >
                              <View
                                style={[
                                  styles.chipDot,
                                  isOn && styles.chipDotSelected,
                                ]}
                              />
                              <Text
                                style={[
                                  styles.chipLabel,
                                  isOn && styles.chipLabelSelected,
                                ]}
                              >
                                {g.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}

                  <View style={styles.customSection}>
                    <View style={styles.customLabelRow}>
                      <Text style={styles.customLabel}>Your own habit</Text>
                      <Text style={styles.customHint}>
                        Optional if you chose suggestions above
                      </Text>
                    </View>
                    <TextInput
                      value={customHabit}
                      onChangeText={setCustomHabit}
                      placeholder="e.g. Stretch for five minutes after work"
                      placeholderTextColor="rgba(16, 60, 47, 0.45)"
                      multiline
                      textAlignVertical="top"
                      returnKeyType="done"
                      style={styles.customInput}
                    />
                    {customHabit.length > 0 && !customHabitOk ? (
                      <Text
                        style={styles.customError}
                      >{`At least ${CUSTOM_HABIT_MIN_LEN} characters to count.`}</Text>
                    ) : null}
                  </View>
                </>
              )}
            </View>

            <Pressable
              onPress={onContinue}
              disabled={!canContinue}
              style={({ pressed }) => [
                styles.primaryButton,
                (!canContinue || isSaving) && styles.primaryButtonDisabled,
                pressed &&
                  canContinue &&
                  !isSaving &&
                  styles.primaryButtonPressed,
              ]}
            >
              {isSaving ? (
                <View style={styles.buttonRow}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Saving…</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Continue</Text>
              )}
            </Pressable>

            <Text style={styles.hint}>
              {selected.size === 0 && !customHabitOk
                ? "Choose at least one suggestion or write your own habit below."
                : [
                    selected.size > 0 ? `${selected.size} from list` : null,
                    customHabitOk ? "Custom habit added" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    paddingBottom: 32,
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
  backChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: "center",
  },
  backChipText: {
    color: THEME.textMuted,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  hero: {
    marginTop: 6,
    marginBottom: 14,
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
  card: {
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  prefsLoading: {
    paddingVertical: 28,
    alignItems: "center",
    gap: 12,
  },
  prefsLoadingText: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.textMuted,
  },
  group: {
    marginTop: 10,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: THEME.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  chipColumn: {
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  chipPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  chipSelected: {
    backgroundColor: THEME.accentDark,
    borderColor: THEME.accent,
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: THEME.accentDark,
    backgroundColor: "transparent",
  },
  chipDotSelected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  chipLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: THEME.text,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  chipLabelSelected: {
    color: "#FFFFFF",
  },
  customSection: {
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(16, 60, 47, 0.1)",
  },
  customLabelRow: {
    marginBottom: 8,
  },
  customLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: THEME.text,
    letterSpacing: -0.1,
  },
  customHint: {
    marginTop: 4,
    fontSize: 12,
    color: THEME.textMuted,
    fontWeight: "600",
    opacity: 0.9,
  },
  customInput: {
    minHeight: 96,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderWidth: 1,
    borderColor: THEME.border,
    color: THEME.text,
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 22,
  },
  customError: {
    marginTop: 8,
    fontSize: 12,
    color: "#8A1E2F",
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: 18,
    height: 52,
    borderRadius: 16,
    backgroundColor: THEME.accentDark,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hint: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: THEME.textMuted,
  },
});
