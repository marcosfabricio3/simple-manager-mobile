import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsState {
  notificationsEnabled: boolean;
  notificationAdvanceMin: number;
  darkMode: boolean;
  biometricLockEnabled: boolean;
  language: "en" | "es";
  hasSeenOnboarding: boolean;
  updateSettings: (settings: Partial<SettingsState>) => void;
  setHasSeenOnboarding: () => void;
}

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await SecureStore.getItemAsync(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notificationsEnabled: true,
      notificationAdvanceMin: 15,
      darkMode: false,
      biometricLockEnabled: true,
      language: "es",
      hasSeenOnboarding: false,
      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
      setHasSeenOnboarding: () => set({ hasSeenOnboarding: true }),
    }),
    {
      name: "app-settings-storage",
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);
