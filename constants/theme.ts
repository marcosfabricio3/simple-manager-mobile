/**
 * Simple Manager - Design System
 * Based on docs/project/UI_UX_GUIDELINES.md
 */

import { Platform } from "react-native";

// New Palette - Medical Minimalism
const primary = "#7C9CF5";
const secondary = "#A8DADC";
const accent = "#F4A6A6";

const success = "#34C759";
const error = "#FF3B30";
const warning = "#FF9500";
const info = "#007AFF";

export const Colors = {
  light: {
    text: "#1F2937",
    background: "#F7F9FC",
    secondaryBackground: "#FFFFFF",
    card: "#FFFFFF",
    tint: primary,
    primary: primary,
    secondary: secondary,
    accent: accent,
    success: success,
    danger: error,
    warning: warning,
    info: info,
    icon: "#6B7280",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: primary,
    border: "#E5E7EB",
    subtext: "#6B7280",
  },
  dark: {
    text: "#F9FAFB",
    background: "#111827", // Darker navy for medical trust
    secondaryBackground: "#1F2937",
    card: "#1F2937",
    tint: primary,
    primary: primary,
    secondary: secondary,
    accent: accent,
    success: success,
    danger: error,
    warning: warning,
    info: info,
    icon: "#9CA3AF",
    tabIconDefault: "#4B5563",
    tabIconSelected: primary,
    border: "#374151",
    subtext: "#9CA3AF",
  },
};

export const Spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
  pill: 999,
};

export const Fonts = {
  regular: Platform.OS === "ios" ? "System" : "sans-serif",
  medium: Platform.OS === "ios" ? "System" : "sans-serif-medium",
  semiBold: Platform.OS === "ios" ? "System" : "sans-serif-medium",
  bold: Platform.OS === "ios" ? "System" : "sans-serif-bold",
  mono: "ui-monospace, monospace",
};
