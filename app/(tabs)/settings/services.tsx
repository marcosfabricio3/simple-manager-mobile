import ServicesScreen from "@/src/presentation/screens/ServicesScreen";
import { useI18n } from "@/src/presentation/translations/useI18n";
import { Stack } from "expo-router";
import React from "react";

export default function ServicesRoute() {
  const { t } = useI18n();

  return (
    <>
      <Stack.Screen
        options={{
          title: t.services.title,
          headerBackTitle: t.services.back,
        }}
      />
      <ServicesScreen />
    </>
  );
}
