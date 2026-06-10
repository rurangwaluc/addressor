import { Link, useRouter } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import MobileThemeToggle from "../src/components/MobileThemeToggle";
import { useAddressorTheme } from "../src/theme/theme";

const categories = [
  {
    eyebrow: "Eat",
    title: "Restaurants",
    text: "Food spots with mood, menus, and trusted signals.",
    href: "/restaurants",
    accent: "rgba(28,168,203,0.32)",
  },
  {
    eyebrow: "Stay",
    title: "Stays",
    text: "Hotels, guest houses, apartments, and visitor-ready places.",
    href: "/stays",
    accent: "rgba(255,255,255,0.16)",
  },
  {
    eyebrow: "Attend",
    title: "Events",
    text: "What is happening tonight, this weekend, and this month.",
    href: "/events",
    accent: "rgba(255,144,65,0.22)",
  },
  {
    eyebrow: "Go out",
    title: "Nightlife",
    text: "Lounges, music, bars, and social places you can trust.",
    href: "/nightlife",
    accent: "rgba(124,235,255,0.22)",
  },
];

const steps = [
  ["01", "Discover", "Choose a place."],
  ["02", "Compare", "Check trust signals."],
  ["03", "Act", "Save, book, or contact."],
];

function PatternBackground({ mode }: { mode: "light" | "dark" }) {
  const color =
    mode === "dark"
      ? "rgba(246,246,246,0.035)"
      : "rgba(16,16,16,0.035)";

  return (
    <View pointerEvents="none" style={styles.patternLayer}>
      {Array.from({ length: 18 }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.patternChevron,
            {
              borderColor: color,
              left: (index % 4) * 120 - 80,
              top: Math.floor(index / 4) * 116 - 20,
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function MobileLandingPage() {
  const theme = useAddressorTheme();
  const router = useRouter();

  const { width } = useWindowDimensions();

  const isDark = theme.mode === "dark";
  const isSmall = width < 370;
  const isNarrow = width < 468;
  const isTiny = width < 390;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <PatternBackground mode={theme.mode} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View
          style={[
            styles.page,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: isDark ? "#000" : "#263F66",
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.brandWrap}>
              <View style={[styles.logo, { backgroundColor: theme.primary }]}>
                <Text style={styles.logoText}>A</Text>
              </View>

              <View>
                <Text style={[styles.brand, { color: theme.text }]}>
                  Addressor
                </Text>

                <Text style={[styles.brandSub, { color: theme.muted }]}>
                  Rwanda discovery
                </Text>
              </View>
            </View>

            <MobileThemeToggle theme={theme} />
          </View>

          <View
            style={[
              styles.heroVisual,
              {
                backgroundColor: isDark ? "#071522" : "#163149",
                shadowColor: isDark ? "#000" : "#263F66",
              },
            ]}
          >
            <View style={styles.heroSkyGlow} />
            <View style={styles.heroCyanGlow} />
            <View style={styles.heroWarmGlow} />
            <View style={styles.heroRoadA} />
            <View style={styles.heroRoadB} />
            <View style={styles.heroVignette} />

            <View style={styles.heroTop}>
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>RWANDA-FIRST</Text>
              </View>

              <View style={styles.livePill}>
                <Text style={styles.liveText}>Live guide</Text>
              </View>
            </View>

            <Text
              style={[
                styles.heroTitle,
                {
                  fontSize: isSmall ? 34 : 40,
                  lineHeight: isSmall ? 36 : 42,
                },
              ]}
            >
              Decide where to go without guessing.
            </Text>

            <Text style={styles.heroSubtitle}>
              Trusted places, real visuals, clear signals, and one next step.
            </Text>

            <View style={[styles.heroActions, isTiny ? styles.heroActionsTiny : null]}>
              <Link href="/(auth)/signup" style={styles.heroPrimaryButton}>
                Explore Addressor ↗
              </Link>

              <Link href="/business-login" style={styles.heroGhostButton}>
                List business
              </Link>
            </View>

            <View style={styles.heroTrustPanel}>
              {["Restaurants", "Stays", "Events"].map((item) => (
                <View key={item} style={styles.heroTrustChip}>
                  <Text style={styles.heroTrustText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionEyebrow, { color: theme.primary }]}>
              BEST CATEGORIES
            </Text>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Addressor discovery
            </Text>

            <Text style={[styles.sectionText, { color: theme.muted }]}>
              Choose what you want to do in Rwanda through cinematic cards.
            </Text>
          </View>

          <View style={styles.categoryGrid}>
            {categories.map((item, index) => (
              <Pressable
                key={item.title}
                onPress={() => router.push(item.href as never)}
                style={[
                  styles.categoryCard,
                  isNarrow ? styles.categoryCardNarrow : null,
                  isTiny ? styles.categoryCardTiny : null,
                  index === 0 || index === 3
                    ? styles.categoryCardLarge
                    : null,
                  {
                    backgroundColor: isDark ? "#141414" : "#292929",
                    borderColor: isDark
                      ? "rgba(246,246,246,0.12)"
                      : "rgba(16,16,16,0.08)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.categoryAtmosphere,
                    { backgroundColor: item.accent },
                  ]}
                />

                <View style={styles.categoryBeamOne} />
                <View style={styles.categoryBeamTwo} />
                <View style={styles.categoryShade} />

                <View style={styles.categoryTop}>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryEyebrow}>
                      {item.eyebrow}
                    </Text>
                  </View>

                  <View style={styles.arrowCircle}>
                    <Text style={styles.arrowText}>↗</Text>
                  </View>
                </View>

                <View style={styles.categoryBottom}>
                  <Text style={styles.categoryLocation}>Rwanda</Text>

                  <Text
                    style={[
                      styles.categoryTitle,
                      isNarrow ? styles.categoryTitleNarrow : null,
                      isTiny ? styles.categoryTitleTiny : null,
                    ]}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={[
                      styles.categoryText,
                      isNarrow ? styles.categoryTextNarrow : null,
                      isTiny ? styles.categoryTextTiny : null,
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          <View
            style={[
              styles.workflow,
              {
                backgroundColor: isDark
                  ? "rgba(35,35,35,0.88)"
                  : "rgba(255,255,255,0.88)",
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.workflowEyebrow, { color: theme.primary }]}>
              HOW ADDRESSOR WORKS
            </Text>

            <Text style={[styles.workflowTitle, { color: theme.text }]}>
              Discover, compare, then act.
            </Text>

            <View
              style={[
                styles.stepsRow,
                isTiny ? styles.stepsColumn : null,
              ]}
            >
              {steps.map(([number, title, text]) => (
                <View
                  key={number}
                  style={[
                    styles.stepCard,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.stepNumber,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Text style={styles.stepNumberText}>{number}</Text>
                  </View>

                  <Text style={[styles.stepTitle, { color: theme.text }]}>
                    {title}
                  </Text>

                  <Text style={[styles.stepText, { color: theme.muted }]}>
                    {text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <Link
              href="/(auth)/signup"
              style={[
                styles.primaryButton,
                {
                  backgroundColor: theme.primary,
                  color: theme.primaryText,
                },
              ]}
            >
              Explore Addressor ↗
            </Link>

            <Link
              href="/business-login"
              style={[
                styles.secondaryButton,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(255,255,255,0.72)",
                },
              ]}
            >
              List your business
            </Link>
          </View>

          <Link
            href="/(auth)/login"
            style={[
              styles.loginLink,
              {
                color: theme.text,
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(16,16,16,0.04)",
                borderColor: theme.border,
              },
            ]}
          >
            Already have an account?  Login →
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  patternLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },

  patternChevron: {
    position: "absolute",
    width: 140,
    height: 140,
    borderTopWidth: 14,
    borderLeftWidth: 14,
    transform: [{ rotate: "45deg" }],
  },

  scroll: {
    flexGrow: 1,
    padding: 14,
  },

  page: {
    borderWidth: 1,
    borderRadius: 34,
    padding: 18,
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  logo: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  brand: {
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  brandSub: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "800",
  },

  heroVisual: {
    marginTop: 22,
    minHeight: 400,
    overflow: "hidden",
    borderRadius: 34,
    padding: 18,
    justifyContent: "space-between",
  },

  heroSkyGlow: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 999,
    backgroundColor: "rgba(28,168,203,0.2)",
    right: -150,
    top: -130,
  },

  heroCyanGlow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(28,168,203,0.18)",
    left: -120,
    bottom: 20,
  },

  heroWarmGlow: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 999,
    backgroundColor: "rgba(255,144,65,0.14)",
    right: -100,
    bottom: -70,
  },

  heroRoadA: {
    position: "absolute",
    width: 380,
    height: 26,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    transform: [{ rotate: "-24deg" }],
    left: -100,
    bottom: 115,
  },

  heroRoadB: {
    position: "absolute",
    width: 300,
    height: 20,
    borderRadius: 999,
    backgroundColor: "rgba(28,168,203,0.18)",
    transform: [{ rotate: "28deg" }],
    right: -110,
    top: 140,
  },

  heroVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  heroTop: {
    position: "relative",
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#1CA8CB",
  },

  badgeText: {
    color: "#7CEBFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  livePill: {
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  liveText: {
    color: "#292929",
    fontSize: 11,
    fontWeight: "900",
  },

  heroTitle: {
    position: "relative",
    zIndex: 2,
    marginTop: 34,
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: -1.7,
    maxWidth: 620,
  },

  heroSubtitle: {
    position: "relative",
    zIndex: 2,
    marginTop: 14,
    maxWidth: 320,
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "800",
  },

  heroActions: {
    position: "relative",
    zIndex: 2,
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
  },
  heroActionsTiny: {
  flexDirection: "column",
},

  heroPrimaryButton: {
    flex: 1,
    textAlign: "center",
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    color: "#263F66",
    fontSize: 13,
    fontWeight: "900",
    overflow: "hidden",
  },

  heroGhostButton: {
    flex: 1,
    textAlign: "center",
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    overflow: "hidden",
  },

  heroTrustPanel: {
    position: "relative",
    zIndex: 3,
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  heroTrustChip: {
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  heroTrustText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  sectionHeader: {
    marginTop: 24,
  },

  sectionEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  sectionTitle: {
    marginTop: 8,
    fontSize: 32,
    lineHeight: 35,
    fontWeight: "900",
    letterSpacing: -1.1,
  },

  sectionText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },

  categoryGrid: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  categoryCard: {
    width: "48.3%",
    marginBottom: 12,
    minHeight: 170,
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 28,
    padding: 14,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },

  categoryCardNarrow: {
    minHeight: 165,
    padding: 12,
  },

  categoryCardTiny: {
  width: "100%",
  minHeight: 132,
  padding: 14,
},
  categoryCardLarge: {
    minHeight: 176,
  },

  categoryAtmosphere: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    right: -90,
    top: -90,
  },

  categoryBeamOne: {
    position: "absolute",
    width: 260,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    left: -70,
    bottom: 46,
    transform: [{ rotate: "-18deg" }],
  },

  categoryBeamTwo: {
    position: "absolute",
    width: 180,
    height: 20,
    borderRadius: 999,
    backgroundColor: "rgba(28,168,203,0.16)",
    right: -55,
    top: 72,
    transform: [{ rotate: "26deg" }],
  },

  categoryShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  categoryTop: {
    position: "relative",
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  categoryPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  categoryEyebrow: {
    color: "#7CEBFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  arrowText: {
    color: "#292929",
    fontSize: 13,
    fontWeight: "900",
  },

  categoryBottom: {
    position: "relative",
    zIndex: 2,
  },

  categoryLocation: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 11,
    fontWeight: "900",
  },

  categoryTitle: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -1,
  },

  categoryTitleNarrow: {
    fontSize: 22,
    lineHeight: 24,
  },

  categoryTitleTiny: {
  fontSize: 25,
  lineHeight: 27,
},

  categoryText: {
    marginTop: 6,
    color: "rgba(255,255,255,0.74)",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },

  categoryTextNarrow: {
    fontSize: 11,
    lineHeight: 16,
  },

 categoryTextTiny: {
  maxWidth: 245,
  fontSize: 11,
  lineHeight: 16,
},

  workflow: {
    marginTop: 22,
    borderWidth: 1,
    borderRadius: 28,
    padding: 16,
  },

  workflowEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.7,
  },

  workflowTitle: {
    marginTop: 8,
    fontSize: 27,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  stepsRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 8,
  },

  stepsColumn: {
  flexDirection: "column",
},

  stepCard: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 20,
    padding: 11,
    minHeight: 120,
  },

  stepNumber: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  stepTitle: {
    marginTop: 9,
    fontSize: 14,
    fontWeight: "900",
  },

  stepText: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
  },

  actions: {
    marginTop: 22,
    gap: 12,
  },

  primaryButton: {
    textAlign: "center",
    paddingVertical: 17,
    borderRadius: 999,
    fontSize: 16,
    fontWeight: "900",
    overflow: "hidden",
  },

  secondaryButton: {
    textAlign: "center",
    paddingVertical: 17,
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: "900",
    overflow: "hidden",
  },

  loginLink: {
  alignSelf: "center",
  marginTop: 18,
  marginBottom: 2,
  overflow: "hidden",
  borderWidth: 1,
  borderRadius: 999,
  paddingHorizontal: 18,
  paddingVertical: 11,
  textAlign: "center",
  fontSize: 13,
  fontWeight: "900",
},
});