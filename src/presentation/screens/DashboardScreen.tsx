import { AppointmentCard } from "@/src/presentation/components/AppointmentCard";
import { useDashboard } from "@/src/presentation/hooks/useDashboard";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DashboardScreen() {
  const { todayAppointments, revenueToday, totalClients, loading, refresh } =
    useDashboard();

  return (
    <View style={styles.container}>
      <FlatList
        data={todayAppointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        ListHeaderComponent={
          <View style={styles.metricsContainer}>
            <View style={styles.welcomeRow}>
              <Text style={styles.title}>Panel de Control</Text>
            </View>

            <View style={styles.cardsRow}>
              <View style={[styles.metricCard, { backgroundColor: "#007AFF" }]}>
                <MaterialIcons name="event-available" size={24} color="white" />
                <Text style={styles.metricLabel}>Turnos Hoy</Text>
                <Text style={styles.metricValue}>
                  {todayAppointments.length}
                </Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: "#34C759" }]}>
                <MaterialIcons name="attach-money" size={24} color="white" />
                <Text style={styles.metricLabel}>Ingresos Estimados</Text>
                <Text style={styles.metricValue}>${revenueToday}</Text>
              </View>
            </View>

            <View style={styles.cardsRow}>
              <View style={[styles.metricCard, { backgroundColor: "#FF9500" }]}>
                <MaterialIcons name="people" size={24} color="white" />
                <Text style={styles.metricLabel}>Clientes para Hoy</Text>
                <Text style={styles.metricValue}>
                  {new Set(todayAppointments.map((a) => a.clientId)).size}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionSubtitle}>Turnos para Hoy</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="free-breakfast" size={64} color="#D1D1D6" />
            <Text style={styles.emptyTitle}>Día Libre</Text>
            <Text style={styles.emptyText}>
              No tienes turnos agendados para hoy.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <AppointmentCard appointment={item} onDelete={refresh} />
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/appointments/create")}
      >
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // For the FAB
  },
  metricsContainer: {
    marginBottom: 20,
    paddingTop: 40, // Top margin to distance it visually
  },
  welcomeRow: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1C1C1E",
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  metricLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
  metricValue: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3A3A3C",
    marginTop: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#8E8E93",
    marginTop: 8,
    fontSize: 16,
    paddingHorizontal: 32,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
