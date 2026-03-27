import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextStyle,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THEME = {
  bgPrimary: '#F3FAED',
  bgSecondary: '#E1F0E3',
  accenLight: '#92BFA2',
  accent: '#83BF99',
  accentDark: '#5FAD89',
  ground: '#BCB0A0',
  groundDark: '#5A534B'

} as const;

type HowItWorksSlide = {
  key: string;
  title: string;
  subtitle: string;
  renderIllustration: () => React.ReactNode;
};

const SLIDES: HowItWorksSlide[] = [
  {
    key: 'plant',
    title: 'Plant habits like seeds',
    subtitle: 'Choose habits you want to grow',
    renderIllustration: () => <PlantIllustration />,
  },
  {
    key: 'nurture',
    title: 'Complete daily tasks',
    subtitle: 'Water your tree by showing up every day',
    renderIllustration: () => <NurtureIllustration />,
  },
  {
    key: 'grow',
    title: 'Watch your garden thrive',
    subtitle: 'Consistency turns into visible growth',
    renderIllustration: () => <GrowIllustration />,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = React.useRef<ScrollView | null>(null);
  const [mode, setMode] = React.useState<'welcome' | 'howItWorks'>('welcome');
  const [page, setPage] = React.useState(0);

  const goToHowItWorks = React.useCallback(() => {
    setMode('howItWorks');
    setPage(0);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    });
  }, []);

  const onScroll = React.useCallback((e: any) => {
    const x = e?.nativeEvent?.contentOffset?.x ?? 0;
    const nextPage = Math.round(x / SCREEN_WIDTH);
    setPage(nextPage);
  }, []);

  return (
    <LinearGradient
      colors={[THEME.bgPrimary, THEME.bgSecondary]}
      start={{ x: 0.1, y: 0.0 }}
      end={{ x: 0.9, y: 1.0 }}
      style={viewStyles.gradient}
    >
      <SafeAreaView style={viewStyles.safe}>
        {mode === 'welcome' ? (
          <View style={viewStyles.welcomeWrap}>
            <View style={viewStyles.illustrationCenter}>
              <SeedToTreeAnimation />
            </View>

            <View style={viewStyles.brandBlock}>
              <Text style={textStyles.appName}>Root</Text>
              <Text style={textStyles.title}>Grow Your Life, One Habit at a Time</Text>
              <Text style={textStyles.subtitle}>Turn your daily actions into a thriving forest</Text>
            </View>

            <View style={viewStyles.ctaRow}>
              <Pressable onPress={goToHowItWorks} style={viewStyles.primaryButton}>
                <Text style={textStyles.primaryButtonText}>Start Growing</Text>
              </Pressable>

              <Pressable onPress={() => router.push('/login')} style={viewStyles.secondaryButton}>
                <Text style={textStyles.secondaryButtonText}>I already have an account</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={viewStyles.howItWorksWrap}>
            <View style={viewStyles.topBar}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setMode('welcome')}
                style={viewStyles.backChip}
              >
                <Text style={textStyles.backChipText}>Back</Text>
              </Pressable>
              <Text style={textStyles.topBarTitle}>How it works</Text>
              <View style={{ width: 56 }} />
            </View>

            <ScrollView
              ref={(r) => {
                scrollRef.current = r;
              }}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              contentContainerStyle={viewStyles.pagerContent}
            >
              {SLIDES.map((s) => (
                <View key={s.key} style={viewStyles.slide}>
                  <View style={viewStyles.slideIllustration}>{s.renderIllustration()}</View>
                  <Text style={textStyles.slideTitle}>{s.title}</Text>
                  <Text style={textStyles.slideSubtitle}>{s.subtitle}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={viewStyles.footer}>
              <Dots count={SLIDES.length} active={page} />
              <View style={viewStyles.footerButtons}>
                <Pressable
                  style={[viewStyles.ghostButton, page === 0 && viewStyles.ghostButtonDisabled]}
                  disabled={page === 0}
                  onPress={() => {
                    const next = Math.max(0, page - 1);
                    scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
                  }}
                >
                  <Text
                    style={[
                      textStyles.ghostButtonText,
                      page === 0 && textStyles.ghostButtonTextDisabled,
                    ]}
                  >
                    Previous
                  </Text>
                </Pressable>

                <Pressable
                  style={viewStyles.primaryButtonSmall}
                  onPress={() => {
                    if (page < SLIDES.length - 1) {
                      const next = page + 1;
                      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
                      return;
                    }
                    router.push('/signup');
                  }}
                >
                  <Text style={textStyles.primaryButtonTextSmall}>
                    {page < SLIDES.length - 1 ? 'Next' : 'Get started'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function SeedToTreeAnimation() {
  const seedScale = React.useRef(new Animated.Value(1)).current;
  const seedOpacity = React.useRef(new Animated.Value(1)).current;
  const stemScaleY = React.useRef(new Animated.Value(0)).current;
  const canopyScale = React.useRef(new Animated.Value(0)).current;
  const canopyOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(seedScale, { toValue: 0.85, duration: 550, useNativeDriver: true }),
          Animated.timing(seedOpacity, { toValue: 0.85, duration: 550, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(seedScale, { toValue: 0.0, duration: 500, useNativeDriver: true }),
          Animated.timing(seedOpacity, { toValue: 0.0, duration: 500, useNativeDriver: true }),
          Animated.timing(stemScaleY, { toValue: 1, duration: 850, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(canopyOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.spring(canopyScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }),
        ]),
        Animated.delay(700),
        Animated.parallel([
          Animated.timing(seedScale, { toValue: 1, duration: 1, useNativeDriver: true }),
          Animated.timing(seedOpacity, { toValue: 1, duration: 1, useNativeDriver: true }),
          Animated.timing(stemScaleY, { toValue: 0, duration: 1, useNativeDriver: true }),
          Animated.timing(canopyScale, { toValue: 0, duration: 1, useNativeDriver: true }),
          Animated.timing(canopyOpacity, { toValue: 0, duration: 1, useNativeDriver: true }),
        ]),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [canopyOpacity, canopyScale, seedOpacity, seedScale, stemScaleY]);

  return (
    <View style={animStyles.wrap}>
      <View style={animStyles.ground} />

      <Animated.View
        style={[
          animStyles.seed,
          {
            opacity: seedOpacity,
            transform: [{ scale: seedScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          animStyles.stem,
          {
            transform: [{ scaleY: stemScaleY }],
          },
        ]}
      />

      <Animated.View
        style={[
          animStyles.canopy,
          {
            opacity: canopyOpacity,
            transform: [{ scale: canopyScale }],
          },
        ]}
      />
    </View>
  );
}

function PlantIllustration() {
  return (
    <View style={illusStyles.frame}>
      <View style={illusStyles.soil} />
      <View style={illusStyles.soilLip} />
      <View style={illusStyles.seed} />
      <View style={illusStyles.leafLeft} />
      <View style={illusStyles.leafRight} />
    </View>
  );
}

function NurtureIllustration() {
  return (
    <View style={illusStyles.frame}>
      <View style={illusStyles.sun} />
      <View style={illusStyles.waterDrop1} />
      <View style={illusStyles.waterDrop2} />
      <View style={illusStyles.waterDrop3} />
      <View style={illusStyles.smallStem} />
      <View style={illusStyles.smallCanopy} />
      <View style={illusStyles.soil} />
      <View style={illusStyles.soilLip} />
    </View>
  );
}

function GrowIllustration() {
  return (
    <View style={illusStyles.frame}>
      <View style={illusStyles.forestBack} />
      <View style={illusStyles.treeTrunk} />
      <View style={illusStyles.treeTop} />
      <View style={illusStyles.forestFront} />
    </View>
  );
}

function Dots({ count, active }: { count: number; active: number }) {
  return (
    <View style={viewStyles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[viewStyles.dot, i === active ? viewStyles.dotActive : viewStyles.dotInactive]}
        />
      ))}
    </View>
  );
}

const viewStyles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },

  welcomeWrap: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 24,
  },
  illustrationCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  brandBlock: {
    paddingTop: 8,
  },
  ctaRow: {
    marginTop: 18,
    gap: 10,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: THEME.accentDark,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: THEME.bgPrimary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.accent,
  },

  howItWorksWrap: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: THEME.bgPrimary,
    borderWidth: 1,
    borderColor: THEME.accent,
    width: 60,
    alignItems: 'center',
  },
  pagerContent: {},
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 22,
    paddingTop: 18,
    alignItems: 'center',
  },
  slideIllustration: {
    marginTop: 14,
    marginBottom: 18,
  },
  footer: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  dotActive: {
    width: 22,
    backgroundColor: THEME.accentDark,
  },
  dotInactive: {
    backgroundColor: THEME.accent,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  ghostButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: THEME.bgPrimary,
    borderWidth: 1,
    borderColor: THEME.accent,
    alignItems: 'center',
  },
  ghostButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonSmall: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: THEME.accentDark,
    alignItems: 'center',
  },
});

type TextStyleMap = {
  appName: TextStyle;
  title: TextStyle;
  subtitle: TextStyle;
  primaryButtonText: TextStyle;
  secondaryButtonText: TextStyle;
  backChipText: TextStyle;
  topBarTitle: TextStyle;
  slideTitle: TextStyle;
  slideSubtitle: TextStyle;
  ghostButtonText: TextStyle;
  ghostButtonTextDisabled: TextStyle;
  primaryButtonTextSmall: TextStyle;
};

const textStyles = StyleSheet.create<TextStyleMap>({
  appName: {
    color: THEME.accentDark,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 10,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    color: THEME.accentDark,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 20,
    color: THEME.accentDark,
    fontWeight: '700',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  secondaryButtonText: {
    color: THEME.accentDark,
    fontWeight: '900',
    fontSize: 14,
  },
  backChipText: {
    color: THEME.accentDark,
    fontWeight: '900',
    fontSize: 13,
  },
  topBarTitle: {
    color: THEME.accentDark,
    fontWeight: '900',
    letterSpacing: -0.3,
    fontSize: 16,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.accentDark,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  slideSubtitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '800',
    color: THEME.accentDark,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
  },
  ghostButtonText: {
    color: THEME.accentDark,
    fontWeight: '900',
    fontSize: 14,
  },
  ghostButtonTextDisabled: {
    color: THEME.accent,
  },
  primaryButtonTextSmall: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
});

const animStyles = StyleSheet.create({
  wrap: {
    width: 220,
    height: 220,
    borderRadius: 28,
    backgroundColor: THEME.bgPrimary,
    borderWidth: 1,
    borderColor: THEME.accent,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    height: 78,
    width: '100%',
    backgroundColor: '#BCB0A0',
  },
  seed: {
    position: 'absolute',
    bottom: 62,
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#5A534B',
    borderWidth: 2,
    borderColor: '#5A534B',
  },
  stem: {
    position: 'absolute',
    bottom: 72,
    width: 8,
    height: 68,
    borderRadius: 8,
    backgroundColor: THEME.groundDark,
  },
  canopy: {
    position: 'absolute',
    bottom: 120,
    width: 92,
    height: 72,
    borderRadius: 38,
    backgroundColor: THEME.accent,
    borderWidth: 2,
    borderColor: THEME.accentDark,
  },
});

const illusStyles = StyleSheet.create({
  frame: {
    width: 280,
    height: 220,
    borderRadius: 26,
    backgroundColor: THEME.bgPrimary,
    borderWidth: 1,
    borderColor: THEME.accent,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soil: {
    position: 'absolute',
    bottom: 0,
    height: 86,
    width: '100%',
    backgroundColor: THEME.groundDark,
  },
  soilLip: {
    position: 'absolute',
    bottom: 76,
    height: 12,
    width: '100%',
    backgroundColor: THEME.ground,
  },
  seed: {
    position: 'absolute',
    bottom: 78,
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: THEME.groundDark,
    borderWidth: 2,
    borderColor: THEME.groundDark,
  },
  leafLeft: {
    position: 'absolute',
    bottom: 104,
    left: 126,
    width: 34,
    height: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: THEME.accenLight,
    transform: [{ rotate: '-18deg' }],
  },
  leafRight: {
    position: 'absolute',
    bottom: 104,
    right: 126,
    width: 34,
    height: 18,
    borderTopLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: THEME.accentDark,
    transform: [{ rotate: '18deg' }],
  },
  sun: {
    position: 'absolute',
    top: 22,
    right: 26,
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#FAD044',
    borderWidth: 2,
    borderColor: "#FAD044",
  },
  waterDrop1: {
    position: 'absolute',
    top: 58,
    left: 70,
    width: 12,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#11D0FF',
    opacity: 0.85,
    transform: [{ rotate: '12deg' }],
  },
  waterDrop2: {
    position: 'absolute',
    top: 78,
    left: 92,
    width: 10,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#55DEFF',
    opacity: 0.75,
    transform: [{ rotate: '-8deg' }],
  },
  waterDrop3: {
    position: 'absolute',
    top: 64,
    left: 110,
    width: 8,
    height: 14,
    borderRadius: 999,
    backgroundColor: THEME.accent,
    opacity: 0.65,
    transform: [{ rotate: '4deg' }],
  },
  smallStem: {
    position: 'absolute',
    bottom: 86,
    width: 8,
    height: 52,
    borderRadius: 8,
    backgroundColor: THEME.accentDark,
  },
  smallCanopy: {
    position: 'absolute',
    bottom: 128,
    width: 64,
    height: 54,
    borderRadius: 28,
    backgroundColor: THEME.accent,
    borderWidth: 2,
    borderColor: THEME.accentDark,
  },
  forestBack: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    height: 110,
    backgroundColor: THEME.bgSecondary,
  },
  forestFront: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 110,
    backgroundColor: THEME.ground,
  },
  treeTrunk: {
    position: 'absolute',
    bottom: 70,
    width: 14,
    height: 74,
    borderRadius: 10,
    backgroundColor: THEME.groundDark,
  },
  treeTop: {
    position: 'absolute',
    bottom: 126,
    width: 110,
    height: 78,
    borderRadius: 44,
    backgroundColor: THEME.accentDark,
    borderWidth: 2,
    borderColor: THEME.accentDark,
  },
});

