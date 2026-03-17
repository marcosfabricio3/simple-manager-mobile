import { useToast } from "@/components/context/ToastContext";
import { Colors } from "@/constants/theme";
import { AppointmentService } from "@/src/application/services/AppointmentService";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { Client } from "@/src/domain/entities/Client";
import { ClientSelector } from "@/src/presentation/components/ClientSelector";
import { useClients } from "@/src/presentation/hooks/useClients";
import { useServices } from "@/src/presentation/hooks/useServices";
import { useI18n } from "@/src/presentation/translations/useI18n";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeTopPadding } from "@/src/presentation/hooks/useSafeTopPadding";
import { AppointmentRepository } from "../../infrastructure/repositories/AppointmentRepository";
import { SelectedService } from "@/src/application/services/AppointmentService";
import { Service } from "@/src/domain/entities/Service";
import { useAppointments } from "@/src/presentation/hooks/useAppointments";
import { AppointmentWithDetails } from "@/src/domain/entities/Appointment";
import { useAppointmentActions } from "@/src/presentation/hooks/useAppointmentActions";

export default function EditAppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateSeries, removeSeries, load: loadAll } = useAppointments();
  const { darkMode } = useSettingsStore();

  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  const { services } = useServices();
  const { clients, load: loadClients } = useClients();
  const { addToast } = useToast();
  const { t } = useI18n();
  const { deleteAppointmentWithPrompt } = useAppointmentActions();
  const paddingTop = useSafeTopPadding();

  const [selectedClientId, setSelectedClientId] = useState<
    string | undefined
  >();
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [endTimeStr, setEndTimeStr] = useState("");
  const [notes, setNotes] = useState("");

  const [dateObj, setDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null);
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [pendingOp, setPendingOp] = useState<"update" | "delete" | null>(null);

  const formatTime24h = (d: Date) => {
    return (
      d.getHours().toString().padStart(2, "0") +
      ":" +
      d.getMinutes().toString().padStart(2, "0")
    );
  };
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadAppointmentData(id);
    }
  }, [id]);

  const loadAppointmentData = async (appointmentId: string) => {
    try {
      const repo = new AppointmentRepository();
      const appt = await repo.findById(appointmentId);
      if (!appt) {
        addToast(t.appointments.notFound, "error");
        router.back();
        return;
      }
      setAppointment(appt);

      setSelectedClientId(appt.clientId);
      setNotes(appt.notes || "");

      const d = new Date(appt.date);
      setDateObj(d);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dayStr = String(d.getDate()).padStart(2, "0");
      setDateStr(`${y}-${m}-${dayStr}`);

      setTimeStr(formatTime24h(d));

      const endD = new Date(d.getTime() + appt.durationMinutes * 60000);
      setEndTimeStr(formatTime24h(endD));

      setSelectedServices(appt.services.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        defaultPrice: s.price,
      } as any)));

      const initialPrices: Record<string, string> = {};
      appt.services.forEach((s) => {
        initialPrices[s.id] = s.price.toString();
      });
      setCustomPrices(initialPrices);
    } catch (e) {
      console.error(e);
      addToast(t.appointments.errorLoading, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (service: Service) => {
    setSelectedServices((prev) =>
      prev.find((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service],
    );
  };

  const setCustomPrice = (serviceId: string, price: string) => {
    setCustomPrices((prev) => ({ ...prev, [serviceId]: price }));
  };

  const handleSave = async (mode: "single" | "future" | "all" = "single") => {
    // If it's a series and no mode was selected yet, show modal (DISABLED for now)
    /*
    if (appointment?.seriesId && appointment.recurrence !== "none" && !pendingOp) {
      setPendingOp("update");
      setShowSeriesModal(true);
      return;
    }
    */

    setIsSubmitting(true);
    try {
      if (!id) throw new Error("ID de turno faltante");

      if (!dateStr || !timeStr) {
        throw new Error(t.appointments.completeFields);
      }

      const combinedDate = new Date(`${dateStr}T${timeStr}:00`);
      if (isNaN(combinedDate.getTime())) {
        throw new Error(t.appointments.invalidDateTime);
      }

      if (!endTimeStr) {
        throw new Error("Hora de fin es requerida (HH:MM)");
      }

      const combinedEndDate = new Date(`${dateStr}T${endTimeStr}:00`);
      if (isNaN(combinedEndDate.getTime())) {
        throw new Error(t.appointments.invalidDateTime);
      }

      const durNum = Math.round(
        (combinedEndDate.getTime() - combinedDate.getTime()) / 60000,
      );
      if (durNum <= 0) {
        throw new Error(t.appointments.endAfterStart);
      }

      const servicesToSave: SelectedService[] = selectedServices.map((s) => {
        const customPrice = customPrices[s.id];
        return {
          serviceId: s.id,
          price: customPrice ? parseFloat(customPrice) : null,
        };
      });

      const service = new AppointmentService();
      if (appointment?.seriesId && mode !== "single") {
        await updateSeries(id, mode, {
          date: combinedDate.toISOString(),
          durationMinutes: durNum,
          services: servicesToSave,
          notes,
        });
      } else {
        await service.update(
          id,
          combinedDate.toISOString(),
          durNum,
          servicesToSave,
          notes,
        );
      }

      addToast(t.appointments.updateSuccess, "success");
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/appointments");
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Error", "error");
    } finally {
      setIsSubmitting(false);
      setPendingOp(null);
    }
  };

  const handleDeletePrompt = () => {
    if (!id) return;
    deleteAppointmentWithPrompt(id, () => {
      addToast(t.appointments.deleteSuccess || "Turno eliminado", "success");
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/appointments");
      }
    });
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop,
          },
        ]}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ClientSelector
            clients={clients}
            selectedClientId={selectedClientId}
            onSelectClient={(c: Client) => setSelectedClientId(c.id)}
            onClientCreated={loadClients}
          />
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
            {t.appointments.date} & {t.appointments.startTime} / {t.appointments.endTime}
          </Text>

          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <View pointerEvents="none">
              <TextInput
                placeholder={`${t.appointments.date} *`}
                placeholderTextColor={colors.subtext}
                value={dateStr}
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    backgroundColor: darkMode
                      ? colors.secondaryBackground
                      : "#FAFAFA",
                    color: colors.text,
                  },
                ]}
                editable={false}
              />
            </View>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateObj}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                if (Platform.OS === "android") setShowDatePicker(false);
                if (selectedDate) {
                  setDateObj(selectedDate);
                  const y = selectedDate.getFullYear();
                  const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
                  const d = String(selectedDate.getDate()).padStart(2, "0");
                  setDateStr(`${y}-${m}-${d}`);
                }
              }}
            />
          )}

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <TouchableOpacity onPress={() => setShowStartTimePicker(true)}>
                <View pointerEvents="none">
                  <TextInput
                    placeholder={`${t.appointments.startTime} *`}
                    placeholderTextColor={colors.subtext}
                    value={timeStr}
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        backgroundColor: darkMode
                          ? colors.secondaryBackground
                          : "#FAFAFA",
                        color: colors.text,
                      },
                    ]}
                    editable={false}
                  />
                </View>
              </TouchableOpacity>
              {showStartTimePicker && (
                <DateTimePicker
                  value={dateObj}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === "android")
                      setShowStartTimePicker(false);
                    if (selectedDate) {
                      setDateObj(selectedDate);
                      setTimeStr(formatTime24h(selectedDate));
                    }
                  }}
                />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <TouchableOpacity onPress={() => setShowEndTimePicker(true)}>
                <View pointerEvents="none">
                  <TextInput
                    placeholder={`${t.appointments.endTime} *`}
                    placeholderTextColor={colors.subtext}
                    value={endTimeStr}
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        backgroundColor: darkMode
                          ? colors.secondaryBackground
                          : "#FAFAFA",
                        color: colors.text,
                      },
                    ]}
                    editable={false}
                  />
                </View>
              </TouchableOpacity>
              {showEndTimePicker && (
                <DateTimePicker
                  value={dateObj}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === "android") setShowEndTimePicker(false);
                    if (selectedDate) {
                      setDateObj(selectedDate);
                      setEndTimeStr(formatTime24h(selectedDate));
                    }
                  }}
                />
              )}
            </View>
          </View>

          {Platform.OS === "ios" &&
            (showDatePicker || showStartTimePicker || showEndTimePicker) && (
              <Button
                title={t.appointments.confirmSelection}
                onPress={() => {
                  setShowDatePicker(false);
                  setShowStartTimePicker(false);
                  setShowEndTimePicker(false);
                }}
              />
            )}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
            {t.appointments.services} *
          </Text>
          {services.length === 0 ? (
            <Text style={styles.emptyText}>
              {t.appointments.noServices}
            </Text>
          ) : (
            services.map((svc) => {
              const selected = selectedServices.find((s) => s.id === svc.id);
              return (
                <View key={svc.id}>
                  <TouchableOpacity
                    style={[
                      styles.checkRow,
                      { borderColor: colors.border },
                      !!selected && [
                        styles.checkRowSelected,
                        {
                          borderColor: colors.tint,
                          backgroundColor: darkMode ? "#1a2a3a" : "#F2F8FF",
                        },
                      ],
                    ]}
                    onPress={() => toggleService(svc)}
                  >
                    <View style={styles.checkInner}>
                      <View
                        style={[styles.colorDot, { backgroundColor: svc.color }]}
                      />
                      <Text
                        style={[
                          styles.checkText,
                          { color: colors.text },
                          !!selected && [
                            styles.checkTextSelected,
                            { color: colors.tint },
                          ],
                        ]}
                      >
                        {svc.name}
                      </Text>
                    </View>
                    <Text style={[styles.checkPrice, { color: colors.subtext }]}>
                      ${svc.defaultPrice}
                    </Text>
                  </TouchableOpacity>

                  {!!selected && (
                    <View style={styles.overrideContainer}>
                      <Text style={[styles.overrideLabel, { color: colors.subtext }]}>
                        {t.services.price}:
                      </Text>
                      <TextInput
                        keyboardType="numeric"
                        placeholder={svc.defaultPrice.toString()}
                        placeholderTextColor={colors.subtext}
                        value={customPrices[svc.id] || ""}
                        onChangeText={(val) => setCustomPrice(svc.id, val)}
                        style={[
                          styles.overrideInput,
                          {
                            color: colors.text,
                            borderColor: colors.border,
                            backgroundColor: darkMode ? colors.secondaryBackground : "#FFF",
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
            {t.appointments.notes}
          </Text>
          <TextInput
            placeholder={t.appointments.notesPlaceholder}
            placeholderTextColor={colors.subtext}
            value={notes}
            onChangeText={setNotes}
            multiline
            style={[
              styles.input,
              {
                borderColor: colors.border,
                backgroundColor: darkMode
                  ? colors.secondaryBackground
                  : "#FAFAFA",
                color: colors.text,
                height: 80,
                textAlignVertical: "top",
              },
            ]}
          />
        </View>

        <View style={{ marginBottom: 40, marginTop: 10 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSave("single")}
            disabled={isSubmitting}
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              shadowColor: colors.primary,
              shadowOpacity: 0.2,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
              {isSubmitting && pendingOp === "update" ? t.appointments.saving : t.appointments.saveCmd}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal for series management - Hidden for now */}
        {/*
        <Modal
          visible={showSeriesModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowSeriesModal(false);
            setPendingOp(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {pendingOp === "update" ? t.appointments.editSeriesTitle : t.appointments.deleteSeriesTitle}
              </Text>
              <Text style={[styles.modalMsg, { color: colors.subtext }]}>
                {t.appointments.deleteSeriesMsg}
              </Text>

              <View style={styles.modalOptions}>
                <TouchableOpacity
                  style={[styles.modalOption, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setShowSeriesModal(false);
                    if (pendingOp === "update") handleSave("single");
                    else handleDelete("single");
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: colors.primary }]}>{t.appointments.optionSingle}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalOption, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setShowSeriesModal(false);
                    if (pendingOp === "update") handleSave("future");
                    else handleDelete("future");
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: colors.primary }]}>{t.appointments.optionFuture}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setShowSeriesModal(false);
                    if (pendingOp === "update") handleSave("all");
                    else handleDelete("all");
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: colors.primary }]}>{t.appointments.optionAll}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setShowSeriesModal(false);
                  setPendingOp(null);
                }}
              >
                <Text style={{ color: colors.subtext, fontWeight: "600" }}>{t.common?.cancel || "Cancelar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 150,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 16,
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 10,
  },
  checkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
  },
  checkRowSelected: {
    borderWidth: 2,
  },
  checkInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  checkText: {
    fontSize: 15,
    fontWeight: "500",
  },
  checkTextSelected: {
    fontWeight: "700",
  },
  checkPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  overrideContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 15,
    paddingRight: 10,
    gap: 10,
  },
  overrideLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  overrideInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    width: 80,
    textAlign: "right",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMsg: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalOptions: {
    width: "100%",
    marginBottom: 20,
  },
  modalOption: {
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalCancel: {
    padding: 12,
  },
});
