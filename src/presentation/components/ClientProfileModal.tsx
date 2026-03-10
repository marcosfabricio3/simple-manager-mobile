import { AppointmentService } from "@/src/application/services/AppointmentService";
import { AppointmentWithDetails } from "@/src/domain/entities/Appointment";
import { Client } from "@/src/domain/entities/Client";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface ClientProfileModalProps {
  client: Client | null;
  visible: boolean;
  onClose: () => void;
  onEditClient?: (client: Client) => void;
}

interface ClientMetrics {
  history: AppointmentWithDetails[];
  totalAppointments: number;
  cancelledAppointments: number;
  totalDebt: number;
  totalSpent: number;
  nextPending: string | null;
}

export function ClientProfileModal({
  client,
  visible,
  onClose,
  onEditClient,
}: ClientProfileModalProps) {
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && client) {
      loadMetrics();
    }
  }, [visible, client]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const service = new AppointmentService();
      const data = await service.getClientMetrics(client!.id);
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePayment = async (
    appointmentId: string,
    currentStatus: "paid" | "unpaid",
  ) => {
    try {
      const newStatus = currentStatus === "paid" ? "unpaid" : "paid";
      const service = new AppointmentService();
      await service.updatePaymentStatus(appointmentId, newStatus);
      await loadMetrics(); // Refresh data
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = (appointmentId: string) => {
    Alert.alert(
      "Cancelar o Eliminar",
      "¿El paciente canceló el turno o deseas eliminar el registro por error?",
      [
        { text: "Volver", style: "cancel" },
        {
          text: "Canceló el Cliente",
          onPress: async () => {
            try {
              const service = new AppointmentService();
              await service.updateStatus(appointmentId, "cancelled");
              await loadMetrics();
            } catch (e) {
              console.error(e);
            }
          },
        },
        {
          text: "Eliminar Registro",
          onPress: async () => {
            try {
              const service = new AppointmentService();
              await service.delete(appointmentId);
              await loadMetrics();
            } catch (e) {
              console.error(e);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleEdit = (appointment: AppointmentWithDetails) => {
    onClose(); // Close the modal before navigating
    // Need a small timeout to let the modal fully close before React Navigation tries to open a screen
    // Modal unmount on iOS can conflict with pushing new stacks.
    setTimeout(() => {
      router.push({
        pathname: "/(tabs)/appointments/edit",
        params: { id: appointment.id },
      });
    }, 150);
  };

  if (!client) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{client.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            {onEditClient && (
              <TouchableOpacity
                onPress={() => onEditClient(client)}
                style={styles.editBtn}
              >
                <MaterialIcons name="edit" size={20} color="#007AFF" />
                <Text style={styles.editBtnText}>Editar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {loading || !metrics ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { backgroundColor: "#E3F2FD" }]}>
                <Text style={styles.metricLabel}>Turnos</Text>
                <Text style={[styles.metricValue, { color: "#1976D2" }]}>
                  {metrics.totalAppointments}
                </Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: "#FFF3E0" }]}>
                <Text style={styles.metricLabel}>Cancelados</Text>
                <Text style={[styles.metricValue, { color: "#E65100" }]}>
                  {metrics.cancelledAppointments}
                </Text>
              </View>
            </View>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { backgroundColor: "#FFEBEE" }]}>
                <Text style={styles.metricLabel}>Deuda</Text>
                <Text style={[styles.metricValue, { color: "#D32F2F" }]}>
                  ${metrics.totalDebt}
                </Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: "#E8F5E9" }]}>
                <Text style={styles.metricLabel}>Gastado</Text>
                <Text style={[styles.metricValue, { color: "#388E3C" }]}>
                  ${metrics.totalSpent}
                </Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <Text style={styles.minorMetric}>
                Próximo Turno:{" "}
                {metrics.nextPending
                  ? new Date(metrics.nextPending).toLocaleDateString()
                  : "Ninguno"}
              </Text>
            </View>

            <View style={styles.notesContainer}>
              <Text style={styles.sectionTitle}>Notas Clínicas / Extras</Text>
              <View style={styles.notesBox}>
                <Text
                  style={client.notes ? styles.notesText : styles.notesEmpty}
                >
                  {client.notes
                    ? client.notes
                    : "No hay notas o detalles registrados para este cliente."}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Historial de Turnos</Text>

            <FlatList
              data={metrics.history}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  Este cliente no tiene turnos registrados aún.
                </Text>
              }
              renderItem={({ item }) => (
                <View style={styles.appointmentCard}>
                  <View style={styles.appHeader}>
                    <View>
                      <Text style={styles.appDate}>
                        {new Date(item.date).toLocaleDateString()} -{" "}
                        {new Date(item.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      <View
                        style={[
                          styles.badge,
                          { alignSelf: "flex-start", marginTop: 4 },
                          item.status === "completed"
                            ? styles.badgeSuccess
                            : item.status === "pending"
                              ? new Date(item.date) > new Date()
                                ? styles.badgeWarning
                                : styles.badgeError
                              : styles.badgeError,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            item.status === "pending" &&
                            new Date(item.date) < new Date()
                              ? { color: "#D32F2F" }
                              : null,
                          ]}
                        >
                          {item.status === "completed"
                            ? "Completado"
                            : item.status === "pending"
                              ? new Date(item.date) > new Date()
                                ? "Pendiente"
                                : "Vencido"
                              : "Cancelado"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.appActions}>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => handleEdit(item)}
                      >
                        <MaterialIcons name="edit" size={20} color="#007AFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => confirmDelete(item.id)}
                      >
                        <MaterialIcons
                          name="delete"
                          size={20}
                          color="#FF3B30"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.servicesList}>
                    {item.services.map((s) => s.name).join(", ")}
                  </Text>

                  <View style={styles.appFooter}>
                    <Text style={styles.priceText}>${item.totalPrice}</Text>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 8,
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.toggleBtn,
                          item.paymentStatus === "paid"
                            ? styles.togglePaid
                            : styles.toggleUnpaid,
                        ]}
                        onPress={() =>
                          handleTogglePayment(item.id, item.paymentStatus)
                        }
                      >
                        <Text
                          style={[
                            styles.toggleBtnText,
                            item.paymentStatus === "paid"
                              ? styles.togglePaidText
                              : styles.toggleUnpaidText,
                          ]}
                        >
                          {item.paymentStatus === "paid"
                            ? "✅ Abonado (Anular)"
                            : "💳 Marcar como Pagado"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7", paddingTop: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#1C1C1E" },
  closeBtn: { padding: 4 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editBtnText: {
    color: "#007AFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#8E8E93" },
  content: { flex: 1, padding: 20 },
  metricsGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  metricCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: "center" },
  metricLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  metricValue: { fontSize: 28, fontWeight: "bold" },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  minorMetric: { fontSize: 13, color: "#8E8E93", fontWeight: "500" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1C1C1E",
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesBox: {
    backgroundColor: "#FFF9C4", // Light yellow tint to resemble a sticky note
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFF59D",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  notesText: {
    fontSize: 15,
    color: "#424242",
    lineHeight: 22,
  },
  notesEmpty: {
    fontSize: 15,
    color: "#9E9D24",
    fontStyle: "italic",
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    fontStyle: "italic",
    color: "#8E8E93",
    marginTop: 20,
  },
  appointmentCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  appHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  appActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionIconBtn: {
    padding: 6,
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
  },
  appDate: { fontSize: 15, fontWeight: "600", color: "#1C1C1E" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeSuccess: { backgroundColor: "#E8F5E9" },
  badgeWarning: { backgroundColor: "#FFF3E0" },
  badgeError: { backgroundColor: "#FFEBEE" },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#424242" },
  servicesList: { fontSize: 14, color: "#666", marginBottom: 12 },
  appFooter: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
    paddingTop: 8,
  },
  priceText: { fontSize: 16, fontWeight: "bold", color: "#1C1C1E" },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: 1,
  },
  togglePaid: {
    backgroundColor: "#E8F5E9",
    borderColor: "#A5D6A7",
  },
  toggleUnpaid: {
    backgroundColor: "#FFEBEE",
    borderColor: "#EF9A9A",
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  togglePaidText: {
    color: "#2E7D32",
  },
  toggleUnpaidText: {
    color: "#C62828",
  },
});
