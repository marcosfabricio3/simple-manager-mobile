import { useSettingsStore } from "@/src/application/state/useSettingsStore";

/**
 * Custom hook to use the application's internal dark mode setting
 * instead of the system-level color scheme.
 */
export function useColorScheme() {
  const { darkMode } = useSettingsStore();
  return darkMode ? "dark" : "light";
}
