import type React from "react";
import { Platform, StyleSheet, View } from "react-native";

type Props = {
  children: React.ReactNode;
};

export default function WebMobilePreview({ children }: Props) {
  if (Platform.OS !== "web") return <>{children}</>;

  return (
    <View style={styles.webCanvas}>
      <View style={styles.phoneFrame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  webCanvas: {
    minHeight: "100vh" as unknown as number,
    width: "100%",
    alignItems: "center",
    backgroundColor: "#141414",
    paddingVertical: 24,
  },
  phoneFrame: {
    width: 430,
    maxWidth: "100%" as unknown as number,
    minHeight: "100vh" as unknown as number,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
});