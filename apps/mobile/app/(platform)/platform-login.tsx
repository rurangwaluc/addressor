import { router } from "expo-router";
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
import { saveAuthToken } from "../../src/lib/auth/storage";
import { useAddressorTheme } from "../../src/theme/theme";

type LoginResponse = {
  ok: true;
  data: {
    token: string;
  };
};

export default function PlatformLoginScreen() {
  const theme = useAddressorTheme();
  const [email, setEmail] = useState("rurangwa.luke@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (loading) return;

    setLoading(true);

    try {
      const loginResponse = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const token = loginResponse.data.token;

      await apiRequest("/platform/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await saveAuthToken(token);

      router.replace("/owner");
    } catch {
      Alert.alert(
        "Platform access denied",
        "Check your password and confirm this account has platform access.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell
      theme={theme}
      badge="PLATFORM ACCESS"
      title="Platform login"
      subtitle="Secure entry for Addressor platform owner, admins, and support team."
    >
      <View style={styles.form}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Platform email"
          placeholderTextColor={theme.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[
            styles.input,
            {
              backgroundColor: theme.surfaceSoft,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
        />

        <View
          style={[
            styles.passwordWrap,
            {
              backgroundColor: theme.surfaceSoft,
              borderColor: theme.border,
            },
          ]}
        >
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={theme.muted}
            secureTextEntry={!showPassword}
            style={[styles.passwordInput, { color: theme.text }]}
          />

          <Pressable
            onPress={() => setShowPassword((current) => !current)}
            style={styles.eyeButton}
          >
            <Text style={[styles.eyeText, { color: theme.accent }]}>
              {showPassword ? "🙈" : "👁"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={[
            styles.primaryButton,
            { backgroundColor: theme.primary },
            loading && styles.disabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={theme.primaryText} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
              Enter platform control room
            </Text>
          )}
        </Pressable>
      </View>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
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
});