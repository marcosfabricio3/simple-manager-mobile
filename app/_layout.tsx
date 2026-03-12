import { ToastProvider } from "@/components/context/ToastContext";
import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { AuthGuard } from "@/src/presentation/components/AuthGuard";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { initDatabase } from "@/src/infrastructure/database/initDatabase";
import { ExpoNotificationService } from "@/src/infrastructure/services/ExpoNotificationService";

// Initialize the database on app load
initDatabase();

// Setup Notification Handler
new ExpoNotificationService();

export default function RootLayout() {
  const { darkMode } = useSettingsStore();
  const colors = Colors[darkMode ? "dark" : "light"];

  // Sync the Android system navigation bar color with the app theme.
  // This prevents the white/black bar at the bottom from clashing
  // with the app's design in both light and dark modes.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.card);
  }, [colors.card]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={darkMode ? DarkTheme : DefaultTheme}>
        <ToastProvider>
          <AuthGuard>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="onboarding"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </Stack>
          </AuthGuard>
        </ToastProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
