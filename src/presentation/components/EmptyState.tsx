import { Colors, Spacing } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface EmptyStateProps {
  iconName: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

export function EmptyState({ iconName, title, description }: EmptyStateProps) {
  const { darkMode } = useSettingsStore();
  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  return (
    <View style={styles.container}>
      <View
        style={[styles.iconBox, { backgroundColor: colors.primary + "08" }]}
      >
        <Feather
          name={iconName}
          size={40}
          color={colors.primary + "40"}
        />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.subtext }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.l,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.l,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: Spacing.s,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: Spacing.xl,
    fontWeight: "500",
  },
});
