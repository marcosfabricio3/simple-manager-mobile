import { ToastProvider } from "@/components/context/ToastContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <ToastProvider>
      <Stack />
    </ToastProvider>
  );
}
