import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface EmptyStateProps {
  iconName: keyof typeof MaterialIcons.glyphMap;
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
        <MaterialIcons
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
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 30,
    fontWeight: "500",
  },
});
