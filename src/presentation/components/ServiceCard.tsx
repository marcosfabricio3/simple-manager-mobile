import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { Service } from "@/src/domain/entities/Service";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

export function ServiceCard({ service, onEdit, onDelete }: Props) {
  const { darkMode } = useSettingsStore();
  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <View style={[styles.dot, { backgroundColor: service.color }]} />
            <Text style={[styles.name, { color: colors.text }]}>
              {service.name}
            </Text>
          </View>
          <Text style={[styles.priceValue, { color: colors.primary }]}>
            ${service.defaultPrice.toLocaleString()}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onEdit(service)}
            style={[styles.miniBtn, { backgroundColor: colors.primary + "10" }]}
          >
            <MaterialIcons name="edit" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(service.id)}
            style={[styles.miniBtn, { backgroundColor: colors.danger + "10" }]}
          >
            <MaterialIcons
              name="delete-outline"
              size={18}
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
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  miniBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
