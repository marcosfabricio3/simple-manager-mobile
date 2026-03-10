import {
  AppointmentStatus,
  AppointmentWithDetails,
} from "@/src/domain/entities/Appointment";
import { useAppointmentActions } from "@/src/presentation/hooks/useAppointmentActions";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  appointment: AppointmentWithDetails;
  onDelete: (id: string) => void;
}

export function AppointmentCard({ appointment, onDelete }: Props) {
  const { deleteAppointmentWithPrompt } = useAppointmentActions();

  // Parsing dates nicely to Display Time
  const dateObj = new Date(appointment.date);
  const timeString = dateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateString = dateObj.toLocaleDateString();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>{timeString}</Text>
        </View>
        <StatusBadge status={appointment.status} />
      </View>

      <Text style={styles.dateText}>{dateString}</Text>

      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{appointment.clientName}</Text>
        <Text style={styles.clientPhone}>{appointment.clientPhone}</Text>
      </View>

      <View style={styles.servicesContainer}>
        {appointment.services.map((svc) => (
          <View key={svc.id} style={styles.servicePill}>
            <View
              style={[styles.serviceColorDot, { backgroundColor: svc.color }]}
            />
            <Text style={styles.serviceText}>{svc.name}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.priceText}>
          Total: ${appointment.totalPrice.toFixed(2)}
        </Text>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() =>
            deleteAppointmentWithPrompt(appointment.id, () =>
              onDelete(appointment.id),
            )
          }
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  let bgColor = "#E5E5EA";
  let textColor = "#1C1C1E";
  let label = "Desconocido";

  if (status === "pending") {
    bgColor = "#E5F0FF";
    textColor = "#007AFF";
    label = "Pendiente";
  } else if (status === "completed") {
    bgColor = "#E4F8EB";
    textColor = "#34C759";
    label = "Completado";
  } else if (status === "cancelled") {
    bgColor = "#FFEEEC";
    textColor = "#FF3B30";
    label = "Cancelado";
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F2F2F7",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  timeBadge: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  dateText: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  clientInfo: {
    marginBottom: 12,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 14,
    color: "#8E8E93",
  },
  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  servicePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  serviceColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  serviceText: {
    fontSize: 13,
    color: "#3A3A3C",
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: "#FF3B30",
    fontWeight: "600",
    fontSize: 14,
  },
});
