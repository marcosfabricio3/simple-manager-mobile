import { ToastProvider } from "@/components/context/ToastContext";
import "@/src/infrastructure/config/startup";
import { Stack } from "expo-router";

import { initDatabase } from "@/src/infraestructure/database/initDatabase";
import { ExpoNotificationService } from "@/src/infrastructure/services/ExpoNotificationService";

// Initialize the database on app load (runs synchronously)
initDatabase();

// Setup Notification Handler
new ExpoNotificationService();

export default function RootLayout() {
  return (
    <ToastProvider>
      <Stack />
    </ToastProvider>
  );
}
