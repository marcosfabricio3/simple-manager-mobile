import { IconSymbol, IconSymbolName } from "@/components/ui/icon-symbol";
import React from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

export interface SettingsItemProps {
  icon: IconSymbolName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  type?: "link" | "switch" | "action" | "select";
  value?: boolean | string;
  onValueChange?: (value: any) => void;
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
  const content = (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          destructive && styles.destructiveIconBackground,
        ]}
      >
        <IconSymbol
          name={icon}
          size={22}
          color={destructive ? "#fff" : "#007AFF"}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, destructive && styles.destructiveText]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.actionContainer}>
        {type === "switch" && (
          <Switch
            value={value as boolean}
            onValueChange={onValueChange}
            trackColor={{ false: "#767577", true: "#34C759" }}
          />
        )}
        {type === "select" && (
          <View style={styles.selectActionContainer}>
            <Text style={styles.selectValue}>{value}</Text>
            <IconSymbol name="chevron.right" size={20} color="#C7C7CC" />
          </View>
        )}
        {type === "link" && (
          <IconSymbol name="chevron.right" size={20} color="#C7C7CC" />
        )}
      </View>
    </View>
  );

  if (type === "switch") {
    return <View style={styles.wrapper}>{content}</View>;
  }

  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#fff",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#E5F1FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  destructiveIconBackground: {
    backgroundColor: "#FF3B30",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  destructiveText: {
    color: "#FF3B30",
  },
  subtitle: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  actionContainer: {
    marginLeft: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  selectActionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectValue: {
    fontSize: 16,
    color: "#8E8E93",
    marginRight: 8,
  },
});
