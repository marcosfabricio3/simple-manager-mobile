import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { SettingsItem } from "@/src/presentation/components/SettingsItem";
import { router } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { db } from "@/src/infraestructure/database/database";

export default function SettingsScreen() {
  const {
    darkMode,
    notificationsEnabled,
    notificationAdvanceMin,
    updateSettings,
  } = useSettingsStore();

  const handleServicesNav = () => {
    router.push("/settings/services");
  };

  const handleWipeData = () => {
    Alert.alert(
      "Borrar Datos",
      "Esto eliminará permanentemente la base de datos local. ¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          onPress: async () => {
            try {
              // Delete tables to force a recreation on next load
              await db.execAsync(`
                PRAGMA foreign_keys = OFF;
                DROP TABLE IF EXISTS appointment_services;
                DROP TABLE IF EXISTS appointments;
                DROP TABLE IF EXISTS services;
                DROP TABLE IF EXISTS clients;
                DROP TABLE IF EXISTS records;
                PRAGMA foreign_keys = ON;
              `);
              Alert.alert(
                "Éxito",
                "Plataforma reiniciada. Cierra y vuelve a abrir la app entera.",
                [{ text: "Entendido" }],
              );
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "No se pudo limpiar la base de datos.");
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleAdvancePress = () => {
    const options = [
      "Cancelar",
      "A la hora exacta",
      "15 minutos antes",
      "30 minutos antes",
      "1 hora antes",
    ];
    const values = [null, 0, 15, 30, 60];

    // Simple Alert for cross-platform (ActionSheetIOS can be used in a pure iOS build)
    Alert.alert(
      "Antelación de recordatorio",
      "¿Con cuánto tiempo de anticipación deseas recibir la alarma?",
      options.map((opt, index) => ({
        text: opt,
        style: index === 0 ? "cancel" : "default",
        onPress: () => {
          if (index > 0) {
            updateSettings({ notificationAdvanceMin: values[index] as number });
          }
        },
      })),
    );
  };

  const formatAdvance = (mins: number) => {
    if (mins === 0) return "A la hora";
    if (mins === 60) return "1 hora antes";
    return `${mins} min antes`;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Configuración</Text>

      <Text style={styles.sectionTitle}>Negocio</Text>
      <View style={styles.sectionContainer}>
        <SettingsItem
          icon="list.bullet"
          title="Mis Servicios"
          subtitle="Administra los precios y servicios que ofreces"
          type="link"
          onPress={handleServicesNav}
        />
        {/* Futuro: Personal, Métodos de Pago, etc. */}
      </View>

      <Text style={styles.sectionTitle}>Preferencias App</Text>
      <View style={styles.sectionContainer}>
        <SettingsItem
          icon="moon.fill"
          title="Modo Oscuro"
          type="switch"
          value={darkMode}
          onValueChange={(val) => updateSettings({ darkMode: val })}
        />
        <SettingsItem
          icon="bell.fill"
          title="Notificaciones Push"
          type="switch"
          value={notificationsEnabled}
          onValueChange={(val) => updateSettings({ notificationsEnabled: val })}
        />
        {notificationsEnabled && (
          <SettingsItem
            icon="clock.fill"
            title="Antelación del aviso"
            type="select"
            value={formatAdvance(notificationAdvanceMin)}
            onPress={handleAdvancePress}
          />
        )}
      </View>

      <Text style={styles.sectionTitle}>Datos Avanzados</Text>
      <View style={styles.sectionContainer}>
        <SettingsItem
          icon="trash.fill"
          title="Borrar Todos los Datos"
          subtitle="Acción destructiva (Reset)"
          type="action"
          destructive
          onPress={handleWipeData}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 40,
    backgroundColor: "#f9f9f9",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 15,
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden", // ensures borders of child items match border radius
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
