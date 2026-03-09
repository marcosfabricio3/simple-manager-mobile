import { AppointmentWithDetails } from "@/src/domain/entities/Appointment";
import { Client } from "@/src/domain/entities/Client";
import { AppointmentRepository } from "@/src/infraestructure/repositories/AppointmentRepository";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
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
}

interface ClientMetrics {
  history: AppointmentWithDetails[];
  totalAppointments: number;
  cancelledAppointments: number;
  totalDebt: number;
  nextPending: string | null;
}

export function ClientProfileModal({
  client,
  visible,
  onClose,
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
      const repo = new AppointmentRepository();
      const data = await repo.getClientMetrics(client!.id);
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (appointmentId: string) => {
    try {
      const repo = new AppointmentRepository();
      await repo.updatePaymentStatus(appointmentId, "paid");
      await loadMetrics(); // Refresh data
    } catch (e) {
      console.error(e);
    }
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
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
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
                <Text style={styles.metricLabel}>Turnos Agendados</Text>
                <Text style={[styles.metricValue, { color: "#1976D2" }]}>
                  {metrics.totalAppointments}
                </Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: "#FFEBEE" }]}>
                <Text style={styles.metricLabel}>Deuda Actual</Text>
                <Text style={[styles.metricValue, { color: "#D32F2F" }]}>
                  ${metrics.totalDebt}
                </Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <Text style={styles.minorMetric}>
                Cancelados: {metrics.cancelledAppointments}
              </Text>
              <Text style={styles.minorMetric}>
                Próximo:{" "}
                {metrics.nextPending
                  ? new Date(metrics.nextPending).toLocaleDateString()
                  : "Ninguno"}
              </Text>
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
                        item.status === "completed"
                          ? styles.badgeSuccess
                          : item.status === "pending"
                            ? styles.badgeWarning
                            : styles.badgeError,
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {item.status === "completed"
                          ? "Completado"
                          : item.status === "pending"
                            ? "Pendiente"
                            : "Cancelado"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.servicesList}>
                    {item.services.map((s) => s.name).join(", ")}
                  </Text>

                  <View style={styles.appFooter}>
                    <Text style={styles.priceText}>${item.totalPrice}</Text>

                    {item.status === "completed" && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {item.paymentStatus === "unpaid" && (
                          <TouchableOpacity
                            style={styles.payBtn}
                            onPress={() => handlePay(item.id)}
                          >
                            <Text style={styles.payBtnText}>Cobrar</Text>
                          </TouchableOpacity>
                        )}
                        <View
                          style={[
                            styles.paymentBadge,
                            item.paymentStatus === "paid"
                              ? styles.paymentPaid
                              : styles.paymentUnpaid,
                          ]}
                        >
                          <Text style={styles.paymentText}>
                            {item.paymentStatus === "paid"
                              ? "Pagado"
                              : "Adeudado"}
                          </Text>
                        </View>
                      </View>
                    )}
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
    marginBottom: 8,
  },
  appDate: { fontSize: 15, fontWeight: "600", color: "#1C1C1E" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeSuccess: { backgroundColor: "#E8F5E9" },
  badgeWarning: { backgroundColor: "#FFF3E0" },
  badgeError: { backgroundColor: "#FFEBEE" },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#424242" },
  servicesList: { fontSize: 14, color: "#666", marginBottom: 12 },
  appFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: { fontSize: 16, fontWeight: "bold", color: "#1C1C1E" },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  paymentPaid: { backgroundColor: "#E8F5E9", borderColor: "#4CAF50" },
  paymentUnpaid: { backgroundColor: "#FFEBEE", borderColor: "#F44336" },
  paymentText: { fontSize: 11, fontWeight: "bold", color: "#424242" },
  payBtn: {
    backgroundColor: "#34C759",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  payBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
});
