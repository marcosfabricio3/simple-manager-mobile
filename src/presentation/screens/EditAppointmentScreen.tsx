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
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AppointmentRepository } from "../../infrastructure/repositories/AppointmentRepository";

export default function EditAppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { darkMode } = useSettingsStore();

  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  const { services } = useServices();
  const { clients, load: loadClients } = useClients();
  const { addToast } = useToast();
  const { t } = useI18n();

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

  const formatTime24h = (d: Date) => {
    return (
      d.getHours().toString().padStart(2, "0") +
      ":" +
      d.getMinutes().toString().padStart(2, "0")
    );
  };
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

      setSelectedClientId(appt.clientId);
      setNotes(appt.notes || "");

      const d = new Date(appt.date);
      setDateObj(d);
      setDateStr(d.toISOString().split("T")[0]);

      setTimeStr(formatTime24h(d));

      const endD = new Date(d.getTime() + appt.durationMinutes * 60000);
      setEndTimeStr(formatTime24h(endD));

      setSelectedServices(appt.services.map((s) => s.id));
    } catch (e) {
      console.error(e);
      addToast(t.appointments.errorLoading, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId],
    );
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (!id) throw new Error("ID de turno faltante");

      if (!dateStr || !timeStr) {
        throw new Error(
          t.appointments.completeFields,
        );
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
        throw new Error(
          t.appointments.endAfterStart,
        );
      }

      const service = new AppointmentService();
      await service.update(
        id,
        combinedDate.toISOString(),
        durNum,
        selectedServices,
        notes,
      );

      addToast(t.appointments.updateSuccess, "success");
      router.replace("/(tabs)/appointments");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Error", "error");
    } finally {
      setIsSubmitting(false);
    }
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
      <ScrollView contentContainerStyle={styles.scroll}>
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
                  setDateStr(selectedDate.toISOString().split("T")[0]);
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
              const selected = selectedServices.includes(svc.id);
              return (
                <TouchableOpacity
                  key={svc.id}
                  style={[
                    styles.checkRow,
                    { borderColor: colors.border },
                    selected && [
                      styles.checkRowSelected,
                      {
                        borderColor: colors.tint,
                        backgroundColor: darkMode ? "#1a2a3a" : "#F2F8FF",
                      },
                    ],
                  ]}
                  onPress={() => toggleService(svc.id)}
                >
                  <View style={styles.checkInner}>
                    <View
                      style={[styles.colorDot, { backgroundColor: svc.color }]}
                    />
                    <Text
                      style={[
                        styles.checkText,
                        { color: colors.text },
                        selected && [
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
            onPress={handleSave}
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
              {isSubmitting ? t.appointments.saving : t.appointments.saveCmd}
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 60,
    paddingBottom: 120,
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
});
