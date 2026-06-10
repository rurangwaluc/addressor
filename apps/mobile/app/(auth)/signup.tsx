import { Link, router } from "expo-router";
import { useState } from "react";
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
import { saveVerificationData } from "../../src/lib/auth/storage";
import { useAddressorTheme } from "../../src/theme/theme";

type SignupResponse = {
  ok: true;
  data: {
    verificationToken: string;
    devVerification?: {
      emailOtp: string;
      phoneOtp: string;
    };
  };
};

export default function SignupScreen() {
  const theme = useAddressorTheme();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (loading) return;

    setLoading(true);

    try {
      const response = await apiRequest<SignupResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ fullName, email, phone, password }),
      });

      await saveVerificationData({
        verificationToken: response.data.verificationToken,
        emailOtp: response.data.devVerification?.emailOtp,
        phoneOtp: response.data.devVerification?.phoneOtp,
      });

      router.replace("/(auth)/verify");
    } catch {
      Alert.alert("Signup failed", "Check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell
      theme={theme}
      badge="SECURE SIGNUP"
      title="Create your Addressor account"
      subtitle="Verify your email and phone to keep Addressor trusted."
    >
      <View style={styles.form}>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Full name"
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.surfaceSoft, borderColor: theme.border, color: theme.text }]}
        />

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { backgroundColor: theme.surfaceSoft, borderColor: theme.border, color: theme.text }]}
        />

        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="250788123456"
          placeholderTextColor={theme.muted}
          keyboardType="phone-pad"
          style={[styles.input, { backgroundColor: theme.surfaceSoft, borderColor: theme.border, color: theme.text }]}
        />

        <View style={[styles.passwordWrap, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={theme.muted}
            secureTextEntry={!showPassword}
            style={[styles.passwordInput, { color: theme.text }]}
          />

          <Pressable onPress={() => setShowPassword((current) => !current)} style={styles.eyeButton}>
            <Text style={[styles.eyeText, { color: theme.accent }]}>
              {showPassword ? "🙈" : "👁"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleSignup}
          disabled={loading}
          style={[styles.primaryButton, { backgroundColor: theme.primary }, loading && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color={theme.primaryText} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
              Create account
            </Text>
          )}
        </Pressable>

        <Text style={[styles.bottomText, { color: theme.muted }]}>
          Already have an account?{" "}
          <Link href="/(auth)/login" style={[styles.link, { color: theme.accent }]}>
            Login
          </Link>
        </Text>
      </View>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 18,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  eyeText: {
    fontSize: 18,
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    fontWeight: "900",
    fontSize: 15,
  },
  disabled: {
    opacity: 0.7,
  },
  bottomText: {
    textAlign: "center",
    marginTop: 8,
  },
  link: {
    fontWeight: "900",
  },
});