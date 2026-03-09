import { AppointmentCard } from "@/src/presentation/components/AppointmentCard";
import { useAppointments } from "@/src/presentation/hooks/useAppointments";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AppointmentsListScreen() {
  const { appointments, remove } = useAppointments();

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="event-available" size={64} color="#D1D1D6" />
            <Text style={styles.emptyTitle}>Agenda Libre</Text>
            <Text style={styles.emptyText}>
              No tienes turnos próximos. Presiona el botón + para agregar uno.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <AppointmentCard appointment={item} onDelete={remove} />
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
    paddingBottom: 100, // room for FAB
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
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
