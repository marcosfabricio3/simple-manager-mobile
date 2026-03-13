import { useToast } from "@/components/context/ToastContext";
import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { Client } from "@/src/domain/entities/Client";
import { ClientProfileModal } from "@/src/presentation/components/ClientProfileModal";
import { EmptyState } from "@/src/presentation/components/EmptyState";
import { useClients } from "@/src/presentation/hooks/useClients";
import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ClientsScreen() {
  const { clients, create, remove, update } = useClients();
  const { darkMode } = useSettingsStore();

  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientForProfile, setSelectedClientForProfile] =
    useState<Client | null>(null);

  const { addToast } = useToast();

  const handleSubmit = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanNotes = notes.trim();

    if (!cleanName) {
      addToast("El nombre es requerido", "warning");
      return;
    }

    try {
      if (editing) {
        await update({
          ...editing,
          name: cleanName,
          phone: cleanPhone,
          notes: cleanNotes || undefined,
        });
        addToast("Cliente actualizado", "success");
        setEditing(null);
      } else {
        await create(cleanName, cleanPhone, cleanNotes);
        addToast("Cliente registrado", "success");
      }
      setName("");
      setPhone("");
      setNotes("");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Error", "error");
    }
  };

  const handleEdit = (client: Client) => {
    setEditing(client);
    setName(client.name);
    setPhone(client.phone || "");
    setNotes(client.notes || "");
  };

  const confirmDelete = (id: string, clientName: string) => {
    Alert.alert(
      "Eliminar Cliente",
      `¿Deseas eliminar a ${clientName} del directorio?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          onPress: () => handleDelete(id),
          style: "destructive",
        },
      ],
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      addToast("Cliente eliminado", "info");
    } catch (error) {
      addToast("Error al eliminar", "error");
    }
  };

  const filteredClients = useMemo(() => {
    let result = searchQuery.trim()
      ? clients.filter((c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()),
        )
      : clients;
    return result.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, searchQuery]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: colors.text }]}>
                Clientes
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {clients.length}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.form,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionLabel, { color: colors.subtext }]}>
                {editing ? "Editando Información" : "Registrar nuevo cliente"}
              </Text>

              <TextInput
                placeholder="Nombre completo"
                placeholderTextColor={colors.subtext + "80"}
                value={name}
                onChangeText={setName}
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />
              <TextInput
                placeholder="Teléfono móvil"
                placeholderTextColor={colors.subtext + "80"}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />
              <TextInput
                placeholder="Observaciones (opcional)"
                placeholderTextColor={colors.subtext + "80"}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
                style={[
                  styles.input,
                  styles.textArea,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />

              <View style={styles.actionRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.submitBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitBtnText}>
                    {editing ? "Guardar cambios" : "Registrar cliente"}
                  </Text>
                </TouchableOpacity>
                {editing && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditing(null);
                      setName("");
                      setPhone("");
                      setNotes("");
                    }}
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                  >
                    <Text
                      style={[styles.cancelBtnText, { color: colors.subtext }]}
                    >
                      Anular
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View
              style={[
                styles.searchBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <MaterialIcons name="search" size={20} color={colors.subtext} />
              <TextInput
                placeholder="Buscar por nombre..."
                placeholderTextColor={colors.subtext + "80"}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            iconName="contacts"
            title="Agenda vacía"
            description="No se encontraron clientes que coincidan con la búsqueda."
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.clientCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setSelectedClientForProfile(item)}
            activeOpacity={0.7}
          >
            <View style={styles.clientMain}>
              <Text style={[styles.clientName, { color: colors.text }]}>
                {item.name}
              </Text>
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={14} color={colors.primary} />
                <Text style={[styles.phoneText, { color: colors.subtext }]}>
                  {item.phone || "Sin teléfono"}
                </Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => handleEdit(item)}
                style={styles.miniBtn}
              >
                <MaterialIcons name="edit" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmDelete(item.id, item.name)}
                style={styles.miniBtn}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={18}
                  color={colors.danger}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <ClientProfileModal
        client={selectedClientForProfile}
        visible={!!selectedClientForProfile}
        onClose={() => setSelectedClientForProfile(null)}
        onEditClient={(clientToEdit) => {
          setSelectedClientForProfile(null);
          setTimeout(() => handleEdit(clientToEdit), 300);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  form: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 10, // Guidelines: 10px
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  textArea: {
    height: 60,
    textAlignVertical: "top",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  submitBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  cancelBtn: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  cancelBtnText: {
    fontWeight: "700",
    fontSize: 15,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
  },
  clientCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  clientMain: {
    flex: 1,
  },
  clientName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: "500",
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
  },
  miniBtn: {
    padding: 6,
  },
});
