import { Pressable, StyleSheet, Text } from "react-native";
import {
  type AddressorTheme,
  type ThemePreference,
  useThemePreference,
} from "../theme/theme";

type Props = {
  theme: AddressorTheme;
};

function nextPreference(current: ThemePreference): ThemePreference {
  if (current === "light") return "dark";
  if (current === "dark") return "system";
  return "light";
}

function iconFor(preference: ThemePreference) {
  if (preference === "light") return "☾";
  if (preference === "dark") return "☀";
  return "◐";
}

export default function MobileThemeToggle({ theme }: Props) {
  const { preference, setPreference } = useThemePreference();

  return (
    <Pressable
      onPress={() => setPreference(nextPreference(preference))}
      style={[
        styles.button,
        {
          backgroundColor:
            theme.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.92)",
          borderColor: theme.border,
        },
      ]}
    >
      <Text style={[styles.icon, { color: theme.text }]}>
        {iconFor(preference)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  icon: {
    fontSize: 18,
    fontWeight: "900",
  },
});