import { useToast } from "@/components/context/ToastContext";
import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { ClientSelector } from "@/src/presentation/components/ClientSelector";
import { useAppointments } from "@/src/presentation/hooks/useAppointments";
import { useClients } from "@/src/presentation/hooks/useClients";
import { useServices } from "@/src/presentation/hooks/useServices";
import { useI18n } from "@/src/presentation/translations/useI18n";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
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
import { useSafeTopPadding } from "@/src/presentation/hooks/useSafeTopPadding";
import { SelectedService } from "@/src/application/services/AppointmentService";
import { Service } from "@/src/domain/entities/Service";

export default function CreateAppointmentScreen() {
  const { createWithExisting } = useAppointments();
  const { services } = useServices();
  const { clients, load: loadClients } = useClients();
  const { addToast } = useToast();
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const paddingTop = useSafeTopPadding();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [selectedClientId, setSelectedClientId] = useState<
    string | undefined
  >(params.clientId as string);
  const [dateStr, setDateStr] = useState(
    params.date ? (params.date as string) : todayStr
  );
  const [timeStr, setTimeStr] = useState("");
  const [endTimeStr, setEndTimeStr] = useState("");
  const [notes, setNotes] = useState("");

  const [dateObj, setDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [recurrence, setRecurrence] = useState<"none" | "weekly" | "biweekly" | "monthly">("none");

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

  useFocusEffect(
    useCallback(() => {
      loadClients();
      
      // Reset form state to ensure a clean slate for new registrations
      setSelectedClientId(params.clientId as string | undefined);
      setDateStr(params.date ? (params.date as string) : todayStr);
      setTimeStr("");
      setEndTimeStr("");
      setNotes("");
      setSelectedServices([]);
      setCustomPrices({});
      setDateObj(new Date());
      setRecurrence("none");
      setIsSubmitting(false);
    }, [loadClients, params.clientId, params.date])
  );

  const toggleService = (service: Service) => {
    setSelectedServices((prev) =>
      prev.find((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
  };

  const setCustomPrice = (serviceId: string, price: string) => {
    setCustomPrices((prev) => ({ ...prev, [serviceId]: price }));
  };

  const handleSave = async () => {
    if (!selectedClientId) {
      addToast(t.appointments.selectClient, "error");
      return;
    }
    if (selectedServices.length === 0) {
      addToast(t.appointments.selectService, "error");
      return;
    }
    if (!dateStr || !timeStr || !endTimeStr) {
      addToast(t.appointments.completeFields, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const combinedDate = new Date(`${dateStr}T${timeStr}:00`);
      const combinedEndDate = new Date(`${dateStr}T${endTimeStr}:00`);

      const durNum = Math.round(
        (combinedEndDate.getTime() - combinedDate.getTime()) / 60000
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

      await createWithExisting(
        selectedClientId,
        combinedDate.toISOString(),
        durNum,
        servicesToSave,
        recurrence,
        notes
      );

      addToast(t.appointments.createSuccess, "success");

      // Guided Tour: Step 3 -> 0 (Tutorial Ready)
      const { tutorialStep, updateSettings } = useSettingsStore.getState();
      if (tutorialStep === 3) {
        updateSettings({ tutorialStep: 0 });
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/appointments");
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : t.common.error, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const theme = useSettingsStore().darkMode ? "dark" : "light";
  const colors = Colors[theme];
  const darkMode = theme === "dark";

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
            onSelectClient={(c) => setSelectedClientId(c.id)}
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

        {/* Recurrence Selector - Hidden for now */}
        {/*
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
            {t.appointments.recurrence}
          </Text>
          <View style={styles.recurrenceRow}>
            {(["none", "weekly", "biweekly", "monthly"] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.recururrenceButton,
                  { borderColor: colors.border },
                  recurrence === r && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setRecurrence(r)}
              >
                <Text
                  style={[
                    styles.recurrenceText,
                    { color: colors.text },
                    recurrence === r && { color: "#FFF" },
                  ]}
                >
                  {t.appointments[`recurrence_${r}` as keyof typeof t.appointments]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        */}

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
                      {t.common.currency}{svc.defaultPrice}
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
              {isSubmitting ? t.appointments.creating : t.appointments.createCmd}
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
    paddingBottom: 150,
  },
  recurrenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  recurrenceButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  recurrenceText: {
    fontSize: 12,
    fontWeight: "600",
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
});
