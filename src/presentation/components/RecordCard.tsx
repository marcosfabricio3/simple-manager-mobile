import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { Record } from "@/src/domain/entities/Record";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  record: Record;
  onEdit: (record: Record) => void;
  onDelete: (id: string) => void;
}

export function RecordCard({ record, onEdit, onDelete }: Props) {
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
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            {record.title}
          </Text>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: darkMode ? "#333" : "#F2F2F7" },
            ]}
          >
            <Text style={[styles.typeText, { color: colors.subtext }]}>
              {record.type}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onEdit(record)}
            style={styles.actionButton}
          >
            <MaterialIcons name="edit" size={20} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(record.id)}
            style={styles.actionButton}
          >
            <MaterialIcons name="delete" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  typeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});
