import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MobileShell from "../../src/components/MobileShell";
import { apiRequest } from "../../src/lib/api/client";
import { getVerificationData } from "../../src/lib/auth/storage";
import { useAddressorTheme } from "../../src/theme/theme";

export default function VerifyScreen() {
  const theme = useAddressorTheme();
  const [token, setToken] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loading, setLoading] = useState<"email" | "phone" | null>(null);

  useEffect(() => {
    async function loadData() {
      const data = await getVerificationData();
      setToken(data.verificationToken || "");
      setEmailOtp(data.emailOtp || "");
      setPhoneOtp(data.phoneOtp || "");
    }

    loadData();
  }, []);

  async function verifyEmail() {
    setLoading("email");

    try {
      await apiRequest("/auth/verify-email", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ token: emailOtp }),
      });

      setEmailVerified(true);
      Alert.alert("Email verified", "Your email is now verified.");
    } catch {
      Alert.alert("Verification failed", "Check your email OTP.");
    } finally {
      setLoading(null);
    }
  }

  async function verifyPhone() {
    setLoading("phone");

    try {
      await apiRequest("/auth/verify-phone", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp: phoneOtp }),
      });

      setPhoneVerified(true);
      Alert.alert("Phone verified", "Your phone is now verified.");
    } catch {
      Alert.alert("Verification failed", "Check your phone OTP.");
    } finally {
      setLoading(null);
    }
  }

  const complete = emailVerified && phoneVerified;

  return (
    <MobileShell
      theme={theme}
      badge="VERIFY ACCOUNT"
      title="Confirm email and phone"
      subtitle="This keeps bookings, reviews, and business access trusted."
    >
      <View style={styles.stack}>
        <View
          style={[
            styles.section,
            { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
          ]}
        >
          <View style={styles.row}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Email OTP
            </Text>
            <Text style={{ color: emailVerified ? theme.success : theme.muted }}>
              {emailVerified ? "Verified" : "Pending"}
            </Text>
          </View>

          <TextInput
            value={emailOtp}
            onChangeText={setEmailOtp}
            placeholder="Enter email OTP"
            placeholderTextColor={theme.muted}
            keyboardType="number-pad"
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
          />

          <Pressable
            onPress={verifyEmail}
            disabled={!token || emailVerified || loading === "email"}
            style={[
              styles.primaryButton,
              { backgroundColor: theme.primary },
              emailVerified && styles.disabled,
            ]}
          >
            {loading === "email" ? (
              <ActivityIndicator color={theme.primaryText} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
                Verify email
              </Text>
            )}
          </Pressable>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
          ]}
        >
          <View style={styles.row}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Phone OTP
            </Text>
            <Text style={{ color: phoneVerified ? theme.success : theme.muted }}>
              {phoneVerified ? "Verified" : "Pending"}
            </Text>
          </View>

          <TextInput
            value={phoneOtp}
            onChangeText={setPhoneOtp}
            placeholder="Enter phone OTP"
            placeholderTextColor={theme.muted}
            keyboardType="number-pad"
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
          />

          <Pressable
            onPress={verifyPhone}
            disabled={!token || phoneVerified || loading === "phone"}
            style={[
              styles.primaryButton,
              { backgroundColor: theme.primary },
              phoneVerified && styles.disabled,
            ]}
          >
            {loading === "phone" ? (
              <ActivityIndicator color={theme.primaryText} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
                Verify phone
              </Text>
            )}
          </Pressable>
        </View>

        {complete ? (
          <Pressable
            onPress={() => router.push("/(auth)/login")}
            style={[styles.doneButton, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.doneButtonText}>Continue to login</Text>
          </Pressable>
        ) : null}

        <Link href="/(auth)/login" style={[styles.link, { color: theme.accent }]}>
          Already verified? Login
        </Link>
      </View>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  section: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontWeight: "900",
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
  },
  primaryButton: {
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonText: {
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.55,
  },
  doneButton: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
  link: {
    textAlign: "center",
    fontWeight: "900",
  },
});