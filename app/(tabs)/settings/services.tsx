import ServicesScreen from "@/src/presentation/screens/ServicesScreen";
import { Stack } from "expo-router";
import React from "react";

export default function ServicesRoute() {
  return (
    <>
      <Stack.Screen
        options={{ title: "Mis Servicios", headerBackTitle: "Atrás" }}
      />
      <ServicesScreen />
    </>
  );
}
