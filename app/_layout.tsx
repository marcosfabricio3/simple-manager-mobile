// import { ToastProvider } from "@/components/context/ToastContext";
// import { Stack } from "expo-router";
// import { useEffect } from "react";
// import { initDatabase } from "../src/infraestructure/database/initDatabase";

// export default function RootLayout() {
//   useEffect(() => {
//     initDatabase();
//   }, []);
//   return (
//     <ToastProvider>
//       <Stack />
//     </ToastProvider>
//   )
// }

import { ToastProvider } from "@/components/context/ToastContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <ToastProvider>
      <Stack />
    </ToastProvider>
  );
}