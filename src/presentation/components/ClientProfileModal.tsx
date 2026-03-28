import { Colors } from "@/constants/theme";
import { AppointmentService } from "@/src/application/services/AppointmentService";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { AppointmentWithDetails } from "@/src/domain/entities/Appointment";
import { Client } from "@/src/domain/entities/Client";
import { useI18n } from "@/src/presentation/translations/useI18n";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useServices } from "@/src/presentation/hooks/useServices";
import { PaymentMethodModal } from "./PaymentMethodModal";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
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
  const { darkMode, language, freeBillingEnabled, freeBillingPaymentMethods } = useSettingsStore();
  const { t } = useI18n();
  const { services: allServices } = useServices();

  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid" | "cancelled">("all");
  const [serviceFilter, setServiceFilter] = useState<string | "all">("all");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingPaymentAppointment, setPendingPaymentAppointment] = useState<AppointmentWithDetails | null>(null);

  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

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
    paymentMethod?: string,
    paymentMethodDetails?: string,
    isFacturado: boolean = true
  ) => {
    try {
      const newStatus = currentStatus === "paid" ? "unpaid" : "paid";
      const service = new AppointmentService();
      await service.updatePaymentStatus(appointmentId, newStatus, paymentMethod, paymentMethodDetails, isFacturado);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      await loadMetrics(); // Refresh data
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = (appointmentId: string) => {
    Alert.alert(
      t.clientProfile.deleteConfirmTitle,
      t.clientProfile.deleteConfirmMsg,
      [
        { text: t.clientProfile.back, style: "cancel" },
        {
          text: t.clientProfile.clientCancelled,
          onPress: async () => {
            try {
              const service = new AppointmentService();
              await service.updateStatus(appointmentId, "cancelled");
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              await loadMetrics();
            } catch (e) {
              console.error(e);
            }
          },
        },
        {
          text: t.clientProfile.deleteRecord,
          onPress: async () => {
            try {
              const service = new AppointmentService();
              await service.delete(appointmentId);
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
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

  const filteredHistory = React.useMemo(() => {
    if (!metrics?.history) return [];

    let result = [...metrics.history];

    // Filter by Payment/Status
    if (statusFilter === "paid" || statusFilter === "unpaid") {
      result = result.filter((app) => app.paymentStatus === statusFilter);
    } else if (statusFilter === "cancelled") {
      result = result.filter((app) => app.status === "cancelled");
    }

    // Filter by Service
    if (serviceFilter !== "all") {
      result = result.filter((app) =>
        app.services.some((s) => s.id === serviceFilter),
      );
    }

    // Filter by Date
    if (dateFilter) {
      const filterStr = dateFilter.toISOString().split("T")[0];
      result = result.filter((app) => app.date.startsWith(filterStr));
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [metrics?.history, sortOrder, statusFilter, serviceFilter, dateFilter]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateFilter(selectedDate);
    }
  };

  const clearFilters = () => {
    setSortOrder("desc");
    setStatusFilter("all");
    setServiceFilter("all");
    setDateFilter(null);
  };

  if (!client) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.nameRow}>
            <Text style={[styles.title, { color: colors.text }]}>
              {client.name}
            </Text>
            {client.isNew && (
              <View style={[styles.newBadge, { backgroundColor: colors.success + "20" }]}>
                <Text style={[styles.newBadgeText, { color: colors.success }]}>
                  {t.clients.newClientBadge}
                </Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            {onEditClient && (
              <TouchableOpacity
                onPress={() => onEditClient(client)}
                style={[
                  styles.editBtn,
                  {
                    backgroundColor: darkMode
                      ? colors.secondaryBackground
                      : "#F0F8FF",
                  },
                ]}
              >
                <MaterialIcons name="edit" size={20} color="#007AFF" />
                <Text style={styles.editBtnText}>{t.clientProfile.edit}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {loading || !metrics ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={[styles.loadingText, { color: colors.subtext }]}>
              {t.clientProfile.loadingHistory}
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.metricsGrid}>
              <View
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: darkMode
                      ? "rgba(25, 118, 210, 0.2)"
                      : "#E3F2FD",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metricLabel,
                    { color: darkMode ? colors.subtext : "#666" },
                  ]}
                >
                  {t.clientProfile.totalAppointments}
                </Text>
                <Text
                  style={[
                    styles.metricValue,
                    { color: darkMode ? colors.text : "#1976D2" },
                  ]}
                >
                  {metrics.totalAppointments}
                </Text>
              </View>
              <View
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: darkMode
                      ? "rgba(230, 81, 0, 0.2)"
                      : "#FFF3E0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metricLabel,
                    { color: darkMode ? colors.subtext : "#666" },
                  ]}
                >
                  {t.clientProfile.cancelledAppointments}
                </Text>
                <Text
                  style={[
                    styles.metricValue,
                    { color: darkMode ? colors.text : "#E65100" },
                  ]}
                >
                  {metrics.cancelledAppointments}
                </Text>
              </View>
            </View>
            <View style={styles.metricsGrid}>
              <View
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: darkMode
                      ? "rgba(211, 47, 47, 0.2)"
                      : "#FFEBEE",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metricLabel,
                    { color: darkMode ? colors.subtext : "#666" },
                  ]}
                >
                  {t.clientProfile.debt}
                </Text>
                <Text
                  style={[
                    styles.metricValue,
                    { color: darkMode ? colors.text : "#D32F2F" },
                  ]}
                >
                  ${metrics.totalDebt}
                </Text>
              </View>
              <View
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: darkMode
                      ? "rgba(56, 142, 60, 0.2)"
                      : "#E8F5E9",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metricLabel,
                    { color: darkMode ? colors.subtext : "#666" },
                  ]}
                >
                  {t.clientProfile.spent}
                </Text>
                <Text
                  style={[
                    styles.metricValue,
                    { color: darkMode ? colors.text : "#388E3C" },
                  ]}
                >
                  ${metrics.totalSpent}
                </Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <Text style={[styles.minorMetric, { color: colors.subtext }]}>
                {t.clientProfile.nextAppointment}:{" "}
                {metrics.nextPending
                  ? new Date(metrics.nextPending).toLocaleDateString(language === "es" ? "es-AR" : "en-US")
                  : t.clientProfile.none}
              </Text>
            </View>

            <View style={styles.notesContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t.clientProfile.clientNotes}
              </Text>
              <View
                style={[
                  styles.notesBox,
                  {
                    backgroundColor: darkMode ? colors.card : "#FFF9C4",
                    borderColor: darkMode ? colors.border : "#FFF59D",
                  },
                ]}
              >
                <Text
                  style={
                    client.notes
                      ? [styles.notesText, { color: colors.text }]
                      : styles.notesEmpty
                  }
                >
                  {client.notes
                    ? client.notes
                    : t.clientProfile.noNotes}
                </Text>
              </View>
            </View>

            <View style={styles.historyHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t.clientProfile.appointmentHistory}
              </Text>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>
                  {t.clientProfile.clearFilters}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {/* Sort Order */}
                <TouchableOpacity
                  style={[styles.filterChip, { backgroundColor: colors.border + "30" }]}
                  onPress={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                >
                  <MaterialIcons 
                    name={sortOrder === "desc" ? "arrow-downward" : "arrow-upward"} 
                    size={16} 
                    color={colors.primary} 
                  />
                  <Text style={[styles.filterChipText, { color: colors.text }]}>
                    {sortOrder === "desc" ? t.clientProfile.mostRecent : t.clientProfile.leastRecent}
                  </Text>
                </TouchableOpacity>

                {/* Date Filter */}
                <TouchableOpacity
                  style={[
                    styles.filterChip, 
                    dateFilter ? { backgroundColor: colors.primary + "20" } : { backgroundColor: colors.border + "30" }
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialIcons name="event" size={16} color={dateFilter ? colors.primary : colors.subtext} />
                  <Text style={[styles.filterChipText, { color: dateFilter ? colors.primary : colors.text }]}>
                    {dateFilter ? dateFilter.toLocaleDateString(language === "es" ? "es-AR" : "en-US") : t.clientProfile.dateFilter}
                  </Text>
                </TouchableOpacity>

                {/* Status/Payment Filters */}
                {(["all", "paid", "unpaid", "cancelled"] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      statusFilter === status ? { backgroundColor: colors.primary + "20" } : { backgroundColor: colors.border + "30" }
                    ]}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text style={[styles.filterChipText, { color: statusFilter === status ? colors.primary : colors.text }]}>
                      {status === "all" ? t.appointments.total : 
                       status === "paid" ? t.appointments.paid : 
                       status === "unpaid" ? t.appointments.unpaid :
                       t.appointments.cancelled}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Service Filter */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                {allServices.map((svc) => (
                  <TouchableOpacity
                    key={svc.id}
                    style={[
                      styles.filterChip,
                      serviceFilter === svc.id ? { backgroundColor: colors.primary + "20" } : { backgroundColor: colors.border + "30" }
                    ]}
                    onPress={() => setServiceFilter(serviceFilter === svc.id ? "all" : svc.id)}
                  >
                    <View style={[styles.colorDot, { backgroundColor: svc.color }]} />
                    <Text style={[styles.filterChipText, { color: serviceFilter === svc.id ? colors.primary : colors.text }]}>
                      {svc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dateFilter || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
            )}

            <FlatList
              data={filteredHistory}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.subtext }]}>
                  {t.clientProfile.noAppointments}
                </Text>
              }
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.appointmentCard,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <View style={styles.appHeader}>
                    <View>
                      <Text style={[styles.appDate, { color: colors.text }]}>
                        {new Date(item.date).toLocaleDateString(language === "es" ? "es-AR" : "en-US")} -{" "}
                        {new Date(item.date).toLocaleTimeString(language === "es" ? "es-AR" : "en-US", {
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
                          darkMode && { backgroundColor: "rgba(0,0,0,0.3)" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: darkMode ? colors.text : "#424242" },
                            item.status === "pending" &&
                            new Date(item.date) < new Date()
                              ? { color: "#D32F2F" }
                              : null,
                          ]}
                        >
                          {item.status === "completed"
                            ? t.clientProfile.completed
                            : item.status === "pending"
                              ? new Date(item.date) > new Date()
                                ? t.clientProfile.pending
                                : t.clientProfile.expired
                              : t.clientProfile.cancelled}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.appActions}>
                      <TouchableOpacity
                        style={[
                          styles.actionIconBtn,
                          {
                            backgroundColor: darkMode
                              ? colors.secondaryBackground
                              : "#F2F2F7",
                          },
                        ]}
                        onPress={() => handleEdit(item)}
                      >
                        <MaterialIcons name="edit" size={20} color="#007AFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionIconBtn,
                          {
                            backgroundColor: darkMode
                              ? colors.secondaryBackground
                              : "#F2F2F7",
                          },
                        ]}
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

                  <Text
                    style={[styles.servicesList, { color: colors.subtext }]}
                  >
                    {item.services.map((s) => s.name).join(", ")}
                  </Text>

                  <View
                    style={[
                      styles.appFooter,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.priceText, { color: colors.text }]}>
                      ${item.totalPrice}
                    </Text>

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
                          darkMode && { backgroundColor: "transparent" },
                        ]}
                        onPress={() => {
                          if (item.paymentStatus === "unpaid") {
                            setPendingPaymentAppointment(item);
                          } else {
                            handleTogglePayment(item.id, item.paymentStatus);
                          }
                        }}
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
                            ? t.clientProfile.paid
                            : t.clientProfile.markAsPaid}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
          </View>
        )}

        <PaymentMethodModal
          visible={!!pendingPaymentAppointment}
          onClose={() => setPendingPaymentAppointment(null)}
          onConfirm={(method, details) => {
            if (pendingPaymentAppointment) {
              const billingMethods = freeBillingPaymentMethods || [];
              const needsBillingPrompt = freeBillingEnabled && billingMethods.includes(method);

              if (needsBillingPrompt) {
                Alert.alert(
                  t.common.isFacturado,
                  "",
                  [
                    {
                      text: t.common.no,
                      onPress: () => {
                        handleTogglePayment(pendingPaymentAppointment.id, pendingPaymentAppointment.paymentStatus, method, details, false);
                        setPendingPaymentAppointment(null);
                      }
                    },
                    {
                      text: t.common.yes,
                      onPress: () => {
                        handleTogglePayment(pendingPaymentAppointment.id, pendingPaymentAppointment.paymentStatus, method, details, true);
                        setPendingPaymentAppointment(null);
                      }
                    }
                  ]
                );
              } else {
                handleTogglePayment(pendingPaymentAppointment.id, pendingPaymentAppointment.paymentStatus, method, details, true);
                setPendingPaymentAppointment(null);
              }
            }
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: "bold" },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  closeBtn: { padding: 4 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
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
  loadingText: { marginTop: 12 },
  content: { flex: 1, padding: 20 },
  metricsGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  metricCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: "center" },
  metricLabel: {
    fontSize: 13,
    fontWeight: "600",
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
  minorMetric: { fontSize: 13, fontWeight: "500" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  notesText: {
    fontSize: 15,
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
    marginTop: 20,
  },
  appointmentCard: {
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
    borderRadius: 8,
  },
  appDate: { fontSize: 15, fontWeight: "600" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeSuccess: { backgroundColor: "#E8F5E9" },
  badgeWarning: { backgroundColor: "#FFF3E0" },
  badgeError: { backgroundColor: "#FFEBEE" },
  badgeText: { fontSize: 12, fontWeight: "600" },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterRow: {
    gap: 10,
    paddingVertical: 5,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    width: 1,
    height: "100%",
    marginHorizontal: 5,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  servicesList: { fontSize: 14, marginBottom: 12 },
  appFooter: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    marginTop: 8,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  priceText: { fontSize: 16, fontWeight: "bold" },
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
