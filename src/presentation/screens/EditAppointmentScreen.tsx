import { useToast } from "@/components/context/ToastContext";
import { AppointmentService } from "@/src/application/services/AppointmentService";
import { Client } from "@/src/domain/entities/Client";
import { ClientSelector } from "@/src/presentation/components/ClientSelector";
import { useClients } from "@/src/presentation/hooks/useClients";
import { useServices } from "@/src/presentation/hooks/useServices";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AppointmentRepository } from "../../infraestructure/repositories/AppointmentRepository";

export default function EditAppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { services } = useServices();
  const { clients, load: loadClients } = useClients();
  const { addToast } = useToast();

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
        addToast("Turno no encontrado", "error");
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
      addToast("Error al cargar turno", "error");
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
          "Formato de fecha u hora requerido (Ej: 2024-12-01 / 14:30)",
        );
      }

      const combinedDate = new Date(`${dateStr}T${timeStr}:00`);
      if (isNaN(combinedDate.getTime())) {
        throw new Error("Fecha/Hora inválida. Usa formato AAAA-MM-DD y HH:MM");
      }

      if (!endTimeStr) {
        throw new Error("Hora de fin es requerida (HH:MM)");
      }

      const combinedEndDate = new Date(`${dateStr}T${endTimeStr}:00`);
      if (isNaN(combinedEndDate.getTime())) {
        throw new Error("Hora de fin inválida. Usa formato HH:MM");
      }

      const durNum = Math.round(
        (combinedEndDate.getTime() - combinedDate.getTime()) / 60000,
      );
      if (durNum <= 0) {
        throw new Error(
          "La hora de fin debe ser posterior a la hora de inicio",
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

      addToast("Turno actualizado exitosamente", "success");
      router.back();
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
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          {/* Keeping it readonly or allowing change. For MVP we allow it. */}
          <ClientSelector
            clients={clients}
            selectedClientId={selectedClientId}
            onSelectClient={(c: Client) => setSelectedClientId(c.id)}
            onClientCreated={loadClients}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fecha y Horario del Turno</Text>

          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <View pointerEvents="none">
              <TextInput
                placeholder="Fecha *"
                value={dateStr}
                style={styles.input}
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
                    placeholder="Hora Inicio *"
                    value={timeStr}
                    style={styles.input}
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
                    placeholder="Hora Fin *"
                    value={endTimeStr}
                    style={styles.input}
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
                title="Confirmar Selección"
                onPress={() => {
                  setShowDatePicker(false);
                  setShowStartTimePicker(false);
                  setShowEndTimePicker(false);
                }}
              />
            )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Servicios Contratados *</Text>
          {services.length === 0 ? (
            <Text style={styles.emptyText}>
              No hay servicios. Ve a Ajustes a crearlos.
            </Text>
          ) : (
            services.map((svc) => {
              const selected = selectedServices.includes(svc.id);
              return (
                <TouchableOpacity
                  key={svc.id}
                  style={[styles.checkRow, selected && styles.checkRowSelected]}
                  onPress={() => toggleService(svc.id)}
                >
                  <View style={styles.checkInner}>
                    <View
                      style={[styles.colorDot, { backgroundColor: svc.color }]}
                    />
                    <Text
                      style={[
                        styles.checkText,
                        selected && styles.checkTextSelected,
                      ]}
                    >
                      {svc.name}
                    </Text>
                  </View>
                  <Text style={styles.checkPrice}>${svc.defaultPrice}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notas (Opcional)</Text>
          <TextInput
            placeholder="Notas interna del turno..."
            value={notes}
            onChangeText={setNotes}
            multiline
            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
          />
        </View>

        <View style={{ marginBottom: 40, marginTop: 10 }}>
          <Button
            title={isSubmitting ? "Guardando..." : "Guardar Cambios"}
            onPress={handleSave}
            disabled={isSubmitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  scroll: {
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8E8E93",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#FAFAFA",
  },
  row: {
    flexDirection: "row",
  },
  emptyText: {
    color: "#FF3B30",
    fontStyle: "italic",
    marginBottom: 10,
  },
  checkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    marginBottom: 8,
  },
  checkRowSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F2F8FF",
  },
  checkInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  checkText: {
    fontSize: 16,
    color: "#3A3A3C",
  },
  checkTextSelected: {
    fontWeight: "600",
    color: "#007AFF",
  },
  checkPrice: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "600",
  },
});
