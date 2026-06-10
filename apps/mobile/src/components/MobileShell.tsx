import type React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MobileThemeToggle from "./MobileThemeToggle";
import { type AddressorTheme } from "../theme/theme";

type Props = {
  theme: AddressorTheme;
  badge: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

function ImigongoPattern({ theme }: { theme: AddressorTheme }) {
  const rows = Array.from({ length: 18 });
  const diamonds = Array.from({ length: 24 });

  return (
    <View pointerEvents="none" style={styles.patternLayer}>
      {rows.map((_, rowIndex) => (
        <View
          key={`zig-${rowIndex}`}
          style={[
            styles.zigRow,
            {
              top: rowIndex * 54,
              opacity: rowIndex % 2 === 0 ? 0.34 : 0.18,
            },
          ]}
        >
          {Array.from({ length: 9 }).map((__, itemIndex) => (
            <View
              key={`zig-${rowIndex}-${itemIndex}`}
              style={[
                styles.chevron,
                {
                  borderColor:
                    itemIndex % 2 === 0 ? theme.patternStrong : theme.patternSoft,
                },
              ]}
            />
          ))}
        </View>
      ))}

      {diamonds.map((_, index) => (
        <View
          key={`diamond-${index}`}
          style={[
            styles.diamond,
            {
              borderColor: index % 2 === 0 ? theme.patternStrong : theme.patternSoft,
              left: (index % 6) * 82 - 44,
              top: Math.floor(index / 6) * 142 + 32,
              opacity: index % 3 === 0 ? 0.12 : 0.07,
            },
          ]}
        />
      ))}

      <View
        style={[
          styles.patternWash,
          {
            backgroundColor: theme.bg,
            opacity: theme.mode === "dark" ? 0.48 : 0.54,
          },
        ]}
      />
    </View>
  );
}

export default function MobileShell({
  theme,
  badge,
  title,
  subtitle,
  children,
}: Props) {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ImigongoPattern theme={theme} />

      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.mode === "dark" ? "#000" : "#263F66",
            },
          ]}
        >
          <View style={styles.topRow}>
            <View style={styles.brandRow}>
              <View style={[styles.logo, { backgroundColor: theme.primary }]}>
                <Text style={styles.logoText}>A</Text>
              </View>

              <View style={styles.brandCopy}>
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
              styles.badgePill,
              {
                backgroundColor: theme.accentSoft,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={[styles.badgeDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.badgeText, { color: theme.accent }]}>
              {badge}
            </Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

          <Text style={[styles.subtitle, { color: theme.muted }]}>
            {subtitle}
          </Text>

          <View style={styles.content}>{children}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  patternLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  zigRow: {
    position: "absolute",
    left: -50,
    right: -50,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
  },
  chevron: {
    width: 62,
    height: 62,
    borderLeftWidth: 10,
    borderTopWidth: 10,
    transform: [{ rotate: "45deg" }],
    marginRight: 12,
  },
  diamond: {
    position: "absolute",
    width: 74,
    height: 74,
    borderWidth: 10,
    borderRadius: 8,
    transform: [{ rotate: "45deg" }],
  },
  patternWash: {
    position: "absolute",
    left: 14,
    right: 14,
    top: 18,
    bottom: 18,
    borderRadius: 36,
  },
  screen: {
    flexGrow: 1,
    padding: 14,
    justifyContent: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 32,
    padding: 20,
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  topRow: {
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brandRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
  },
  brand: {
    fontSize: 18,
    fontWeight: "900",
  },
  brandSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
  },
  badgePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 18,
    fontSize: 35,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "700",
  },
  content: {
    marginTop: 24,
  },
});