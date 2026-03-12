import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import {
  AppointmentStatus,
  AppointmentWithDetails,
} from "@/src/domain/entities/Appointment";
import { useAppointmentActions } from "@/src/presentation/hooks/useAppointmentActions";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  appointment: AppointmentWithDetails;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  concise?: boolean;
}

export function AppointmentCard({
  appointment,
  onDelete,
  onEdit,
  concise,
}: Props) {
  const { deleteAppointmentWithPrompt } = useAppointmentActions();
  const { darkMode } = useSettingsStore();

  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  const dateObj = new Date(appointment.date);
  const startTime = dateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const endDateObj = new Date(
    dateObj.getTime() + (appointment.durationMinutes || 0) * 60000,
  );
  const endTime = endDateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const StatusBadge = ({ status }: { status: AppointmentStatus }) => {
    const statusMap = {
      pending: { color: colors.primary, label: "Pendiente" },
      completed: { color: colors.success, label: "Completado" },
      cancelled: { color: colors.danger, label: "Cancelado" },
    };
    const current = statusMap[status] || statusMap.pending;

    return (
      <View style={[styles.badge, { backgroundColor: current.color + "15" }]}>
        <Text style={[styles.badgeText, { color: current.color }]}>
          {current.label}
        </Text>
      </View>
    );
  };

  if (concise) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.contentRow}>
          <View style={styles.mainInfo}>
            <Text style={[styles.clientName, { color: colors.text }]}>
              {appointment.clientName}
            </Text>
            <View style={styles.timeRow}>
              <MaterialIcons name="schedule" size={14} color={colors.subtext} />
              <Text style={[styles.timeText, { color: colors.subtext }]}>
                {startTime} - {endTime}
              </Text>
            </View>
            <View style={styles.serviceTags}>
              {appointment.services.map((s) => (
                <View
                  key={s.id}
                  style={[styles.tag, { backgroundColor: colors.background }]}
                >
                  <Text style={[styles.tagText, { color: colors.text }]}>
                    {s.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actionColumn}>
            <TouchableOpacity
              onPress={() => onEdit?.(appointment.id)}
              style={styles.iconBtn}
            >
              <MaterialIcons name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                deleteAppointmentWithPrompt(appointment.id, () =>
                  onDelete(appointment.id),
                )
              }
              style={styles.iconBtn}
            >
              <MaterialIcons name="close" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.clientLabel, { color: colors.subtext }]}>
            Cliente
          </Text>
          <Text style={[styles.clientNameLarge, { color: colors.text }]}>
            {appointment.clientName}
          </Text>
        </View>
        <StatusBadge status={appointment.status} />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <MaterialIcons name="event" size={16} color={colors.primary} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {dateObj.toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="schedule" size={16} color={colors.primary} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {startTime} - {endTime}
          </Text>
        </View>
      </View>

      <View style={styles.serviceList}>
        {appointment.services.map((svc) => (
          <View
            key={svc.id}
            style={[styles.serviceItem, { borderLeftColor: svc.color }]}
          >
            <Text style={[styles.serviceText, { color: colors.text }]}>
              {svc.name}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.totalLabel, { color: colors.subtext }]}>
          Total:{" "}
          <Text style={[styles.totalValue, { color: colors.text }]}>
            ${appointment.totalPrice.toFixed(2)}
          </Text>
        </Text>
        <View style={styles.footerActions}>
          <TouchableOpacity
            onPress={() => onEdit?.(appointment.id)}
            style={styles.actionBtn}
          >
            <MaterialIcons name="edit" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              deleteAppointmentWithPrompt(appointment.id, () =>
                onDelete(appointment.id),
              )
            }
            style={styles.actionBtn}
          >
            <MaterialIcons
              name="delete-outline"
              size={22}
              color={colors.danger}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12, // Guidelines: 12px
    padding: 16, // Guidelines: 16px
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  contentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mainInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  serviceTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actionColumn: {
    justifyContent: "space-between",
    paddingLeft: 12,
  },
  iconBtn: {
    padding: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  clientLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  clientNameLarge: {
    fontSize: 18,
    fontWeight: "800",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  details: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontWeight: "600",
  },
  serviceList: {
    marginBottom: 16,
    gap: 8,
  },
  serviceItem: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 2,
  },
  serviceText: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalValue: {
    fontWeight: "800",
  },
  footerActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
});
