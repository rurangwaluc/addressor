import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform, useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { darkTheme, lightTheme, type AddressorTheme } from "./colors";

export type ThemePreference = "light" | "dark" | "system";

const THEME_KEY = "addressor-mobile-theme";

type ThemeContextValue = {
  theme: AddressorTheme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function getStoredPreference(): Promise<ThemePreference | null> {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    return localStorage.getItem(THEME_KEY) as ThemePreference | null;
  }

  return SecureStore.getItemAsync(THEME_KEY) as Promise<ThemePreference | null>;
}

async function saveStoredPreference(preference: ThemePreference) {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    localStorage.setItem(THEME_KEY, preference);
    return;
  }

  await SecureStore.setItemAsync(THEME_KEY, preference);
}

export function AddressorThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    async function loadPreference() {
      const stored = await getStoredPreference();

      if (stored === "light" || stored === "dark" || stored === "system") {
        setPreferenceState(stored);
      }
    }

    loadPreference();
  }, []);

  const theme = useMemo<AddressorTheme>(() => {
    const resolved =
      preference === "system"
        ? systemScheme === "dark"
          ? "dark"
          : "light"
        : preference;

    return resolved === "dark" ? darkTheme : lightTheme;
  }, [preference, systemScheme]);

  async function setPreference(nextPreference: ThemePreference) {
    setPreferenceState(nextPreference);
    await saveStoredPreference(nextPreference);
  }

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAddressorTheme(): AddressorTheme {
  const context = useContext(ThemeContext);
  return context?.theme ?? lightTheme;
}

export function useThemePreference() {
  const context = useContext(ThemeContext);

  if (!context) {
    return {
      preference: "system" as ThemePreference,
      setPreference: async () => {},
    };
  }

  return {
    preference: context.preference,
    setPreference: context.setPreference,
  };
}

export type { AddressorTheme };