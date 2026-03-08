import { SettingsItem } from "@/src/presentation/components/SettingsItem";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleServicesNav = () => {
    // Phase 3 implementation
    Alert.alert(
      "Módulo de Servicios",
      "La gestión de servicios estará disponible en la Fase 3.",
    );
  };

  const handleWipeData = () => {
    Alert.alert(
      "Borrar Datos",
      "Esto eliminará permanentemente la base de datos local. ¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          onPress: () => console.log("Wiping DB base..."),
          style: "destructive",
        },
      ],
    );
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
          onValueChange={setDarkMode}
        />
        <SettingsItem
          icon="bell.fill"
          title="Notificaciones Push"
          type="switch"
          value={notifications}
          onValueChange={setNotifications}
        />
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
