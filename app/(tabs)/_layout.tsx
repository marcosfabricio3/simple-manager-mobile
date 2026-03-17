import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { useI18n } from "@/src/presentation/translations/useI18n";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { darkMode } = useSettingsStore();
  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];
  const { t, language } = useI18n();
  const insets = useSafeAreaInsets();

  // On Android with edge-to-edge, we must account for the system navigation bar.
  // We use the actual inset if available, or a sensible fallback.
  const bottomPad = Platform.OS === "android" 
    ? Math.max(insets.bottom, 20) 
    : (insets.bottom || 12);

  return (
    <Tabs
      screenOptions={{
        // ✅ Removes the black page-title header bar
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 70 + (Platform.OS === "android" ? Math.max(insets.bottom - 10, 0) : 0),
          paddingBottom: bottomPad,
          paddingTop: 10,
          // Removed absolute positioning as it can cause content to overlap 
          // or the bar itself to mismatch with system navigation areas on resume.
          elevation: 8,
        },
      }}
    >
      {/* 1 — Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: language === "es" ? "Inicio" : "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />

      {/* 2 — Clients */}
      <Tabs.Screen
        name="clients"
        options={{
          title: t.clients.title,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="person.3.fill" color={color} />
          ),
        }}
      />

      {/* 3 — Appointments / Calendar */}
      <Tabs.Screen
        name="appointments"
        options={{
          title: language === "es" ? "Calendario" : "Schedule",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="calendar" color={color} />
          ),
        }}
      />

      {/* 4 — Statistics */}
      <Tabs.Screen
        name="explore"
        options={{
          title: t.statistics.title,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="chart.bar.fill" color={color} />
          ),
        }}
      />

      {/* 5 — Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          title: t.settings.title,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="gearshape.fill" color={color} />
          ),
        }}
      />

      {/* Hidden nested routes */}
      <Tabs.Screen
        name="settings/services"
        options={{ href: null, title: t.settings.myServices }}
      />
      <Tabs.Screen
        name="appointments/create"
        options={{
          href: null,
          title: language === "es" ? "Nuevo Turno" : "New Appointment",
        }}
      />
      <Tabs.Screen
        name="appointments/edit"
        options={{
          href: null,
          title: language === "es" ? "Editar Turno" : "Edit Appointment",
        }}
      />
    </Tabs>
  );
}
