import { IconSymbol, IconSymbolName } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import React from "react";
import {
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface SettingsItemProps {
  icon: IconSymbolName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  type?: "link" | "switch" | "action" | "select";
  value?: boolean | string;
  onValueChange?: (value: boolean | string) => void;
  destructive?: boolean;
}

export function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  type = "link",
  value,
  onValueChange,
  destructive = false,
}: SettingsItemProps) {
  const { darkMode } = useSettingsStore();
  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  const content = (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: destructive
              ? colors.danger + "15"
              : colors.primary + "10",
          },
        ]}
      >
        <IconSymbol
          name={icon}
          size={18}
          color={destructive ? colors.danger : colors.primary}
        />
      </View>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            { color: destructive ? colors.danger : colors.text },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.actionContainer}>
        {type === "switch" && (
          <Switch
            value={value as boolean}
            onValueChange={onValueChange}
            trackColor={{ false: "#767577", true: colors.success }}
            thumbColor={
              Platform.OS === "ios"
                ? undefined
                : value
                  ? colors.secondary
                  : "#f4f3f4"
            }
          />
        )}
        {type === "select" && (
          <View style={styles.selectActionContainer}>
            <Text style={[styles.selectValue, { color: colors.subtext }]}>
              {value}
            </Text>
            <IconSymbol name="chevron.right" size={16} color={colors.icon} />
          </View>
        )}
        {type === "link" && (
          <IconSymbol name="chevron.right" size={16} color={colors.icon} />
        )}
      </View>
    </View>
  );

  return (
    <TouchableOpacity
      disabled={type === "switch"}
      style={[
        styles.wrapper,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
      ]}
      onPress={onPress}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
  },
  actionContainer: {
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  selectActionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectValue: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 6,
  },
});
