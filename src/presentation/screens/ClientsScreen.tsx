import { useToast } from "@/components/context/ToastContext";
import { Client } from "@/src/domain/entities/Client";
import { ClientProfileModal } from "@/src/presentation/components/ClientProfileModal";
import { useClients } from "@/src/presentation/hooks/useClients";
import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ClientsScreen() {
  const { clients, create, remove, update } = useClients();

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
    if (!cleanPhone) {
      addToast("El télefono es requerido", "warning");
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
        addToast("Cliente creado satisfactoriamente", "success");
      }

      setName("");
      setPhone("");
      setNotes("");
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Error inesperado",
        "error",
      );
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
      `¿Seguro que quieres eliminar a ${clientName}?`,
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
      addToast(
        error instanceof Error ? error.message : "Error inesperado",
        "error",
      );
    }
  };

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) {
      return clients.slice().sort((a, b) => a.name.localeCompare(b.name));
    }
    return clients
      .filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, searchQuery]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text style={[styles.headerTitle, { marginBottom: 0 }]}>
          Directorio de Clientes
        </Text>
        <Text style={{ fontSize: 16, color: "#8E8E93", fontWeight: "600" }}>
          Total: {clients.length}
        </Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>
          {editing ? "Editando Cliente" : "Nuevo Cliente"}
        </Text>
        <TextInput
          placeholder="Nombre completo *"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Teléfono *"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          placeholder="Notas adicionales..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
          style={[styles.input, { height: 60, textAlignVertical: "top" }]}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonText}>
              {editing ? "Actualizar" : "Guardar Registro"}
            </Text>
          </TouchableOpacity>
          {editing && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setEditing(null);
                setName("");
                setPhone("");
                setNotes("");
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TextInput
        placeholder="Buscar cliente por nombre..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay clientes registrados.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setSelectedClientForProfile(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>
                <MaterialIcons name="phone" size={14} color="#8E8E93" />{" "}
                {item.phone || "N/D"}
              </Text>
              {item.notes && <Text style={styles.cardNotes}>{item.notes}</Text>}
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => handleEdit(item)}
                style={styles.actionBtn}
              >
                <MaterialIcons name="edit" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmDelete(item.id, item.name)}
                style={styles.actionBtn}
              >
                <MaterialIcons name="delete" size={20} color="#FF3B30" />
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
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: "#F2F2F7",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1C1C1E",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    color: "#8E8E93",
    textTransform: "uppercase",
  },
  formContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#FAFAFA",
    fontSize: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#C7C7CC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#FFF",
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#F2F2F7",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: "#FF3B30",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 32,
    fontSize: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  cardNotes: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
  cardActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
});
