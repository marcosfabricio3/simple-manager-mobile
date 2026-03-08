import { Service } from "@/src/domain/entities/Service";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

export function ServiceCard({ service, onEdit, onDelete }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={[styles.colorDot, { backgroundColor: service.color }]} />
          <Text style={styles.title}>{service.name}</Text>
        </View>
        <Text style={styles.price}>${service.defaultPrice.toFixed(2)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => onEdit(service)}
        >
          <Text style={styles.buttonTextPrimary}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => onDelete(service.id)}
        >
          <Text style={styles.buttonTextDanger}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F2F2F7",
    marginBottom: 12,
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
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  price: {
    fontSize: 16,
    fontWeight: "500",
    color: "#007AFF",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#F2F2F7",
  },
  deleteButton: {
    backgroundColor: "#FFEEEC",
  },
  buttonTextPrimary: {
    color: "#007AFF",
    fontWeight: "600",
  },
  buttonTextDanger: {
    color: "#FF3B30",
    fontWeight: "600",
  },
});
