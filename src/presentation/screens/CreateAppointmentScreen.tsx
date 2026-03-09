import { useToast } from "@/components/context/ToastContext";
import { useAppointments } from "@/src/presentation/hooks/useAppointments";
import { useServices } from "@/src/presentation/hooks/useServices";
import { router } from "expo-router";
import { useState } from "react";
import {
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

export default function CreateAppointmentScreen() {
  const { create } = useAppointments();
  const { services } = useServices(); // to populate the checklist
  const { addToast } = useToast();

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [dateStr, setDateStr] = useState(""); // Simplified to string literal for MVP without DatePicker library
  const [timeStr, setTimeStr] = useState(""); // Format HH:mm
  const [duration, setDuration] = useState("60"); // Default 1 hr
  const [notes, setNotes] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (!dateStr || !timeStr) {
        throw new Error(
          "Formato de fecha u hora requerido (Ej: 2024-12-01 / 14:30)",
        );
      }

      const combinedDate = new Date(`${dateStr}T${timeStr}:00`);
      if (isNaN(combinedDate.getTime())) {
        throw new Error("Fecha/Hora inválida. Usa formato AAAA-MM-DD y HH:MM");
      }

      const durNum = parseInt(duration, 10);
      if (isNaN(durNum) || durNum <= 0) {
        throw new Error("Duración inválida");
      }

      await create(
        clientName,
        clientPhone,
        combinedDate.toISOString(),
        durNum,
        selectedServices,
        notes,
      );

      addToast("Turno creado exitosamente", "success");
      router.back();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Error", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Datos del Cliente</Text>
          <TextInput
            placeholder="Nombre completo *"
            value={clientName}
            onChangeText={setClientName}
            style={styles.input}
          />
          <TextInput
            placeholder="Teléfono *"
            value={clientPhone}
            onChangeText={setClientPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fecha y Hora del Turno</Text>
          <View style={styles.row}>
            <TextInput
              placeholder="YYYY-MM-DD *"
              value={dateStr}
              onChangeText={setDateStr}
              style={[styles.input, { flex: 1, marginRight: 8 }]}
            />
            <TextInput
              placeholder="HH:MM *"
              value={timeStr}
              onChangeText={setTimeStr}
              style={[styles.input, { width: 80 }]}
            />
          </View>
          <TextInput
            placeholder="Duración (minutos) *"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            style={styles.input}
          />
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
            title={isSubmitting ? "Guardando..." : "Confirmar Turno"}
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
