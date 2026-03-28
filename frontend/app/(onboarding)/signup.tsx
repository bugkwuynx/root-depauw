import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const THEME = {
  bgPrimary: '#F3FAED',
  bgSecondary: '#E1F0E3',
  accent: '#83BF99',
  accentDark: '#5FAD89',
  text: '#103C2F',
  textMuted: '#2E6B57',
  border: 'rgba(16, 60, 47, 0.14)',
  card: 'rgba(255, 255, 255, 0.65)',
} as const;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function SignupScreen() {
  const router = useRouter();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = React.useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = React.useState(false);

  const emailError = React.useMemo(() => {
    if (email.trim().length === 0) return '';
    if (!isValidEmail(email)) return 'Please enter a valid email.';
    return '';
  }, [email]);

  const passwordError = React.useMemo(() => {
    if (password.length === 0) return '';
    if (password.length < 8) return 'Use at least 8 characters.';
    return '';
  }, [password]);

  const confirmError = React.useMemo(() => {
    if (confirmPassword.length === 0) return '';
    if (confirmPassword !== password) return "Passwords don't match.";
    return '';
  }, [confirmPassword, password]);

  const canSubmitEmail = React.useMemo(() => {
    return (
      !isSubmittingEmail &&
      !isSubmittingGoogle &&
      name.trim().length > 0 &&
      isValidEmail(email) &&
      password.length >= 8 &&
      confirmPassword === password
    );
  }, [confirmPassword, email, isSubmittingEmail, isSubmittingGoogle, name, password]);

  const onSignupWithEmail = React.useCallback(async () => {
    if (!canSubmitEmail) return;

    setIsSubmittingEmail(true);
    try {
      // TODO: Replace with real sign-up call (backend/Firebase/Supabase/etc.)
      await new Promise((r) => setTimeout(r, 650));
      router.replace('/set-goals');
    } catch {
      Alert.alert('Sign up failed', 'Please try again.');
    } finally {
      setIsSubmittingEmail(false);
    }
  }, [canSubmitEmail, router]);

  const onSignupWithGoogle = React.useCallback(async () => {
    if (isSubmittingEmail || isSubmittingGoogle) return;

    setIsSubmittingGoogle(true);
    try {
      // TODO: Wire Google auth (expo-auth-session / Google Sign-In / etc.)
      await new Promise((r) => setTimeout(r, 650));
      Alert.alert('Google sign-in', 'Google auth is not wired yet (stub).');
    } catch {
      Alert.alert('Google sign-in failed', 'Please try again.');
    } finally {
      setIsSubmittingGoogle(false);
    }
  }, [isSubmittingEmail, isSubmittingGoogle]);

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
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 6 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <Pressable onPress={() => router.back()} style={styles.backChip} accessibilityRole="button">
                <Text style={styles.backChipText}>Back</Text>
              </Pressable>
              <View style={{ width: 56 }} />
            </View>

            <View style={styles.hero}>
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>Start growing habits today.</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Sign up with email</Text>

              <Field label="Name">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Jane Doe"
                  placeholderTextColor="rgba(16, 60, 47, 0.45)"
                  autoCapitalize="words"
                  returnKeyType="next"
                  style={styles.input}
                />
              </Field>

              <Field label="Email" error={emailError}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(16, 60, 47, 0.45)"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  style={styles.input}
                />
              </Field>

              <Field label="Password" hint="At least 8 characters" error={passwordError}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(16, 60, 47, 0.45)"
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="next"
                  style={styles.input}
                />
              </Field>

              <Field label="Confirm password" error={confirmError}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(16, 60, 47, 0.45)"
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="done"
                  style={styles.input}
                />
              </Field>

              <Pressable
                onPress={onSignupWithEmail}
                disabled={!canSubmitEmail}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (!canSubmitEmail || isSubmittingEmail) && styles.primaryButtonDisabled,
                  pressed && canSubmitEmail && styles.primaryButtonPressed,
                ]}
              >
                {isSubmittingEmail ? (
                  <View style={styles.buttonContentRow}>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Creating account…</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>Create account</Text>
                )}
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                onPress={onSignupWithGoogle}
                disabled={isSubmittingEmail || isSubmittingGoogle}
                style={({ pressed }) => [
                  styles.googleButton,
                  (isSubmittingEmail || isSubmittingGoogle) && styles.googleButtonDisabled,
                  pressed && !(isSubmittingEmail || isSubmittingGoogle) && styles.googleButtonPressed,
                ]}
              >
                {isSubmittingGoogle ? (
                  <View style={styles.buttonContentRowDark}>
                    <ActivityIndicator color={THEME.text} />
                    <Text style={styles.googleButtonText}>Opening Google…</Text>
                  </View>
                ) : (
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                )}
              </Pressable>
            </View>

            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Link href="/login" style={styles.footerLink}>
                Log in
              </Link>
            </Text>

            <Text style={styles.termsText}>
              By continuing, you agree to our Terms and acknowledge our Privacy Policy.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {!!hint && <Text style={styles.fieldHint}>{hint}</Text>}
      </View>
      <View style={styles.inputWrap}>{children}</View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },

  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
  },
  backChipText: {
    color: THEME.textMuted,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  hero: {
    marginTop: 6,
    marginBottom: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: THEME.textMuted,
    opacity: 0.95,
  },

  card: {
    marginTop: 10,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: -0.2,
    marginBottom: 10,
  },

  field: {
    marginTop: 10,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -0.1,
  },
  fieldHint: {
    fontSize: 12,
    color: THEME.textMuted,
    opacity: 0.9,
  },
  inputWrap: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    color: THEME.text,
    fontWeight: '600',
  },
  fieldError: {
    marginTop: 6,
    fontSize: 12,
    color: '#8A1E2F',
    fontWeight: '700',
  },

  primaryButton: {
    marginTop: 14,
    height: 52,
    borderRadius: 16,
    backgroundColor: THEME.accentDark,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
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
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  dividerRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(16, 60, 47, 0.12)',
  },
  dividerText: {
    fontSize: 12,
    color: THEME.textMuted,
    fontWeight: '800',
  },

  googleButton: {
    marginTop: 12,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonPressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: THEME.text,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  buttonContentRowDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  footerText: {
    marginTop: 14,
    textAlign: 'center',
    color: THEME.textMuted,
    fontWeight: '700',
  },
  footerLink: {
    color: THEME.accentDark,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  termsText: {
    marginTop: 10,
    textAlign: 'center',
    color: 'rgba(46, 107, 87, 0.85)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});
