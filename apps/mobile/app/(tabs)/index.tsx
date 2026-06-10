import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MobileShell from "../../src/components/MobileShell";
import { clearAuthToken, getAuthToken } from "../../src/lib/auth/storage";
import { useAddressorTheme } from "../../src/theme/theme";

export default function MobileWelcomeScreen() {
  const theme = useAddressorTheme();
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    async function checkToken() {
      const token = await getAuthToken();
      setHasToken(Boolean(token));
      setReady(true);
    }

    checkToken();
  }, []);

  async function logout() {
    await clearAuthToken();
    router.replace("/(auth)/login");
  }

  if (!ready) {
    return (
      <MobileShell
        theme={theme}
        badge="LOADING"
        title="Preparing Addressor"
        subtitle="Checking your verified session."
      >
        <View style={[styles.skeleton, { backgroundColor: theme.surfaceSoft }]} />
        <View style={[styles.skeletonSmall, { backgroundColor: theme.surfaceSoft }]} />
      </MobileShell>
    );
  }

  if (!hasToken) {
    return (
      <MobileShell
        theme={theme}
        badge="ACCESS REQUIRED"
        title="Please login first"
        subtitle="You need a verified account before continuing."
      >
        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
        >
          <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
            Go to login
          </Text>
        </Pressable>
      </MobileShell>
    );
  }

  return (
    <MobileShell
      theme={theme}
      badge="VERIFIED ACCESS"
      title="Welcome to Addressor."
      subtitle="Your verified account is ready. Next, this connects to discovery, bookings, business tools, and platform-owner control."
    >
      <View style={styles.grid}>
        {["Discover", "Book", "Manage"].map((item) => (
          <View key={item} style={[styles.pill, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.pillText, { color: theme.accent }]}>{item}</Text>
          </View>
        ))}
      </View>

      <Pressable onPress={logout} style={[styles.secondaryButton, { backgroundColor: theme.surfaceSoft }]}>
        <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
          Logout
        </Text>
      </Pressable>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    height: 160,
    borderRadius: 28,
  },
  skeletonSmall: {
    height: 56,
    borderRadius: 20,
    marginTop: 14,
  },
  grid: {
    flexDirection: "row",
    gap: 10,
  },
  pill: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
  },
  pillText: {
    fontWeight: "900",
    fontSize: 12,
  },
  primaryButton: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    fontWeight: "900",
  },
  secondaryButton: {
    marginTop: 28,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontWeight: "900",
  },
});