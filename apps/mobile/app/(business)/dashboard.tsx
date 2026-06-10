import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MobileShell from "../../src/components/MobileShell";
import { apiRequest } from "../../src/lib/api/client";
import { getAuthToken } from "../../src/lib/auth/storage";
import { useAddressorTheme } from "../../src/theme/theme";

export default function BusinessDashboard() {
  const theme = useAddressorTheme();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const token = await getAuthToken();

        if (!token) {
          setAllowed(false);
          setLoading(false);
          return;
        }

        await apiRequest("/business/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAllowed(true);
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    }

    check();
  }, []);

  if (loading) {
    return (
      <View style={{ padding: 20 }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Business access denied</Text>
      </View>
    );
  }

  return (
    <MobileShell
      theme={theme}
      badge="BUSINESS DASHBOARD"
      title="Manage your business"
      subtitle="Branches, offers, bookings, and visibility."
    >
      <View style={styles.grid}>
        <Text style={styles.item}>Profile</Text>
        <Text style={styles.item}>Branches</Text>
        <Text style={styles.item}>Offers</Text>
        <Text style={styles.item}>Bookings</Text>
      </View>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 12 },
  item: { fontSize: 18, fontWeight: "900" },
});