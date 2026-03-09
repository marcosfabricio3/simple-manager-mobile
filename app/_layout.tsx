import { ToastProvider } from "@/components/context/ToastContext";
import { Stack } from "expo-router";

import { initDatabase } from "@/src/infraestructure/database/initDatabase";

// Initialize the database on app load (runs synchronously)
initDatabase();

export default function RootLayout() {
  return (
    <ToastProvider>
      <Stack />
    </ToastProvider>
  );
}
